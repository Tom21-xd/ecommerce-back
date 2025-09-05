import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    // private JwtService: JwtService,
    private prismaService: PrismaService,
    private productContainerService: ProductContainerService,
  ) {}

  async create(createProductDto: CreateProductDto, id: number | null) {
    const { name, sku, quantity, price, containerId } = createProductDto;

    console.log('user', id);

    const existingProduct = await this.prismaService.product.findFirst({
      where: { containerId, sku },
    });

    if (existingProduct) {
      throw new NotFoundException('Product with this SKU already exists.');
    }

    let productContainerId;

    if (!containerId) {
      console.log('creating product container');

      const productContainer = await this.productContainerService.create({
        name: '',
        userId: id,
      });

      productContainerId = productContainer.id;
      console.log('productContainerId', productContainerId);
    }

    const product = await this.prismaService.product.create({
      data: {
        name,
        sku,
        quantity,
        price,
        containerId: containerId || productContainerId,
      },
    });

    return product;
  }

  async getAllProducts(paginationDTO: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDTO;

    const totalProducts = await this.prismaService.product.count();

    const products = await this.prismaService.product.findMany({
      skip: Number(offset),
      take: Number(limit),
    });

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalPages,
      totalProducts,
    };
  }

  async getAllProductsWithUserData(paginationDTO: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDTO;

    const totalProducts = await this.prismaService.product.count({
      where: {
        container: {
          user: {
            role: 'SELLER',
          },
        },
      },
    });

    const products = await this.prismaService.product.findMany({
      where: {
        container: {
          user: {
            role: 'SELLER',
          },
        },
      },
      skip: Number(offset),
      take: Number(limit),
      include: {
        container: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalPages,
      totalProducts,
    };
  }

  async getAllProductsByUser(userId: number, paginationDTO: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDTO;

    const totalProducts = await this.prismaService.product.count({
      where: {
        container: {
          userId,
        },
      },
    });

    const products = await this.prismaService.product.findMany({
      where: {
        container: {
          userId,
        },
      },
      skip: Number(offset),
      take: Number(limit),
    });

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalPages,
      totalProducts,
    };
  }

  async getMatchProducts(query: { name: string }) {
    const { name } = query;

    const products = await this.prismaService.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            sku: {
              contains: name,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / 10);

    return {
      products,
      totalPages,
      totalProducts,
    };
  }
}
