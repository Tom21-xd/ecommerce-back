import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEpaycoConfigDto } from './dto/create-epayco-config.dto';
import { UpdateEpaycoConfigDto } from './dto/update-epayco-config.dto';

@Injectable()
export class EpaycoConfigService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateEpaycoConfigDto) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya existe una configuración
    const existingConfig = await this.prisma.epaycoConfig.findUnique({
      where: { userId },
    });

    if (existingConfig) {
      throw new BadRequestException(
        'Ya existe una configuración de ePayco para este usuario',
      );
    }

    return this.prisma.epaycoConfig.create({
      data: {
        userId,
        publicKey: dto.publicKey,
        privateKey: dto.privateKey,
        isTestMode: dto.isTestMode ?? true,
        isActive: dto.isActive ?? false,
      },
    });
  }

  async findByUserId(userId: number) {
    const config = await this.prisma.epaycoConfig.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(
        'No se encontró configuración de ePayco para este vendedor',
      );
    }

    // No devolver la clave privada en respuestas normales
    const { privateKey, ...configWithoutPrivateKey } = config;

    return configWithoutPrivateKey;
  }

  async findByUserIdWithPrivateKey(userId: number) {
    const config = await this.prisma.epaycoConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        'No se encontró configuración de ePayco para este vendedor',
      );
    }

    return config;
  }

  async update(userId: number, dto: UpdateEpaycoConfigDto) {
    const config = await this.prisma.epaycoConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        'No se encontró configuración de ePayco para este vendedor',
      );
    }

    return this.prisma.epaycoConfig.update({
      where: { userId },
      data: {
        ...(dto.publicKey && { publicKey: dto.publicKey }),
        ...(dto.privateKey !== undefined && { privateKey: dto.privateKey }),
        ...(dto.isTestMode !== undefined && { isTestMode: dto.isTestMode }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async delete(userId: number) {
    const config = await this.prisma.epaycoConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        'No se encontró configuración de ePayco para este vendedor',
      );
    }

    return this.prisma.epaycoConfig.delete({
      where: { userId },
    });
  }

  async activate(userId: number) {
    return this.update(userId, { isActive: true });
  }

  async deactivate(userId: number) {
    return this.update(userId, { isActive: false });
  }
}
