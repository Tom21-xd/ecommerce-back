import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // unidad
  createUnidad(nombre: string) { return this.prisma.unidad.create({ data: { nombre } }); }
  listUnidad() { return this.prisma.unidad.findMany({ orderBy: { nombre: 'asc' } }); }

  // marca
  createMarca(nombre: string) { return this.prisma.marca.create({ data: { nombre } }); }
  listMarca() { return this.prisma.marca.findMany({ orderBy: { nombre: 'asc' } }); }

  // category (padre-hijo)
  createCategory(data: { name: string; slug: string; parentId?: number }) {
    return this.prisma.category.create({ data });
  }
  listCategories() {
    return this.prisma.category.findMany({ include: { children: true } });
  }

  // product images
  addImage(productId: number, base64: string, alt?: string, position = 0) {
    return this.prisma.productImage.create({ data: { productId, base64, alt, position } });
  }
  listImages(productId: number) {
    return this.prisma.productImage.findMany({ where: { productId }, orderBy: { position: 'asc' } });
  }

  // reviews
  addReview(userId: number, productId: number, rating: number, comment?: string) {
    return this.prisma.review.create({ data: { userId, productId, rating, comment } });
  }
  listReviews(productId: number) {
    return this.prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  }
}
