import { NestFactory } from '@nestjs/core';
import { SeedersModule } from './seeders.module';
import { SeedersService } from './seeders.service';

async function bootstrap() {
  // The seeder creates demo accounts with a publicly documented password.
  // Refuse to run it against a production database unless explicitly unlocked.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error(
      'Refusing to seed a production database. Set ALLOW_PRODUCTION_SEED=true only for a deliberate one-off recovery.',
    );
  }

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
