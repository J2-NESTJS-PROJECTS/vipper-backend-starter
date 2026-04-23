import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SapService } from './sap.service';
import { SapRfcClientService } from './sap-rfc-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SapRfcClientService, SapService],
  exports: [SapService],
})
export class SapModule {}
