import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  list(userId: number) {
    return this.prisma.address.findMany({ where: { userId } });
  }

  async upsert(userId: number, dto: any, id?: number) {
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

  async remove(userId: number, id: number) {
    const exists = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException('Address not found');
    return this.prisma.address.delete({ where: { id } });
  }

}
