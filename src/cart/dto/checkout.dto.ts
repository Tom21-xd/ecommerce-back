import { IsInt, IsOptional, Min } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  addressId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sellerId?: number;
}
