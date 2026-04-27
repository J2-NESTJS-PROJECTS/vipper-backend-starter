import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { GenerateMonthlyConsumptionDto } from './dto/generate-monthly-consumption.dto';
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
  @ApiOperation({ summary: 'Generate account statement PDF from SAP data using month/year and customerId' })
  @ApiBody({ type: GenerateMonthlyConsumptionDto })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file download',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  @ApiResponse({ status: 404, description: 'Account statement not found in SAP' })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  async getMonthlyConsumption(
    @Body() body: GenerateMonthlyConsumptionDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.statementsService.getMonthlyConsumption(body);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`);
    res.setHeader('Content-Length', pdf.content.length.toString());
    res.send(pdf.content);
  }
}
