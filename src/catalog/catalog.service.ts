import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // unidad
  createUnidad(nombre: string) { return this.prisma.unidad.create({ data: { nombre } }); }
  listUnidad() { return this.prisma.unidad.findMany({ orderBy: { nombre: 'asc' } }); }
  async deleteUnidad(id: number) {
    const unidad = await this.prisma.unidad.findUnique({ where: { id } });
    if (!unidad) throw new NotFoundException('Unidad not found');
    await this.prisma.unidad.delete({ where: { id } });
    return { deleted: true, id };
  }

  // marca
  createMarca(nombre: string) { return this.prisma.marca.create({ data: { nombre } }); }
  listMarca() { return this.prisma.marca.findMany({ orderBy: { nombre: 'asc' } }); }
  async deleteMarca(id: number) {
    const marca = await this.prisma.marca.findUnique({ where: { id } });
    if (!marca) throw new NotFoundException('Marca not found');
    await this.prisma.marca.delete({ where: { id } });
    return { deleted: true, id };
  }

  // category (padre-hijo)
  createCategory(data: { name: string; slug: string; parentId?: number }) {
    return this.prisma.category.create({ data });
  }
  listCategories() {
    return this.prisma.category.findMany({ include: { children: true } });
  }
  async deleteCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true, id };
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
