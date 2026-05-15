import { Injectable, NotImplementedException } from '@nestjs/common';
import { CatalogHomeDto } from './dto/catalog-home.dto';
import { SearchCatalogDto } from './dto/search-catalog.dto';

@Injectable()
export class CatalogService {
  async search(query: SearchCatalogDto) {
    throw new NotImplementedException('Catalog search is not implemented yet');
  }

  async home(query: CatalogHomeDto) {
    throw new NotImplementedException('Catalog home is not implemented yet');
  }
}
