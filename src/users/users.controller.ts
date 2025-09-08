import {
  Controller,
  Param,
  Delete,
  Req,
  Res,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';

import { Public } from 'src/auth/decorators/public.decorator';

import { Body, Patch } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request, @Res() response: Response, @Query('phones') phones?: string) {
    try {
      const userId = (req as any).user?.id;
      const user = await this.usersService.getProfile({ userId, phones });
      return response.status(200).json({
        status: 'Ok!',
        message: 'User profile fetched',
        result: user,
      });
    } catch (err) {
      console.log(err);
      response.statusMessage = err.response?.message || 'Error';
      return response.status(err.status || 500).json({
        status: err.response?.statusCode || 500,
        message: err.response?.message || 'Error',
      });
    }
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ schema: { properties: { email: { type: 'string', example: 'nuevo@email.com' }, username: { type: 'string', example: 'nuevo_usuario' }, password: { type: 'string', example: 'nuevaClave123' }, phones: { type: 'string', example: '3001234567' } } } })
  async updateProfile(@Req() req: Request, @Res() response: Response, @Body() body: any, @Query('phones') phones?: string) {
    try {
      const userId = (req as any).user?.id;
      const updated = await this.usersService.updateProfile({ userId, phones }, body);
      return response.status(200).json({
        status: 'Ok!',
        message: 'User profile updated',
        result: updated,
      });
    } catch (err) {
      console.log(err);
      response.statusMessage = err.response?.message || 'Error';
      return response.status(err.status || 500).json({
        status: err.response?.statusCode || 500,
        message: err.response?.message || 'Error',
      });
    }
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Req() req: Request, @Res() response: Response) {
    try {
      const result = await this.usersService.getAllusers();
      return response.status(200).json({
        status: 'Ok!',
        message: 'Successfully fetch data!',
        result: result,
      });
    } catch (err) {
      console.log(err);
      response.statusMessage = err.response.message;
      return response.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }

  @Get('/by-role')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users by role' })
  async getUsersByRole(
    @Req() req: Request,
    @Res() response: Response,
    @Query('role') role: string,
  ) {
    try {
      const result = await this.usersService.getAllUsersByRole(
        role.toUpperCase() as Role,
      );
      return response.status(200).json({
        status: 'Ok!',
        message: 'Successfully fetch data!',
        result: result,
      });
    } catch (err) {
      console.log(err);
      response.statusMessage = err.response.message;
      return response.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user by id' })
  async remove(
    @Req() req: Request,
    @Res() response: Response,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.usersService.remove(+id);
      return response.status(200).json({
        status: 'Ok!',
        message: 'User deleted',
        result: result,
      });
    } catch (err) {
      console.log(err);
      response.statusMessage = err.response.message;
      return response.status(err.status).json({
        status: err.response.statusCode,
        message: err.response.message,
      });
    }
  }
}
