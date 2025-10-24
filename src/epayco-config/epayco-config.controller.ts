import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { EpaycoConfigService } from './epayco-config.service';
import { CreateEpaycoConfigDto } from './dto/create-epayco-config.dto';
import { UpdateEpaycoConfigDto } from './dto/update-epayco-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Configuración ePayco')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('epayco-config')
export class EpaycoConfigController {
  constructor(private readonly epaycoConfigService: EpaycoConfigService) {}

  @Post()
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Crear configuración de ePayco para el usuario autenticado',
  })
  async create(@Request() req, @Body() createDto: CreateEpaycoConfigDto, @Res() res: Response) {
    const result = await this.epaycoConfigService.create(req.user.id, createDto);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'created', result });
  }

  @Get()
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Obtener configuración de ePayco del usuario autenticado',
  })
  async findMine(@Request() req, @Res() res: Response) {
    const result = await this.epaycoConfigService.findByUserId(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Obtener configuración de ePayco de un usuario (solo ADMIN)',
  })
  async findOne(@Param('userId', ParseIntPipe) userId: number, @Res() res: Response) {
    const result = await this.epaycoConfigService.findByUserId(userId);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Patch()
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar configuración de ePayco del usuario autenticado',
  })
  async update(@Request() req, @Body() updateDto: UpdateEpaycoConfigDto, @Res() res: Response) {
    const result = await this.epaycoConfigService.update(req.user.id, updateDto);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'updated', result });
  }

  @Delete()
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar configuración de ePayco del usuario autenticado',
  })
  async delete(@Request() req, @Res() res: Response) {
    const result = await this.epaycoConfigService.delete(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'deleted', result });
  }

  @Patch('activate')
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Activar configuración de ePayco',
  })
  async activate(@Request() req, @Res() res: Response) {
    const result = await this.epaycoConfigService.activate(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'activated', result });
  }

  @Patch('deactivate')
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @ApiOperation({
    summary: 'Desactivar configuración de ePayco',
  })
  async deactivate(@Request() req, @Res() res: Response) {
    const result = await this.epaycoConfigService.deactivate(req.user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'deactivated', result });
  }
}
