import { Module } from '@nestjs/common';
import { SeedersService } from './seeders.service';
import { PrismaModule } from '../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeedersService],
  exports: [SeedersService],
})
export class SeedersModule {}
