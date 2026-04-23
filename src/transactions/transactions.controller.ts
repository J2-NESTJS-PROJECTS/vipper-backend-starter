import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Permissions({ action: 'read', resource: 'transactions' })
  @ApiOperation({ summary: 'Get transactions from SAP with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of transactions',
  })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  findAll(
    @Query() query: TransactionsQueryDto,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    return this.transactionsService.findAll(query);
  }
}
