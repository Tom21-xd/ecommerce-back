import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async list(params: { userId?: number; phones?: string }) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({ where: { phones: params.phones } });
      if (user) userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');
    return this.prisma.address.findMany({ where: { userId } });
  }

  async upsert(params: { userId?: number; phones?: string }, dto: any, id?: number) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({ where: { phones: params.phones } });
      if (user) userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    if (id) {
      const exists = await this.prisma.address.findFirst({ where: { id, userId } });
      if (!exists) throw new NotFoundException('Address not found');
      return this.prisma.address.update({ where: { id }, data: { ...dto, userId } });
    }
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async remove(params: { userId?: number; phones?: string }, id: number) {
    let userId = params.userId;
    if (!userId && params.phones) {
      const user = await this.prisma.user.findFirst({ where: { phones: params.phones } });
      if (user) userId = user.id;
    }
    if (!userId) throw new NotFoundException('User not found');
    const exists = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException('Address not found');
    return this.prisma.address.delete({ where: { id } });
  }

}
