import { Controller, Post, Body, Get, Req, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { ProductContainerService } from './product-container.service';
import { CreateProductContainerDto } from './dto/create-product-container.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('product-container')
@ApiTags('Product Container')
export class ProductContainerController {
  constructor(
    private readonly productContainerService: ProductContainerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create product container' })
  async create(@Body() createProductContainerDto: CreateProductContainerDto, @Res() res: Response) {
    const result = await this.productContainerService.create(createProductContainerDto);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'created', result });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my product container' })
  async getContainer(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const userId = user.id;
    const result = await this.productContainerService.getProductContainer(userId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }
}
