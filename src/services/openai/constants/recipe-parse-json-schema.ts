import { RECIPE_INGREDIENT_UNITS } from './recipe-ingredient-units';

const ingredientItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    amount: {
      type: 'string',
      description:
        'Numeric quantity as string (e.g. "200", "1/2"). Use "-" only when no number in source.',
    },
    unit: {
      type: 'string',
      enum: [...RECIPE_INGREDIENT_UNITS],
      description: `Unit from allowed list only (${RECIPE_INGREDIENT_UNITS.join(', ')}).`,
    },
  },
  required: ['name', 'amount', 'unit'],
  additionalProperties: false,
} as const;

export function buildRecipeParseJsonSchema(categoryNames: string[]) {
  const categoryEnum =
    categoryNames.length > 0 ? [...new Set(categoryNames)] : undefined;

  const properties: Record<string, unknown> = {
    isRecipe: { type: 'boolean' },
    title: { type: 'string' },
    description: { type: 'string' },
    cookingTimeInMinutes: { type: 'integer' },
    ingredients: {
      type: 'array',
      items: ingredientItemSchema,
    },
    imageSearchQuery: {
      type: 'string',
      description:
        'Short English food photo search query (2-5 words, e.g. "ukrainian borscht food"). Empty string when isRecipe is false.',
    },
  };

  const required = [
    'isRecipe',
    'title',
    'description',
    'cookingTimeInMinutes',
    'ingredients',
    'imageSearchQuery',
  ];

  if (categoryEnum) {
    properties.suggestedCategoryName = {
      type: 'string',
      enum: categoryEnum,
    };
    required.push('suggestedCategoryName');
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}
