import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUsersDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private JwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async validateSession(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User does not exists');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  async login(user: LoginDto): Promise<any> {
    const { email, password } = user;
    const searchUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    console.log('search usa', searchUser);
    if (!searchUser) {
      throw new NotFoundException('user not found');
    }

    const validatePassword = await bcrypt.compare(
      password,
      searchUser.password,
    );

    if (!validatePassword) throw new NotFoundException('Invalid password');

    const returnUser = {
      id: searchUser.id,
      username: searchUser.username,
      email: searchUser.email,
      role: searchUser.role,
    };

    return {
      token: this.JwtService.sign({
        user: {
          id: searchUser.id,
          role: searchUser.role,
          email: searchUser.email,
        },
      }),
      user: returnUser,
    };
  }

  async register(userData: RegisterUsersDto): Promise<any> {
    const exists = await this.prismaService.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    if (exists) throw new ConflictException('email already exists');

    const user = await this.prismaService.user.create({
      data: {
        ...userData,
        password: (userData.password = await bcrypt.hash(
          userData.password,
          10,
        )),
        role: 'SELLER',
      },
    });

    console.log('usa', user);
    const returnUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return {
      token: this.JwtService.sign({
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
        },
      }),
      user: returnUser,
    };
  }
}
