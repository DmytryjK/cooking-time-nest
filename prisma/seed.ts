import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });

const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;

const SEED_CREDENTIALS = {
  email: 'asdfasfd@sdfasdfa.com',
  password: '123456',
};

const categoryNames = [
  'Основні страви',
  'Закуски',
  'Десерти',
  'Перші страви',
  'Салати',
  'Випічка',
];

const recipesData = [
  // ── Перші страви ─────────────────────────────────────────────────────────
  {
    category: 'Перші страви',
    title: 'Борщ український',
    description:
      'Традиційний український борщ з буряком, капустою та свининою. Насичений, ароматний, з кислинкою.',
    cookingTimeInMinutes: 90,
    imageSeed: 'borscht-ukrainian',
    ingredients: [
      { name: 'Свинина на кістці', amount: 500, unit: 'г' },
      { name: 'Буряк', amount: 2, unit: 'шт' },
      { name: 'Капуста біла', amount: 300, unit: 'г' },
      { name: 'Картопля', amount: 3, unit: 'шт' },
      { name: 'Морква', amount: 1, unit: 'шт' },
      { name: 'Цибуля ріпчаста', amount: 1, unit: 'шт' },
      { name: 'Томатна паста', amount: 2, unit: 'ст.л.' },
      { name: 'Часник', amount: 3, unit: 'зубчики' },
      { name: 'Сметана', amount: 100, unit: 'г' },
    ],
  },
  {
    category: 'Перші страви',
    title: 'Курячий суп з локшиною',
    description:
      'Легкий та ситний курячий суп з домашньою локшиною та свіжою зеленню. Ідеально для холодного дня.',
    cookingTimeInMinutes: 60,
    imageSeed: 'chicken-noodle-soup',
    ingredients: [
      { name: 'Курка', amount: 800, unit: 'г' },
      { name: 'Яєчна локшина', amount: 150, unit: 'г' },
      { name: 'Морква', amount: 2, unit: 'шт' },
      { name: 'Цибуля', amount: 1, unit: 'шт' },
      { name: 'Корінь петрушки', amount: 1, unit: 'шт' },
      { name: 'Кріп', amount: 30, unit: 'г' },
      { name: 'Сіль', amount: 1, unit: 'ч.л.' },
      { name: 'Чорний перець горошком', amount: 5, unit: 'шт' },
    ],
  },
  {
    category: 'Перші страви',
    title: 'Крем-суп з гарбуза',
    description:
      'Оксамитовий крем-суп із запеченого гарбуза з вершками та імбиром. Яскравий колір і ніжний смак.',
    cookingTimeInMinutes: 45,
    imageSeed: 'pumpkin-cream-soup',
    ingredients: [
      { name: 'Гарбуз', amount: 1000, unit: 'г' },
      { name: 'Вершки 20%', amount: 200, unit: 'мл' },
      { name: 'Цибуля', amount: 1, unit: 'шт' },
      { name: 'Часник', amount: 2, unit: 'зубчики' },
      { name: 'Імбир свіжий', amount: 10, unit: 'г' },
      { name: 'Оливкова олія', amount: 2, unit: 'ст.л.' },
      { name: 'Куркума', amount: 0.5, unit: 'ч.л.' },
      { name: 'Насіння гарбуза', amount: 30, unit: 'г' },
    ],
  },

  // ── Основні страви ───────────────────────────────────────────────────────
  {
    category: 'Основні страви',
    title: 'Котлети по-київськи',
    description:
      'Класичні котлети по-київськи з вершковим маслом та зеленню всередині. Хрустка паніровка та соковита начинка.',
    cookingTimeInMinutes: 50,
    imageSeed: 'chicken-kiev',
    ingredients: [
      { name: 'Куряче філе', amount: 600, unit: 'г' },
      { name: 'Вершкове масло', amount: 100, unit: 'г' },
      { name: 'Петрушка', amount: 20, unit: 'г' },
      { name: 'Часник', amount: 2, unit: 'зубчики' },
      { name: 'Яйця', amount: 2, unit: 'шт' },
      { name: 'Панірувальні сухарі', amount: 150, unit: 'г' },
      { name: 'Борошно', amount: 50, unit: 'г' },
      { name: 'Олія для смаження', amount: 500, unit: 'мл' },
    ],
  },
  {
    category: 'Основні страви',
    title: 'Паста карбонара',
    description:
      'Оригінальна римська паста карбонара з беконом, яєчними жовтками та пармезаном. Без вершків — тільки класика.',
    cookingTimeInMinutes: 25,
    imageSeed: 'pasta-carbonara',
    ingredients: [
      { name: 'Спагеті', amount: 400, unit: 'г' },
      { name: 'Гуанчале або бекон', amount: 200, unit: 'г' },
      { name: 'Яєчні жовтки', amount: 4, unit: 'шт' },
      { name: 'Пармезан', amount: 80, unit: 'г' },
      { name: 'Пекоріно романо', amount: 40, unit: 'г' },
      { name: 'Чорний перець мелений', amount: 1, unit: 'ч.л.' },
      { name: 'Сіль', amount: 1, unit: 'ст.л.' },
    ],
  },
  {
    category: 'Основні страви',
    title: 'Різотто з грибами',
    description:
      'Кремове різотто з білими грибами, пармезаном та білим вином. Справжня італійська страва з ніжною текстурою.',
    cookingTimeInMinutes: 40,
    imageSeed: 'mushroom-risotto',
    ingredients: [
      { name: 'Рис арборіо', amount: 320, unit: 'г' },
      { name: 'Білі гриби', amount: 300, unit: 'г' },
      { name: 'Цибуля-шалот', amount: 2, unit: 'шт' },
      { name: 'Часник', amount: 2, unit: 'зубчики' },
      { name: 'Біле сухе вино', amount: 150, unit: 'мл' },
      { name: 'Курячий бульйон', amount: 1000, unit: 'мл' },
      { name: 'Пармезан', amount: 80, unit: 'г' },
      { name: 'Вершкове масло', amount: 50, unit: 'г' },
    ],
  },
  {
    category: 'Основні страви',
    title: 'Вареники з картоплею та цибулею',
    description:
      'Домашні вареники з ніжним картопляно-цибулевим начинням. Подаються зі шкварками та сметаною.',
    cookingTimeInMinutes: 70,
    imageSeed: 'varenyky-potato',
    ingredients: [
      { name: 'Борошно пшеничне', amount: 400, unit: 'г' },
      { name: 'Вода тепла', amount: 200, unit: 'мл' },
      { name: 'Яйце', amount: 1, unit: 'шт' },
      { name: 'Картопля', amount: 500, unit: 'г' },
      { name: 'Цибуля', amount: 2, unit: 'шт' },
      { name: 'Сало', amount: 100, unit: 'г' },
      { name: 'Вершкове масло', amount: 30, unit: 'г' },
      { name: 'Сметана', amount: 150, unit: 'г' },
    ],
  },
  {
    category: 'Основні страви',
    title: 'Піца Маргарита',
    description:
      'Класична неаполітанська піца з томатним соусом, моцарелою та свіжим базиліком на тонкому хрусткому тісті.',
    cookingTimeInMinutes: 35,
    imageSeed: 'pizza-margherita',
    ingredients: [
      { name: 'Борошно 00', amount: 300, unit: 'г' },
      { name: 'Дріжджі сухі', amount: 5, unit: 'г' },
      { name: 'Томатний соус', amount: 150, unit: 'мл' },
      { name: 'Моцарела', amount: 250, unit: 'г' },
      { name: 'Свіжий базилік', amount: 15, unit: 'г' },
      { name: 'Оливкова олія', amount: 2, unit: 'ст.л.' },
      { name: 'Сіль', amount: 1, unit: 'ч.л.' },
    ],
  },

  // ── Закуски ───────────────────────────────────────────────────────────────
  {
    category: 'Закуски',
    title: 'Оселедець під шубою',
    description:
      'Легендарний святковий салат-закуска: шари оселедця, буряка, моркви, картоплі та яєць під майонезом.',
    cookingTimeInMinutes: 40,
    imageSeed: 'herring-under-fur-coat',
    ingredients: [
      { name: 'Оселедець солоний', amount: 300, unit: 'г' },
      { name: 'Буряк варений', amount: 2, unit: 'шт' },
      { name: 'Картопля варена', amount: 3, unit: 'шт' },
      { name: 'Морква варена', amount: 2, unit: 'шт' },
      { name: 'Яйця варені', amount: 3, unit: 'шт' },
      { name: 'Майонез', amount: 200, unit: 'г' },
      { name: 'Цибуля', amount: 1, unit: 'шт' },
    ],
  },
  {
    category: 'Закуски',
    title: 'Брускетта з томатами',
    description:
      'Хрусткі грінки з підсмаженого хліба з помідорами, часником та свіжим базиліком. Швидка і смачна закуска.',
    cookingTimeInMinutes: 15,
    imageSeed: 'bruschetta-tomato',
    ingredients: [
      { name: 'Чіабата або батон', amount: 1, unit: 'шт' },
      { name: 'Помідори', amount: 4, unit: 'шт' },
      { name: 'Часник', amount: 2, unit: 'зубчики' },
      { name: 'Базилік свіжий', amount: 20, unit: 'г' },
      { name: 'Оливкова олія', amount: 3, unit: 'ст.л.' },
      { name: 'Сіль морська', amount: 0.5, unit: 'ч.л.' },
      { name: 'Чорний перець', amount: 0.25, unit: 'ч.л.' },
    ],
  },
  {
    category: 'Закуски',
    title: 'Гуакамоле',
    description:
      'Мексиканський соус-закуска з стиглих авокадо, лайму та коріандру. Подається з начосами або тортільями.',
    cookingTimeInMinutes: 10,
    imageSeed: 'guacamole-avocado',
    ingredients: [
      { name: 'Авокадо', amount: 3, unit: 'шт' },
      { name: 'Лайм', amount: 1, unit: 'шт' },
      { name: 'Помідор', amount: 1, unit: 'шт' },
      { name: 'Цибуля червона', amount: 0.5, unit: 'шт' },
      { name: 'Коріандр свіжий', amount: 20, unit: 'г' },
      { name: 'Перець чілі', amount: 1, unit: 'шт' },
      { name: 'Сіль', amount: 0.5, unit: 'ч.л.' },
    ],
  },

  // ── Салати ────────────────────────────────────────────────────────────────
  {
    category: 'Салати',
    title: 'Салат Цезар з куркою',
    description:
      'Класичний салат Цезар з ніжним курячим філе, хрусткими крутонами та пікантним соусом на основі пармезану.',
    cookingTimeInMinutes: 30,
    imageSeed: 'caesar-salad-chicken',
    ingredients: [
      { name: 'Куряче філе', amount: 400, unit: 'г' },
      { name: 'Салат романо', amount: 1, unit: 'головка' },
      { name: 'Пармезан', amount: 60, unit: 'г' },
      { name: 'Хліб для крутонів', amount: 100, unit: 'г' },
      { name: 'Майонез', amount: 100, unit: 'г' },
      { name: 'Часник', amount: 1, unit: 'зубчик' },
      { name: 'Анчоуси', amount: 20, unit: 'г' },
      { name: 'Лимонний сік', amount: 1, unit: 'ст.л.' },
    ],
  },
  {
    category: 'Салати',
    title: 'Грецький салат',
    description:
      'Яскравий середземноморський салат з огірками, помідорами, оливками та сиром фета. Легкий та освіжаючий.',
    cookingTimeInMinutes: 15,
    imageSeed: 'greek-salad',
    ingredients: [
      { name: 'Помідори', amount: 4, unit: 'шт' },
      { name: 'Огірок', amount: 2, unit: 'шт' },
      { name: 'Перець болгарський', amount: 1, unit: 'шт' },
      { name: 'Оливки Каламата', amount: 100, unit: 'г' },
      { name: 'Сир фета', amount: 200, unit: 'г' },
      { name: 'Цибуля червона', amount: 1, unit: 'шт' },
      { name: 'Оливкова олія', amount: 3, unit: 'ст.л.' },
      { name: 'Орегано сухий', amount: 1, unit: 'ч.л.' },
    ],
  },
  {
    category: 'Салати',
    title: 'Нікуаз',
    description:
      'Провансальський салат з тунцем, яйцями, зеленою квасолею та оливками. Ситний та елегантний.',
    cookingTimeInMinutes: 30,
    imageSeed: 'salad-nicoise',
    ingredients: [
      { name: 'Тунець консервований', amount: 200, unit: 'г' },
      { name: 'Яйця', amount: 4, unit: 'шт' },
      { name: 'Зелена квасоля', amount: 200, unit: 'г' },
      { name: 'Помідори черрі', amount: 200, unit: 'г' },
      { name: 'Оливки чорні', amount: 80, unit: 'г' },
      { name: 'Картопля молода', amount: 300, unit: 'г' },
      { name: 'Анчоуси', amount: 30, unit: 'г' },
      { name: 'Гірчичний соус', amount: 3, unit: 'ст.л.' },
    ],
  },

  // ── Десерти ───────────────────────────────────────────────────────────────
  {
    category: 'Десерти',
    title: 'Тірамісу',
    description:
      'Найвідоміший італійський десерт: шари савоярді просочених еспресо та кремом маскарпоне з какао.',
    cookingTimeInMinutes: 30,
    imageSeed: 'tiramisu-dessert',
    ingredients: [
      { name: 'Маскарпоне', amount: 500, unit: 'г' },
      { name: 'Яєчні жовтки', amount: 4, unit: 'шт' },
      { name: 'Цукор', amount: 100, unit: 'г' },
      { name: 'Вершки 33%', amount: 200, unit: 'мл' },
      { name: 'Печиво савоярді', amount: 300, unit: 'г' },
      { name: 'Еспресо холодний', amount: 300, unit: 'мл' },
      { name: 'Какао-порошок', amount: 30, unit: 'г' },
      { name: 'Амаретто', amount: 50, unit: 'мл' },
    ],
  },
  {
    category: 'Десерти',
    title: 'Чізкейк Нью-Йорк',
    description:
      'Класичний американський чізкейк із вершкового сиру на пісочній основі. Ніжний, щільний, без випічки верхнього шару.',
    cookingTimeInMinutes: 80,
    imageSeed: 'new-york-cheesecake',
    ingredients: [
      { name: 'Вершковий сир Філадельфія', amount: 750, unit: 'г' },
      { name: 'Цукор', amount: 200, unit: 'г' },
      { name: 'Яйця', amount: 3, unit: 'шт' },
      { name: 'Вершки 33%', amount: 150, unit: 'мл' },
      { name: 'Ванільний екстракт', amount: 1, unit: 'ч.л.' },
      { name: 'Пісочне печиво', amount: 250, unit: 'г' },
      { name: 'Вершкове масло', amount: 80, unit: 'г' },
      { name: 'Лимонна цедра', amount: 1, unit: 'ч.л.' },
    ],
  },
  {
    category: 'Десерти',
    title: 'Морквяний торт',
    description:
      'Вологий і ароматний морквяний торт із вершково-сирним кремом. Тепла кориця та мускатний горіх роблять його незабутнім.',
    cookingTimeInMinutes: 60,
    imageSeed: 'carrot-cake',
    ingredients: [
      { name: 'Морква натерта', amount: 300, unit: 'г' },
      { name: 'Борошно', amount: 250, unit: 'г' },
      { name: 'Цукор', amount: 200, unit: 'г' },
      { name: 'Яйця', amount: 3, unit: 'шт' },
      { name: 'Олія соняшникова', amount: 150, unit: 'мл' },
      { name: 'Кориця', amount: 2, unit: 'ч.л.' },
      { name: 'Вершковий сир', amount: 400, unit: 'г' },
      { name: 'Цукрова пудра', amount: 150, unit: 'г' },
    ],
  },

  // ── Випічка ───────────────────────────────────────────────────────────────
  {
    category: 'Випічка',
    title: 'Пампушки часникові',
    description:
      'Пухкі українські пампушки до борщу з ароматним часниковим маслом та кропом. М\'які, ніжні, незрівнянні.',
    cookingTimeInMinutes: 90,
    imageSeed: 'pampushky-garlic',
    ingredients: [
      { name: 'Борошно', amount: 500, unit: 'г' },
      { name: 'Дріжджі сухі', amount: 7, unit: 'г' },
      { name: 'Молоко тепле', amount: 250, unit: 'мл' },
      { name: 'Яйця', amount: 2, unit: 'шт' },
      { name: 'Цукор', amount: 30, unit: 'г' },
      { name: 'Часник', amount: 5, unit: 'зубчиків' },
      { name: 'Вершкове масло', amount: 50, unit: 'г' },
      { name: 'Кріп', amount: 20, unit: 'г' },
    ],
  },
  {
    category: 'Випічка',
    title: 'Круасани вершкові',
    description:
      'Справжні французькі круасани з хрусткою скоринкою та шаруватим тістом. Трудомістка, але варта того випічка.',
    cookingTimeInMinutes: 180,
    imageSeed: 'croissants-buttery',
    ingredients: [
      { name: 'Борошно пшеничне', amount: 500, unit: 'г' },
      { name: 'Вершкове масло 82%', amount: 250, unit: 'г' },
      { name: 'Молоко', amount: 300, unit: 'мл' },
      { name: 'Дріжджі свіжі', amount: 20, unit: 'г' },
      { name: 'Цукор', amount: 50, unit: 'г' },
      { name: 'Сіль', amount: 8, unit: 'г' },
      { name: 'Яєчний жовток', amount: 1, unit: 'шт' },
    ],
  },
  {
    category: 'Випічка',
    title: 'Банановий хліб',
    description:
      'Вологий, ароматний банановий хліб із шоколадними краплями. Ідеальне використання перестиглих бананів.',
    cookingTimeInMinutes: 65,
    imageSeed: 'banana-bread',
    ingredients: [
      { name: 'Перестиглі банани', amount: 3, unit: 'шт' },
      { name: 'Борошно', amount: 200, unit: 'г' },
      { name: 'Цукор коричневий', amount: 150, unit: 'г' },
      { name: 'Яйця', amount: 2, unit: 'шт' },
      { name: 'Вершкове масло', amount: 80, unit: 'г' },
      { name: 'Сода', amount: 1, unit: 'ч.л.' },
      { name: 'Шоколадні краплі', amount: 100, unit: 'г' },
      { name: 'Ванільний екстракт', amount: 1, unit: 'ч.л.' },
    ],
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(SEED_CREDENTIALS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

async function downloadBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url}`);
  const buffer = await res.arrayBuffer();
  return new Blob([buffer], { type: 'image/jpeg' });
}

async function createRecipe(
  recipe: (typeof recipesData)[0],
  categoryId: string,
  token: string,
): Promise<string> {
  const [mainBlob, previewBlob] = await Promise.all([
    downloadBlob(
      `https://picsum.photos/seed/${encodeURIComponent(recipe.imageSeed)}/800/600`,
    ),
    downloadBlob(
      `https://picsum.photos/seed/${encodeURIComponent(recipe.imageSeed + '_prev')}/400/300`,
    ),
  ]);

  const form = new FormData();
  form.append('title', recipe.title);
  form.append('description', recipe.description);
  form.append('categoryId', categoryId);
  form.append('cookingTimeInMinutes', String(recipe.cookingTimeInMinutes));
  form.append('ingredients', JSON.stringify(recipe.ingredients));
  form.append('mainImage', mainBlob, 'main.jpg');
  form.append('previewImage', previewBlob, 'preview.jpg');

  const res = await fetch(`${API_BASE}/recipes/new`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create "${recipe.title}" (${res.status}): ${text}`);
  }

  const created = (await res.json()) as { id: string; title: string };
  return created.title;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Seed categories
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✓ Categories seeded');

  // 2. Load category map
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  // 3. Authenticate
  const token = await getToken();
  console.log('✓ Authenticated');

  // 4. Create recipes
  let count = 0;
  for (const recipe of recipesData) {
    const categoryId = catMap.get(recipe.category);
    if (!categoryId) {
      console.warn(`  ⚠ Category "${recipe.category}" not found, skipping`);
      continue;
    }

    try {
      const title = await createRecipe(recipe, categoryId, token);
      console.log(`  ✓ [${String(++count).padStart(2, '0')}] ${title}`);
    } catch (err) {
      console.error(`  ✗ ${(err as Error).message}`);
    }
  }

  console.log(`\nDone! Created ${count}/${recipesData.length} recipes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
