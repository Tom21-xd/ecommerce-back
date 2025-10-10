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
import { Public } from 'src/auth/decorators/public.decorator';
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

  @Get('by-phone')
  @Public()
  @ApiOperation({ summary: 'Get cart by phone number (public endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    schema: {
      example: {
        status: 200,
        message: 'ok',
        result: {
          id: 1,
          userId: 1,
          items: [
            {
              id: 1,
              productId: 1,
              qty: 2,
              priceAtAdd: 100.00,
              product: {
                id: 1,
                name: 'Product Name',
                sku: 'SKU123',
                price: 100.00
              }
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found with provided phone number',
    schema: {
      example: {
        status: 404,
        message: 'User not found'
      }
    }
  })
  async getCartByPhone(@Query('phone') phone: string, @Res() res: Response) {
    if (!phone) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: 'Phone number is required' 
      });
    }

    try {
      const result = await this.cartService.getOrCreateCart({ phones: phone });
      return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({ 
        status: 404, 
        message: 'User not found with provided phone number' 
      });
    }
  }

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

  // ========== PUBLIC ENDPOINTS (NO JWT REQUIRED) ==========

  @Post('items/public')
  @Public()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Add item to cart by phone number (public endpoint)' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    schema: {
      example: {
        status: 201,
        message: 'added',
        result: {
          id: 1,
          userId: 1,
          items: [
            {
              id: 1,
              productId: 1,
              qty: 2,
              priceAtAdd: 100.00,
              product: {
                id: 1,
                name: 'Product Name',
                sku: 'SKU123',
                price: 100.00
              }
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Phone number is required or validation failed',
    schema: {
      example: {
        status: 400,
        message: 'Phone number is required'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found with provided phone number',
    schema: {
      example: {
        status: 404,
        message: 'User not found with provided phone number'
      }
    }
  })
  async addItemPublic(@Res() res: Response, @Body() dto: AddItemDto, @Query('phone') phone: string) {
    if (!phone) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: 'Phone number is required' 
      });
    }

    try {
      const result = await this.cartService.addItem({ phones: phone }, dto);
      return res.status(HttpStatus.CREATED).json({ status: 201, message: 'added', result });
    } catch (error) {
      if (error.message === 'User not found with provided phone number') {
        return res.status(HttpStatus.NOT_FOUND).json({ 
          status: 404, 
          message: 'User not found with provided phone number' 
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: error.message || 'Bad request' 
      });
    }
  }

  @Patch('items/:productId/public')
  @Public()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update item qty by phone number (public endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    schema: {
      example: {
        status: 200,
        message: 'updated',
        result: {
          id: 1,
          userId: 1,
          items: [
            {
              id: 1,
              productId: 1,
              qty: 3,
              priceAtAdd: 100.00,
              product: {
                id: 1,
                name: 'Product Name',
                sku: 'SKU123',
                price: 100.00
              }
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Phone number is required or validation failed',
    schema: {
      example: {
        status: 400,
        message: 'Phone number is required'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found with provided phone number',
    schema: {
      example: {
        status: 404,
        message: 'User not found with provided phone number'
      }
    }
  })
  async updateItemPublic(@Res() res: Response, @Param('productId') productId: string, @Body() dto: UpdateItemDto, @Query('phone') phone: string) {
    if (!phone) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: 'Phone number is required' 
      });
    }

    try {
      const result = await this.cartService.updateItem({ phones: phone }, Number(productId), dto.qty);
      return res.status(HttpStatus.OK).json({ status: 200, message: 'updated', result });
    } catch (error) {
      if (error.message === 'User not found with provided phone number') {
        return res.status(HttpStatus.NOT_FOUND).json({ 
          status: 404, 
          message: 'User not found with provided phone number' 
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: error.message || 'Bad request' 
      });
    }
  }

  @Delete('items/:productId/public')
  @Public()
  @ApiOperation({ summary: 'Remove item from cart by phone number (public endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    schema: {
      example: {
        status: 200,
        message: 'removed',
        result: {
          id: 1,
          userId: 1,
          items: []
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Phone number is required',
    schema: {
      example: {
        status: 400,
        message: 'Phone number is required'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found with provided phone number',
    schema: {
      example: {
        status: 404,
        message: 'User not found with provided phone number'
      }
    }
  })
  async removeItemPublic(@Res() res: Response, @Param('productId') productId: string, @Query('phone') phone: string) {
    if (!phone) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: 'Phone number is required' 
      });
    }

    try {
      const result = await this.cartService.removeItem({ phones: phone }, Number(productId));
      return res.status(HttpStatus.OK).json({ status: 200, message: 'removed', result });
    } catch (error) {
      if (error.message === 'User not found with provided phone number') {
        return res.status(HttpStatus.NOT_FOUND).json({ 
          status: 404, 
          message: 'User not found with provided phone number' 
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        status: 400, 
        message: error.message || 'Bad request' 
      });
    }
  }
}
