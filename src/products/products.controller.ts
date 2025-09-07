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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@Controller('products')
@ApiTags('Products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({
    description: 'Data required to create a product',
    type: CreateProductDto,
    examples: {
      example1: {
        summary: 'Example of a product creation request',
        value: {
          name: 'Sample Product',
          sku: 'SP-001',
          quantity: 10,
          price: 99.99,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product has been created successfully.',
    schema: {
      example: {
        status: 201,
        message: 'Product has been created successfully',
        result: {
          id: 'product-id',
          name: 'Sample Product',
          price: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for the provided input.',
    schema: {
      example: {
        status: 'Error',
        message: 'Validation failed',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authorized to create a product.',
    schema: {
      example: {
        status: 'Error',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createProductDto: CreateProductDto,
  ) {
    const user = req.user as any;
    const userId = user.id;
    try {
      const result = await this.productsService.create(
        createProductDto,
        userId,
      );
      return res.status(HttpStatus.CREATED).json({
        status: 201,
        message: 'Product has been created successfully',
        result,
      });
    } catch (err) {
      console.log(err);

      res.statusMessage = err.response?.message || 'Internal Server Error';
      return res.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }

  @Get()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products.',
    schema: {
      example: {
        status: 200,
        message: 'ok',
        result: {
          products: [
            { id: 'product-id-1', name: 'Sample Product 1', price: 100 },
          ],
          totalPages: 1,
          totalProducts: 1000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for the provided input.',
    schema: { example: { status: 'Error', message: 'Validation failed' } },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: { status: 'Error', message: 'An unexpected error occurred.' },
    },
  })
  async getAllUserProducts(@Query() pagination: PaginationDto) {
    try {
      const result = await this.productsService.getAllProducts(pagination);
      // getAllProducts devuelve { products, totalPages, totalProducts } :contentReference[oaicite:1]{index=1}
      return {
        status: HttpStatus.OK,
        message: 'ok',
        result,
      };
    } catch (err) {
      const { HttpException, HttpStatus } = await import('@nestjs/common');
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : Number((err as any)?.status ?? (err as any)?.statusCode) ||
            HttpStatus.INTERNAL_SERVER_ERROR;

      const resp = err instanceof HttpException ? err.getResponse() : null;
      const message =
        typeof resp === 'string'
          ? resp
          : ((resp as any)?.message ??
            (err as any)?.message ??
            'Internal Server Error');

      throw new HttpException({ status, message }, status);
    }
  }

  @Get('/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Get all products with user role equal to SELLER' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products with user information.',
    schema: {
      example: {
        status: 200,
        message: 'ok',
        result: {
          products: [
            {
              productId: 'product-id-1',
              name: 'Sample Product 1',
              price: 100,
              user: {
                id: 'seller-id-1',
                username: 'Seller1',
              },
            },
            {
              productId: 'product-id-2',
              name: 'Sample Product 2',
              price: 200,
              user: {
                id: 'seller-id-2',
                username: 'Seller2',
              },
            },
          ],
          totalPages: 1,
          totaProduct: 1000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authorized.',
    schema: {
      example: {
        status: 'Error',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have the required role.',
    schema: {
      example: {
        status: 'Error',
        message: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async getAllUserProductsWithUserInfo(
    @Req() req: Request,
    @Res() res: Response,
    @Query() pagination: PaginationDto,
  ) {
    try {
      const result =
        await this.productsService.getAllProductsWithUserData(pagination);

      return res.status(HttpStatus.OK).json({
        staus: 200,
        message: 'ok',
        result,
      });
    } catch (err) {
      console.log(err);
      res.statusMessage = err.response?.message || 'Internal Server Error';
      return res.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Get all products related to an userId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved products related to the user.',
    schema: {
      example: {
        status: 200,
        message: 'ok',
        result: {
          products: [
            {
              id: 'product-id-1',
              name: 'Sample Product 1',
              price: 100,
            },
            {
              id: 'product-id-2',
              name: 'Sample Product 2',
              price: 200,
            },
          ],
          totalPages: 1,
          totaProduct: 1000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. User is not authenticated.',
    schema: {
      example: {
        status: 'Error',
        message: 'Unauthorized access.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async getAllProductsByUser(
    @Req() req: Request,
    @Res() res: Response,
    @Query() pagination: PaginationDto,
  ) {
    const user = req.user as any;
    const userId = user.id;

    try {
      const result = await this.productsService.getAllProductsByUser(
        userId,
        pagination,
      );

      return res.status(HttpStatus.OK).json({
        staus: 200,
        message: 'ok',
        result,
      });
    } catch (err) {
      console.log(err);

      res.statusMessage = err.response?.message || 'Internal Server Error';
      return res.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }

  @Get('/match')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Get products that match with query' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved matching products.',
    schema: {
      example: {
        status: 200,
        message: 'ok',
        result: {
          products: [
            {
              id: 'product-id-1',
              name: 'Sample Product 1',
              price: 100,
            },
            {
              id: 'product-id-2',
              name: 'Sample Product 2',
              price: 200,
            },
          ],
          totalPages: 1,
          totaProduct: 1000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters.',
    schema: {
      example: {
        status: 'Error',
        message: 'Invalid query parameters.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async getMatchProduct(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: { name: string },
  ) {
    try {
      const result = await this.productsService.getMatchProducts(query);

      return res.status(HttpStatus.OK).json({
        staus: 200,
        message: 'ok',
        result,
      });
    } catch (err) {
      console.log(err);

      res.statusMessage = err.response?.message || 'Internal Server Error';
      return res.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }
}
