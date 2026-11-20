import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CurrenciesModule } from '../currencies/currencies.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [CurrenciesModule, CertificatesModule, MediaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
