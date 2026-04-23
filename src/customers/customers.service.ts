import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SapService } from '../sap/sap.service';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CardResponseDto } from '../cards/dto/card-response.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly sapService: SapService) {}

  async findById(customerId: string): Promise<CustomerResponseDto> {
    this.logger.debug(`Fetching customer ${customerId} from SAP`);
    const sapData = await this.sapService.getCustomerById(customerId);

    if (!sapData || !sapData.id) {
      throw new NotFoundException(`Customer ${customerId} not found in SAP`);
    }

    return this.mapToResponseDto(sapData);
  }

  async findCustomerCards(customerId: string): Promise<CardResponseDto[]> {
    this.logger.debug(`Fetching cards for customer ${customerId} from SAP`);
    await this.findById(customerId);

    const sapCards = await this.sapService.getCustomerCards(customerId);
    return sapCards.map((card) => ({
      id: card.id,
      customerId: card.customerId,
      maskedNumber: card.maskedNumber,
      type: card.type,
      brand: card.brand,
      status: card.status,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      currentBalance: card.currentBalance,
      currency: card.currency,
      expiryDate: card.expiryDate,
      issueDate: card.issueDate,
    }));
  }

  private mapToResponseDto(sapData: any): CustomerResponseDto {
    return {
      id: sapData.id,
      fullName: sapData.fullName,
      documentNumber: sapData.documentNumber,
      status: sapData.status,
      creditLimit: sapData.creditLimit,
      usedCredit: sapData.usedCredit,
      availableCredit: sapData.availableCredit,
      balance: sapData.balance,
      overdueBalance: sapData.overdueBalance,
      expirationDate: sapData.expirationDate,
      nextPaymentDate: sapData.nextPaymentDate,
      cardNumber: sapData.cardNumber,
    };
  }
}
