import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Res,
  HttpStatus,
  Get,
  Query,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddItemDto } from './dto/add-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartService } from './cart.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getMyCart(@Req() req: Request, @Res() res: Response, @Query('phones') phones?: string) {
    const user = req.user as any;
    const result = await this.cartService.getOrCreateCart({ userId: user?.id ?? null, phones });
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Post('items')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Req() req: Request, @Res() res: Response, @Body() dto: AddItemDto, @Query('phones') phones?: string) {
    const user = req.user as any;
    const result = await this.cartService.addItem({ userId: user?.id ?? null, phones }, dto);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'added', result });
  }

  @Patch('items/:productId')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update item qty (0 to remove)' })
  async updateItem(@Req() req: Request, @Res() res: Response, @Param('productId') productId: string, @Body() dto: UpdateItemDto, @Query('phones') phones?: string) {
    const user = req.user as any;
    const result = await this.cartService.updateItem({ userId: user?.id ?? null, phones }, Number(productId), dto.qty);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'updated', result });
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Req() req: Request, @Res() res: Response, @Param('productId') productId: string, @Query('phones') phones?: string) {
    const user = req.user as any;
    const result = await this.cartService.removeItem({ userId: user?.id ?? null, phones }, Number(productId));
    return res.status(HttpStatus.OK).json({ status: 200, message: 'removed', result });
  }

  @Post('checkout')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Checkout -> creates pedido + detalles + addresses, empties cart' })
  async checkout(@Req() req: Request, @Res() res: Response, @Body() dto: CheckoutDto, @Query('phones') phones?: string) {
    const user = req.user as any;
    const result = await this.cartService.checkout({ userId: user?.id ?? null, phones }, dto);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'order created', result });
  }
}
