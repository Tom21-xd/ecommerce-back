import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { ProductContainerService } from './product-container.service';
import { CreateProductContainerDto } from './dto/create-product-container.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('product-container')
@ApiTags('Product Container')
export class ProductContainerController {
  constructor(
    private readonly productContainerService: ProductContainerService,
  ) {}

  @Post()
  async create(@Body() createProductContainerDto: CreateProductContainerDto) {
    return this.productContainerService.create(createProductContainerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getContainer(@Req() req: Request) {
    const user = req.user as any;
    const userId = user.id;
    return this.productContainerService.getProductContainer(userId);
  }
}
