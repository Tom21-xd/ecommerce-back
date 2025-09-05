import { PartialType } from '@nestjs/mapped-types';
import { CreateProductContainerDto } from './create-product-container.dto';

export class UpdateProductContainerDto extends PartialType(CreateProductContainerDto) {}
