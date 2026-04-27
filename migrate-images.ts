import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { v2 as cld } from 'cloudinary';

cld.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const images = await prisma.recipeImage.findMany({
    where: {
      publicId: { startsWith: 'https://firebasestorage' },
    },
  });

  console.log(`Найдено ${images.length} картинок для миграции`);

  let success = 0;
  let failed = 0;

  for (const image of images) {
    try {
      const result = await cld.uploader.upload(image.imageUrl, {
        folder: 'recipes',
        resource_type: 'image',
      });

      await prisma.recipeImage.update({
        where: { id: image.id },
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id,
        },
      });

      success++;
      console.log(`✅ ${image.type} → ${result.public_id}`);
    } catch (e) {
      failed++;
      console.error(`❌ ${image.id}:`, e);
    }
  }

  console.log(`\nГотово: ${success} успешно, ${failed} ошибок`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
