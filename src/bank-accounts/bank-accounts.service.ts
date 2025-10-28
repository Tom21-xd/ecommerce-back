import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una cuenta bancaria para un vendedor
   * Si isActive=true, desactiva las otras cuentas del vendedor
   */
  async create(userId: number, createBankAccountDto: CreateBankAccountDto) {
    // Verificar que el usuario sea SELLER
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== 'SELLER') {
      throw new BadRequestException('Solo los vendedores pueden registrar cuentas bancarias');
    }

    // Si isActive es true, desactivar todas las otras cuentas
    if (createBankAccountDto.isActive !== false) {
      await this.prisma.bankAccount.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    return this.prisma.bankAccount.create({
      data: {
        userId,
        ...createBankAccountDto,
        isActive: createBankAccountDto.isActive !== false, // Default true
      },
    });
  }

  /**
   * Obtiene todas las cuentas bancarias de un vendedor
   */
  async findAllByVendor(userId: number) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Obtiene la cuenta bancaria activa de un vendedor
   */
  async findActiveByVendor(userId: number) {
    return this.prisma.bankAccount.findFirst({
      where: { userId, isActive: true },
    });
  }

  /**
   * Obtiene una cuenta bancaria por ID
   */
  async findOne(id: number) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    return account;
  }

  /**
   * Actualiza una cuenta bancaria
   * Solo el propietario o un ADMIN pueden actualizar
   */
  async update(
    id: number,
    userId: number,
    userRole: string,
    updateBankAccountDto: UpdateBankAccountDto,
  ) {
    const account = await this.findOne(id);

    // Verificar permisos
    if (account.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para actualizar esta cuenta');
    }

    // Si se activa esta cuenta, desactivar las demás del mismo vendedor
    if (updateBankAccountDto.isActive === true) {
      await this.prisma.bankAccount.updateMany({
        where: { userId: account.userId, id: { not: id } },
        data: { isActive: false },
      });
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: updateBankAccountDto,
    });
  }

  /**
   * Elimina una cuenta bancaria
   * Solo el propietario o un ADMIN pueden eliminar
   */
  async remove(id: number, userId: number, userRole: string) {
    const account = await this.findOne(id);

    // Verificar permisos
    if (account.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para eliminar esta cuenta');
    }

    return this.prisma.bankAccount.delete({
      where: { id },
    });
  }

  /**
   * Admin: Verifica o desverifica una cuenta bancaria
   */
  async toggleVerification(id: number, isVerified: boolean) {
    const account = await this.findOne(id);

    return this.prisma.bankAccount.update({
      where: { id },
      data: { isVerified },
    });
  }

  /**
   * Admin: Lista todas las cuentas bancarias (con filtros opcionales)
   */
  async findAll(filters?: {
    isVerified?: boolean;
    isActive?: boolean;
    vendorId?: number;
  }) {
    return this.prisma.bankAccount.findMany({
      where: {
        ...(filters?.isVerified !== undefined && { isVerified: filters.isVerified }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.vendorId && { userId: filters.vendorId }),
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
