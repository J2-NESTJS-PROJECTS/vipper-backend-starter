import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SapConnectionException, SapException } from '../common/exceptions/sap.exception';

@Injectable()
export class SapRfcClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SapRfcClientService.name);
  private client: any = null;
  private rfcLib: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private async initializeConnection() {
    try {
      this.rfcLib = require('node-rfc');

      const connectionParams = {
        ashost: this.configService.get<string>('sap.host'),
        sysnr: this.configService.get<string>('sap.sysnr'),
        client: this.configService.get<string>('sap.client'),
        user: this.configService.get<string>('sap.user'),
        passwd: this.configService.get<string>('sap.passwd'),
        lang: this.configService.get<string>('sap.lang'),
      };

      this.client = new this.rfcLib.Client(connectionParams);
      await this.client.open();
      this.logger.log('SAP RFC connection established');
    } catch (error) {
      this.logger.error(`SAP RFC connection failed: ${error.message}`, error.stack);
      this.client = null;
    }
  }

  private async closeConnection() {
    if (this.client) {
      try {
        await this.client.close();
        this.logger.log('SAP RFC connection closed');
      } catch (error) {
        this.logger.error(`Error closing SAP connection: ${error.message}`);
      }
    }
  }

  async call(rfcFunctionName: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.client) {
      throw new SapConnectionException('SAP client is not initialized');
    }

    try {
      if (!this.client.alive) {
        this.logger.warn('SAP connection lost, reconnecting...');
        await this.initializeConnection();
      }

      this.logger.debug(`Calling SAP RFC: ${rfcFunctionName} with params: ${JSON.stringify(params)}`);
      const result = await this.client.call(rfcFunctionName, params);
      this.logger.debug(`SAP RFC ${rfcFunctionName} returned successfully`);
      return result;
    } catch (error) {
      this.logger.error(`SAP RFC call failed [${rfcFunctionName}]: ${error.message}`);
      throw new SapException(
        `RFC call failed: ${error.message}`,
        rfcFunctionName,
        error,
      );
    }
  }

  get isConnected(): boolean {
    return this.client !== null && this.client?.alive === true;
  }
}
