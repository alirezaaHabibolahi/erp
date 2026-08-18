import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryProductsListDto } from './dto/query-products-list.dto';
import { ProductService } from './products.service';
import { Serialize } from '@app/common';
import { ProductsListResponseDto } from './dto/query-products-list-response.dto';
import { QueryProductByDateRequestDto } from './dto/query-product-request.dto';
import { ProductResponseDto } from './dto/uery-product-response.dto';
import { JwtAuthGuard } from '../guards/jwt-ath.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findProductByIdForDate(
    @Query() query: QueryProductByDateRequestDto
  ): Promise<ProductResponseDto> {
    return this.productService.findProductByIdForDate(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/list')
  async search(@Query() query: QueryProductsListDto) {
    const result = await this.productService.searchProducts(query);
    return {
      data: result,
      message:"عملیات با موفقیت انجام شد"
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }
}
