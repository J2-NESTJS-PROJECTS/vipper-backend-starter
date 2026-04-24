import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { GenerateMonthlyConsumptionDto } from './dto/generate-monthly-consumption.dto';
import { MonthlyConsumptionResponseDto } from './dto/monthly-consumption-response.dto';
import { StatementsService } from './statements.service';
import { StatementsQueryDto } from './dto/statements-query.dto';
import { StatementResponseDto } from './dto/statement-response.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('statements')
@ApiBearerAuth('access-token')
@Controller('statements')
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get()
  @Permissions({ action: 'read', resource: 'statements' })
  @ApiOperation({ summary: 'Get account statements from SAP with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of account statements',
  })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  findAll(
    @Query() query: StatementsQueryDto,
  ): Promise<PaginatedResponseDto<StatementResponseDto>> {
    return this.statementsService.findAll(query);
  }

  @Post('monthly-consumption')
  @HttpCode(HttpStatus.OK)
  @Permissions({ action: 'read', resource: 'statements' })
  @ApiOperation({ summary: 'Get monthly card consumptions from SAP using a cutoff date' })
  @ApiBody({ type: GenerateMonthlyConsumptionDto })
  @ApiResponse({
    status: 200,
    description: 'Monthly consumption report data',
    type: MonthlyConsumptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  @ApiResponse({ status: 404, description: 'Monthly consumption report not found' })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  getMonthlyConsumption(
    @Body() body: GenerateMonthlyConsumptionDto,
  ): Promise<MonthlyConsumptionResponseDto> {
    return this.statementsService.getMonthlyConsumption(body);
  }
}
