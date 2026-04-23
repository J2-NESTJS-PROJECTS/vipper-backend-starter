import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CardResponseDto } from './dto/card-response.dto';
import { CardTransactionsQueryDto } from './dto/card-transactions-query.dto';
import { CardStatementsQueryDto } from './dto/card-statements-query.dto';
import { Permissions } from '../common/decorators/permissions.decorator';

@ApiTags('cards')
@ApiBearerAuth('access-token')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get(':id')
  @Permissions({ action: 'read', resource: 'cards' })
  @ApiOperation({ summary: 'Get card by ID from SAP' })
  @ApiParam({ name: 'id', description: 'SAP Card ID' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card not found' })
  findById(@Param('id') id: string): Promise<CardResponseDto> {
    return this.cardsService.findById(id);
  }

  @Get(':id/transactions')
  @Permissions({ action: 'read', resource: 'transactions' })
  @ApiOperation({ summary: 'Get transactions for a card from SAP' })
  @ApiParam({ name: 'id', description: 'SAP Card ID' })
  findCardTransactions(
    @Param('id') id: string,
    @Query() query: CardTransactionsQueryDto,
  ) {
    return this.cardsService.findCardTransactions(id, query);
  }

  @Get(':id/statements')
  @Permissions({ action: 'read', resource: 'statements' })
  @ApiOperation({ summary: 'Get statements for a card from SAP' })
  @ApiParam({ name: 'id', description: 'SAP Card ID' })
  findCardStatements(
    @Param('id') id: string,
    @Query() query: CardStatementsQueryDto,
  ) {
    return this.cardsService.findCardStatements(id, query);
  }
}
