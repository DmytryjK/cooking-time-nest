/** Allowed ingredient units for LLM structured output (Ukrainian). */

export const RECIPE_INGREDIENT_UNITS = [
  'гр',
  'кг',
  'л',
  'мл.',
  'шт.',
  'ч.л.',
  'ст.л.',
  'зубч.',
  'стак.',
  'щіпка',
  'шматок',
] as const;

export type RecipeIngredientUnit = (typeof RECIPE_INGREDIENT_UNITS)[number];

/** Used when quantity is vague or not expressible as a number. */

export const RECIPE_INGREDIENT_AMOUNT_PLACEHOLDER = '-';

const NUMERIC_AMOUNT_PATTERN =
  /^(\d+([.,]\d+)?(\s*-\s*\d+([.,]\d+)?)?|\d+\s*\/\s*\d+)$/;

export function isNumericIngredientAmount(amount: string): boolean {
  const trimmed = amount.trim();

  return trimmed.length > 0 && NUMERIC_AMOUNT_PATTERN.test(trimmed);
}

/** Keeps numeric amounts; maps empty / non-numeric text to "-". */

export function normalizeIngredientAmount(amount: string): string {
  const trimmed = amount.trim();

  if (!trimmed || trimmed === RECIPE_INGREDIENT_AMOUNT_PLACEHOLDER) {
    return RECIPE_INGREDIENT_AMOUNT_PLACEHOLDER;
  }

  if (!isNumericIngredientAmount(trimmed)) {
    return RECIPE_INGREDIENT_AMOUNT_PLACEHOLDER;
  }

  return trimmed.replace(',', '.');
}

export const RECIPE_INGREDIENT_FORMAT_INSTRUCTIONS = `Ingredient amount and unit rules:

- amount: numeric string only — digits with optional decimal (200, 1.5), fraction (1/2), or range (2-3). If quantity is vague, missing, or only described in words (e.g. "за смаком", "трохи", "пучок"), set amount to "${RECIPE_INGREDIENT_AMOUNT_PLACEHOLDER}".

- unit: exactly one value from the allowed units list (copy spelling exactly, including dots: ${RECIPE_INGREDIENT_UNITS.join(', ')}).`;
