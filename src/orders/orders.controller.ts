import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my orders' })
  async listMine(
    @Req() req: Request,
    @Res() res: Response,
    @Query('phones') phones?: string,
  ) {
    const user = req.user as any;
    const result = await this.service.listMine({ userId: user?.id, phones });
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Get('seller/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.BUYER)
  @ApiOperation({ summary: 'List pending orders for seller' })
  async listForSeller(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const result = await this.service.listForSeller(user?.id);
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all orders (admin)' })
  async listAll(@Res() res: Response) {
    const result = await this.service.listAllForAdmin();
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  async getOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('phones') phones?: string,
  ) {
    const user = req.user as any;
    const result = await this.service.getByIdForUser(Number(id), {
      userId: user?.id,
      phones,
    });
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin)' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
    @Res() res: Response,
  ) {
    const result = await this.service.setStatus(Number(id), body.status);
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'updated', result });
  }
}
