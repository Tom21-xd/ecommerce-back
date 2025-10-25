import {
  Controller,
  UseGuards,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Post('unidad')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create unidad' })
  async createUnidad(@Body() body: { nombre: string }, @Res() res: Response) {
    const result = await this.service.createUnidad(body.nombre);
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Get('unidad')
  @ApiOperation({ summary: 'List unidades' })
  async listUnidad(@Res() res: Response) {
    const result = await this.service.listUnidad();
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Post('marca')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create marca' })
  async createMarca(@Body() body: { nombre: string }, @Res() res: Response) {
    const result = await this.service.createMarca(body.nombre);
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Get('marca')
  @ApiOperation({ summary: 'List marcas' })
  async listMarca(@Res() res: Response) {
    const result = await this.service.listMarca();
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Post('category')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create category' })
  async createCategory(
    @Body() body: { name: string; slug: string; parentId?: number },
    @Res() res: Response,
  ) {
    const result = await this.service.createCategory(body);
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Get('category')
  @ApiOperation({ summary: 'List categories' })
  async listCategories(@Res() res: Response) {
    const result = await this.service.listCategories();
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Post('product-images')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add product image (base64)' })
  async addImage(
    @Body()
    body: {
      productId: number;
      base64: string;
      alt?: string;
      position?: number;
    },
    @Res() res: Response,
  ) {
    const result = await this.service.addImage(
      body.productId,
      body.base64,
      body.alt,
      body.position ?? 0,
    );
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Get('product-images')
  @ApiOperation({ summary: 'List product images' })
  async listImages(
    @Query('productId') productId: string,
    @Res() res: Response,
  ) {
    const result = await this.service.listImages(Number(productId));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add product review (unique per user/product)' })
  async addReview(
    @Req() req: Request,
    @Body() body: { productId: number; rating: number; comment?: string },
    @Res() res: Response,
  ) {
    const user = req.user as any;
    const result = await this.service.addReview(
      user.id,
      body.productId,
      body.rating,
      body.comment,
    );
    return res
      .status(HttpStatus.CREATED)
      .json({ status: 201, message: 'created', result });
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List product reviews' })
  async listReviews(
    @Query('productId') productId: string,
    @Res() res: Response,
  ) {
    const result = await this.service.listReviews(Number(productId));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Delete('unidad/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete unidad' })
  async deleteUnidad(@Param('id') id: string, @Res() res: Response) {
    const result = await this.service.deleteUnidad(Number(id));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'deleted', result });
  }

  @Delete('marca/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete marca' })
  async deleteMarca(@Param('id') id: string, @Res() res: Response) {
    const result = await this.service.deleteMarca(Number(id));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'deleted', result });
  }

  @Delete('category/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string, @Res() res: Response) {
    const result = await this.service.deleteCategory(Number(id));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'deleted', result });
  }
}
