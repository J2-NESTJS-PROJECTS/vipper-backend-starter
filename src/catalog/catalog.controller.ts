import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';
import { CatalogHomeDto } from './dto/catalog-home.dto';
import { SearchCatalogDto } from './dto/search-catalog.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search businesses, branches, categories and products' })
  search(@Query() query: SearchCatalogDto) {
    return this.catalogService.search(query);
  }

  @Public()
  @Get('home')
  @ApiOperation({ summary: 'Get catalog home data' })
  home(@Query() query: CatalogHomeDto) {
    return this.catalogService.home(query);
  }
}
