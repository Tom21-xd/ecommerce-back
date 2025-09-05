import { IsInt, Min } from 'class-validator';

export class AddItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  qty: number;
}
