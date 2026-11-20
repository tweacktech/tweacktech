import { NestFactory } from '@nestjs/core';
import { SeedersModule } from './seeders.module';
import { SeedersService } from './seeders.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedersModule);
  const seedersService = app.get(SeedersService);
  await seedersService.seed();
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
