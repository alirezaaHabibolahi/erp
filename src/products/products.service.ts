import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryProductsListDto } from './dto/query-products-list.dto';
import { IProductDoc } from '@/types/product';
import { ProductRepository } from './products.repository';
import { PaginatedResult } from '../types/general.type';
import { DateHelper } from '@app/common';
import { ProductResponseDto } from './dto/uery-product-response.dto';
import { QueryProductByDateRequestDto } from './dto/query-product-request.dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async searchProducts(query: QueryProductsListDto): Promise<PaginatedResult<Partial<IProductDoc>>> {
    if (!query.id && !query.description) {
      throw new BadRequestException(
        'Provide at least "id" or "description" to search products.',
      );
    }

    const filter = this.productRepository.buildFilter({
      id: query.id,
      description: query.description,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.productRepository.findPaginated(filter, page, limit);
    result.data = result.data.map(item => ({
      ...item,
      RunDate: item.RunDate ? new Date(DateHelper.convert(item.RunDate,"en","fa","YYYY-MM-DD")) : new Date(),
      ExpirationDate: item.ExpirationDate ? new Date(DateHelper.convert(item.ExpirationDate,"en","fa","YYYY-MM-DD")) : null,
      CreateDate: item.CreateDate ? new Date(DateHelper.convert(item.CreateDate,"en","fa","YYYY-MM-DD")) : new Date(),
      LastEditDate: item.LastEditDate ? new Date(DateHelper.convert(item.LastEditDate,"en","fa","YYYY-MM-DD")) : new Date(),
    }));

    return result

  }

  async getById(id: string): Promise<IProductDoc> {
    const product = await this.productRepository.findOneById(id);
    if (!product) {
      throw new NotFoundException(` کالایی با شناسه "${id}" یافت نشد`);
    }
    return product;
  }

  async findProductByIdForDate(
    query: QueryProductByDateRequestDto
  ): Promise<ProductResponseDto> {
    const { date, id} = query
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    let targetDate: Date = new Date();
    if(date){
      try {
        if (DateHelper.isJalali(date)) {
          targetDate = DateHelper.convertJalaliToGregorian(date)
        } else {
          targetDate = new Date(date);
        }
      } catch (error) {
        throw new BadRequestException(error.message);
      }
      const now = new Date();
      if (date && targetDate > now) {
        throw new BadRequestException('تاریخ انتخابی نمیتواند از تاریخ امروز بزرگتر باشد');
      }
    }

    targetDate = new Date(targetDate.setUTCHours(0,0,0,0));
    const result = await this.productRepository.findProductByIdWithDateFallback(
      id,
      targetDate,
    );

    if (!result.product) {
      throw new NotFoundException(`کالایی با شناسه ${id} یافت نشد.`);
    }

    const runDate: string = DateHelper.convert(result.product.RunDate,"en","fa","YYYY-MM-DD");
    const createDate: string = DateHelper.convert(result.product.CreateDate,"en","fa","YYYY-MM-DD");
    const expirationDate: string | null = result.product.ExpirationDate ? DateHelper.convert(result.product.ExpirationDate,"en","fa","YYYY-MM-DD") : null;


    return {
      code: result.product.ID,
      description: result.product.DescriptionOfID || '',
      vatRate: result.product.VAT || 0,
      runDate: runDate,
      createDate: createDate,
      expirationDate: expirationDate,
      warning: result.warning,
    };
  }
}
