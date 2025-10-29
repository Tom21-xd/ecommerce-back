import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ShipmentsService } from './shipments.service';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Shipments')
//@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}

  @Get('order/:pedidoId')
  @ApiOperation({ summary: 'List shipments of an order' })
  async list(@Param('pedidoId') pedidoId: string, @Res() res: Response) {
    const result = await this.service.listByOrder(Number(pedidoId));
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'ok', result });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER, Role.BUYER)
  @ApiOperation({ summary: 'Update shipment status' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const result = await this.service.update(Number(id), body);
    return res
      .status(HttpStatus.OK)
      .json({ status: 200, message: 'updated', result });
  }
}
