import {
  BadGatewayException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { config } from '@/config/config';
import { PrismaService } from '@/database/prisma';
import type { YtdlpExtractResult } from '@/services/ytdlp';
import { buildRecipeParseJsonSchema } from './constants/recipe-parse-json-schema';
import { RECIPE_DESCRIPTION_HTML_INSTRUCTIONS } from './constants/recipe-description-html-format';
import {
  normalizeIngredientAmount,
  RECIPE_INGREDIENT_FORMAT_INSTRUCTIONS,
  RECIPE_INGREDIENT_UNITS,
} from './constants/recipe-ingredient-units';
import type {
  RecipeLlmIngredient,
  RecipeLlmParseResult,
} from './types/recipe-llm-parse-result.type';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly apiKey = config.openai.apiKey?.trim();
  private readonly model = config.openai.model;
  private readonly temperature = config.openai.temperature;
  private readonly maxTokens = config.openai.maxTokens;
  private readonly client: OpenAI | null;

  constructor(private readonly prisma: PrismaService) {
    this.client = this.apiKey
      ? new OpenAI({
          apiKey: this.apiKey,
          timeout: config.openai.timeoutMs,
        })
      : null;
  }

  async parseRecipeFromVideo(
    extract: YtdlpExtractResult,
  ): Promise<RecipeLlmParseResult> {
    if (!this.client) {
      throw new BadGatewayException(
        'OpenAI не налаштовано (відсутній OPENAI_API_KEY)',
      );
    }

    const categoryNames = await this.loadCategoryNames();
    const userContent = this.buildUserPrompt(extract, categoryNames);
    const jsonSchema = buildRecipeParseJsonSchema(categoryNames);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe_parse',
            strict: true,
            schema: jsonSchema,
          },
        },
      });

      const raw = completion.choices[0]?.message?.content;

      if (!raw) {
        throw new Error('Empty OpenAI response');
      }

      const parsed = JSON.parse(raw) as RecipeLlmParseResult;

      return this.validateParseResult(parsed, categoryNames);
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'OpenAI request failed';

      this.logger.warn(`OpenAI parse failed: ${message}`);

      throw new BadGatewayException('Не вдалось обробити відео через AI');
    }
  }

  private async loadCategoryNames(): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => c.name);
  }

  private buildUserPrompt(
    extract: YtdlpExtractResult,
    categoryNames: string[],
  ): string {
    const sections: string[] = [
      `Source URL: ${extract.sourceUrl}`,
      `Platform video ID: ${extract.platformVideoId}`,
      `Title: ${extract.title || '(empty)'}`,
      `Description: ${extract.description || '(empty)'}`,
      `Tags: ${extract.tags.length > 0 ? extract.tags.join(', ') : '(none)'}`,
    ];

    if (extract.durationSeconds != null) {
      sections.push(`Duration (seconds): ${extract.durationSeconds}`);
    }

    sections.push(
      `Subtitles / transcript:\n${extract.subtitleText.trim() || '(empty)'}`,
    );
    sections.push(
      'Return the recipe draft in Ukrainian (translate from any source language if needed).',
    );

    if (categoryNames.length > 0) {
      sections.push(
        `Allowed categories (pick exactly one for suggestedCategoryName):\n${categoryNames.map((name) => `- ${name}`).join('\n')}`,
      );
    }

    sections.push(
      `Allowed ingredient units (use exactly as written): ${RECIPE_INGREDIENT_UNITS.join(', ')}`,
    );
    sections.push(RECIPE_INGREDIENT_FORMAT_INSTRUCTIONS);
    sections.push(RECIPE_DESCRIPTION_HTML_INSTRUCTIONS);

    return sections.join('\n\n');
  }

  private validateParseResult(
    parsed: RecipeLlmParseResult,
    categoryNames: string[],
  ): RecipeLlmParseResult {
    if (typeof parsed.isRecipe !== 'boolean') {
      throw new Error('Invalid isRecipe field');
    }

    if (!parsed.isRecipe) {
      return { isRecipe: false };
    }

    const title = parsed.title?.trim();
    const cookingTimeInMinutes = parsed.cookingTimeInMinutes;
    const ingredients = this.normalizeIngredients(parsed.ingredients);

    if (!title) {
      throw new Error('Recipe title is missing');
    }

    if (
      typeof cookingTimeInMinutes !== 'number' ||
      !Number.isFinite(cookingTimeInMinutes) ||
      cookingTimeInMinutes <= 0
    ) {
      throw new Error('Invalid cookingTimeInMinutes');
    }

    if (ingredients.length === 0) {
      throw new Error('Ingredients are missing');
    }

    const description = parsed.description?.trim();

    if (!description) {
      throw new Error('Recipe description (HTML steps) is missing');
    }

    const suggestedCategoryName = this.normalizeCategoryName(
      parsed.suggestedCategoryName,
      categoryNames,
    );

    const imageSearchQuery = parsed.imageSearchQuery?.trim();

    if (!imageSearchQuery) {
      throw new Error('imageSearchQuery is missing');
    }

    return {
      isRecipe: true,
      title,
      description,
      cookingTimeInMinutes: Math.round(cookingTimeInMinutes),
      ingredients,
      suggestedCategoryName,
      imageSearchQuery,
    };
  }

  private normalizeCategoryName(
    value: string | undefined,
    categoryNames: string[],
  ): string | undefined {
    const trimmed = value?.trim();

    if (!trimmed || categoryNames.length === 0) {
      return undefined;
    }

    const match = categoryNames.find(
      (name) => name.toLowerCase() === trimmed.toLowerCase(),
    );

    return match ?? trimmed;
  }

  private normalizeIngredients(
    ingredients: RecipeLlmIngredient[] | undefined,
  ): RecipeLlmIngredient[] {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    const allowedUnits = new Set<string>(RECIPE_INGREDIENT_UNITS);

    return ingredients
      .map((item) => ({
        name: item.name?.trim() ?? '',
        amount: normalizeIngredientAmount(item.amount ?? ''),
        unit: item.unit?.trim() ?? '',
      }))
      .filter((item) => item.name && item.unit && allowedUnits.has(item.unit));
  }
}

const SYSTEM_PROMPT = `You analyze text extracted from a short cooking video (TikTok/Instagram).

Return JSON only, matching the schema.

Rules:
- Set isRecipe to false if the text does NOT contain enough information for a real recipe: at least several ingredients AND how to cook the dish. A title or generic description alone is NOT a recipe. When isRecipe is false, still return all schema fields with placeholders: title="", description="", cookingTimeInMinutes=0, ingredients=[], imageSearchQuery="". If suggestedCategoryName is required, set it to "Uncategorized" when listed, otherwise the first allowed category.
- Set isRecipe to true only when you can extract a usable recipe draft.
- When isRecipe is true, fill title, cookingTimeInMinutes (reasonable estimate in minutes), ingredients (name, amount, unit), description (required), suggestedCategoryName, and imageSearchQuery.
- imageSearchQuery: short English query for food stock photos (2-5 words, lowercase, include "food" when helpful, e.g. "chicken curry food", "ukrainian borscht soup"). Must be English only, not Ukrainian/Russian.
- description: full step-by-step instructions as HTML for react-quill (see user message format). Make it detailed — all clear steps from the source, not a one-line summary.
- suggestedCategoryName: pick exactly one value from the allowed categories list in the user message (must match exactly).
- ingredient unit: pick only from the allowed units list in the user message (exact spelling: гр, мл., шт., ч.л., ст.л., зубч., стак., щіпка, etc.).
- ingredient amount: numeric string only (e.g. "200", "1.5", "1/2", "2-3"). If quantity is not numeric or unclear, use "-".
- Output language: Ukrainian only for all text fields (title, description HTML, ingredient names, suggestedCategoryName). If the source is Russian, English, mixed, or transliteration — translate/normalize to natural Ukrainian. Do not leave Russian or English in the response.
- Do not invent ingredients or steps that are not supported by the provided text.`;
