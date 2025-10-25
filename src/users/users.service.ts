import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(params: { userId?: number; phones?: string }) {
    if (!params.userId && !params.phones)
      throw new BadRequestException('Debe enviar userId o phones');
    let user;
    if (params.userId) {
      user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: {
          id: true,
          email: true,
          username: true,
          phones: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      user = await this.prisma.user.findFirst({
        where: { phones: params.phones },
        select: {
          id: true,
          email: true,
          username: true,
          phones: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    params: { userId?: number; phones?: string },
    data: {
      email?: string;
      username?: string;
      password?: string;
      phones?: string;
    },
  ) {
    if (!params.userId && !params.phones)
      throw new BadRequestException('Debe enviar userId o phones');
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.username) updateData.username = data.username;
    if (data.password) updateData.password = data.password; // Aquí deberías hashear la contraseña si es necesario
    if (data.phones) updateData.phones = data.phones;
    if (Object.keys(updateData).length === 0)
      throw new BadRequestException('No data to update');
    let updated;
    if (params.userId) {
      updated = await this.prisma.user.update({
        where: { id: params.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          phones: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // Buscar el primer usuario con ese phone y actualizarlo
      const user = await this.prisma.user.findFirst({
        where: { phones: params.phones },
      });
      if (!user) throw new NotFoundException('User not found');
      updated = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          phones: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    return updated;
  }

  async getAllusers() {
    console.log('entro aca');
    return await this.prisma.user.findMany();
  }

  async getAllUsersByRole(role: Role) {
    const users = await this.prisma.user.findMany({
      where: {
        role: role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!users)
      throw new NotFoundException('Users with this role do not exists');

    return users;
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        phones: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
