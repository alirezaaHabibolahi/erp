import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsDateString,
  Length,
} from 'class-validator';

export class QueryProductByDateRequestDto {
  @IsNotEmpty()
  @IsString({ message: 'شناسه باید یک رشته باشد' })
  @Length(13, 13, { message: 'شناسه باید دقیقاً 13 کاراکتر باشد' })
  id: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'تاریخ باید با فرمت YYYY-MM-DD ارسال شود',
  })
  @IsDateString({}, { message: 'تاریخ باید یک تاریخ معتبر باشد' })
  date: string;
}
