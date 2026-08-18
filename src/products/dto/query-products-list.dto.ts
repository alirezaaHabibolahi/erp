import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Length,
  IsDateString,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsListDto {

  @IsNotEmpty()
  @IsString({ message: 'شناسه باید یک رشته باشد' })
  @Length(13, 13, { message: 'شناسه باید دقیقاً 13 کاراکتر باشد' })
  id: string;

  @IsOptional()
  @IsString({ message: 'توضیحات باید یک رشته باشد' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'صفحه باید حداقل ۱ باشد' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد در هر صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد در هر صفحه باید حداقل ۱ باشد' })
  @Max(100, { message: 'تعداد در هر صفحه نباید بیشتر از ۱۰۰ باشد' })
  limit?: number = 20;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ شروع باید یک تاریخ معتبر باشد' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ پایان باید یک تاریخ معتبر باشد' })
  @ValidateIf((o) => o.startDate !== undefined)
  endDate?: string;
}