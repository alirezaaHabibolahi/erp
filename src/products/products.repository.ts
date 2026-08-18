import { Inject, Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { IProductDoc } from '@/types/product';
import { Models } from '@app/common';
import { PaginatedResult } from '../types/general.type';

export interface ProductFilterOptions {
  id?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

@Injectable()
export class ProductRepository {
  constructor(@Inject('ModelService') private readonly models: Models) {}

  private get productModel() {
    return this.models.product.model;
  }

  buildFilter(options: ProductFilterOptions): FilterQuery<IProductDoc> {
    const filter: FilterQuery<IProductDoc> = { isActive: true };

    if (options.id) {
      filter.ID = options.id.trim();
    }

    if (options.description) {
      // const escaped = options.description.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // filter.DescriptionOfID = new RegExp(`^${escaped}`, 'i');
      filter.DescriptionOfID = options.description.trim();
    }

    return filter;
  }

  async findPaginated(
    filter: FilterQuery<IProductDoc>,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Partial<IProductDoc>>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .select({ _id: 1, DescriptionOfID: 1, ID: 1, VAT:1, Taxable:1, RunDate:1, ExpirationDate:1, Type:1, CreateDate:1, LastEditDate:1 })
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  async findOneById(id: string): Promise<IProductDoc | null> {
    return this.productModel
      .findOne({ ID: id.trim(), isActive: true })
      .lean()
      .exec();
  }


  async findProductByIdWithDateFallback(
    id: string,
    targetDate: Date = new Date(),
  ): Promise<{
    product: IProductDoc | null;
    warning: string | null;
    isValid: boolean;
  }> {
    const validProduct = await this.productModel
      .findOne({
        ID: id,
        isActive: true,
        deletedAt: null,
        RunDate: { $lte: targetDate },
        $or: [
          { ExpirationDate: null },
          { ExpirationDate: { $gte: targetDate } },
        ],
      })
      .sort({ RunDate: -1 })
      .lean()
      .exec();

    if (validProduct) {
      return {
        product: validProduct,
        warning: null,
        isValid: true,
      };
    }

    const nearestBeforeProduct = await this.productModel
      .findOne({
        ID: id,
        isActive: true,
        deletedAt: null,
        RunDate: { $lt: targetDate },
      })
      .sort({ RunDate: -1 })
      .lean()
      .exec();

    if (nearestBeforeProduct) {
      return {
        product: nearestBeforeProduct,
        warning:
          'شناسه در تاریخ درخواست معتبر نیست؛ آخرین نرخ معتبر قبلی بازگردانده شد',
        isValid: false,
      };
    }

    return {
      product: null,
      warning: 'شناسه محصول یافت نشد',
      isValid: false,
    };
  }
}
