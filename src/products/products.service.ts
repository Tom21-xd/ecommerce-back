import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductContainerService } from 'src/product-container/product-container.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

const productFullInclude = {
  _count: true, // cuenta de relaciones (reviews, etc.)
  container: {
    include: {
      user: {
        select: { id: true, email: true, username: true, role: true },
      },
    },
  },
  ProductImage: true, // relación con las imágenes
  ProductCategory: {
    // relación con las categorías
    include: {
      category: true, // se incluye la categoría asociada
    },
  },
  unidad: true, // unidad de medida (opcional)
  marca: true, // marca (opcional)
  review: {
    include: {
      user: { select: { id: true, username: true } },
    },
  },
} as const;

const pages = (total: number, limit: number) =>
  Math.max(1, Math.ceil(total / Math.max(1, limit)));

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

    const [totalProducts, products] = await this.prismaService.$transaction([
      this.prismaService.product.count(),
      this.prismaService.product.findMany({
        skip: Number(offset),
        take: Number(limit),
        include: productFullInclude,
        orderBy: { createdAt: 'desc' }, // ajusta el orden si prefieres
      }),
    ]);

    return {
      products,
      totalPages: pages(totalProducts, limit),
      totalProducts,
    };
  }

  async getAllProductsWithUserData(paginationDTO: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDTO;

    const where = {
      container: { user: { role: 'SELLER' as const } },
    };

    const [totalProducts, products] = await this.prismaService.$transaction([
      this.prismaService.product.count({ where }),
      this.prismaService.product.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        include: productFullInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      products,
      totalPages: pages(totalProducts, limit),
      totalProducts,
    };
  }

  async getAllProductsByUser(
    params: { userId?: number; phones?: string },
    paginationDTO: PaginationDto,
  ) {
    const { limit = 10, offset = 0 } = paginationDTO;
    let userId = params.userId;
    if (!userId && params.phones) {
      // Buscar el usuario por phones
      const user = await this.prismaService.user.findFirst({
        where: { phones: params.phones },
      });
      if (!user) throw new NotFoundException('User not found');
      userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');
    const where = { container: { userId } };
    const [totalProducts, products] = await this.prismaService.$transaction([
      this.prismaService.product.count({ where }),
      this.prismaService.product.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        include: productFullInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      products,
      totalPages: pages(totalProducts, limit),
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
      include: productFullInclude,
    });

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / 10);

    return {
      products,
      totalPages,
      totalProducts,
    };
  }

  async getById(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: productFullInclude,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: number, updateData: Partial<CreateProductDto>) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const {
      name,
      sku,
      quantity,
      price,
      description,
      unidadId,
      marcaId,
      minStock,
      isActive,
      categoryIds,
      images,
    } = updateData;

    // Si se actualizan categorías, eliminamos las anteriores y creamos nuevas
    let categoryUpdate = undefined;
    if (categoryIds) {
      await this.prismaService.productCategory.deleteMany({
        where: { productId: id },
      });
      categoryUpdate = {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      };
    }

    // Si se actualizan imágenes, eliminamos las anteriores y creamos nuevas
    let imageUpdate = undefined;
    if (images) {
      await this.prismaService.productImage.deleteMany({
        where: { productId: id },
      });
      imageUpdate = {
        create: images.map((img) => ({
          base64: img.base64,
          alt: img.alt,
          position: img.position ?? 0,
        })),
      };
    }

    return this.prismaService.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(quantity !== undefined && { quantity }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
        ...(unidadId !== undefined && { unidadId }),
        ...(marcaId !== undefined && { marcaId }),
        ...(minStock !== undefined && { minStock }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryUpdate && { ProductCategory: categoryUpdate }),
        ...(imageUpdate && { ProductImage: imageUpdate }),
      },
      include: productFullInclude,
    });
  }

  async delete(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.prismaService.product.delete({ where: { id } });
    return { deleted: true, id };
  }
}
