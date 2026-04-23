import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
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
}
