import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prismaService: PrismaService,
    private productContainerService: ProductContainerService,
  ) {}

  async create(createProductDto: CreateProductDto, id: number | null) {
    const {
      name,
      sku,
      quantity,
      price,
      containerId,
      unidadId,
      marcaId,
      categoryIds,
      images,
      minStock,
      isActive,
    } = createProductDto;

    const existingProduct = await this.prismaService.product.findFirst({
      where: { containerId: containerId ?? undefined, sku },
    });
    if (existingProduct) {
      throw new NotFoundException(
        'Product with this SKU already exists in this container.',
      );
    }

    let productContainerId: number | undefined = containerId ?? undefined;
    if (!productContainerId) {
      const productContainer = await this.productContainerService.create({
        name: '',
        userId: id,
      });
      productContainerId = productContainer.id;
    }

    const categoryData =
      categoryIds && categoryIds.length > 0
        ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
        : undefined;

    const imageData =
      images && images.length > 0
        ? {
            create: images.map((img) => ({
              base64: img.base64,
              alt: img.alt,
              position: img.position ?? 0,
            })),
          }
        : undefined;

    const product = await this.prismaService.product.create({
      data: {
        name,
        sku,
        quantity,
        price,
        containerId: productContainerId,
        unidadId,
        marcaId,
        ...(typeof minStock === 'number' ? { minStock } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(categoryData ? { ProductCategory: categoryData } : {}),
        ...(imageData ? { ProductImage: imageData } : {}),
      },
      include: {
        ProductCategory: true,
        ProductImage: true,
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
