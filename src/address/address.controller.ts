import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Res,
  HttpStatus,
  Get,
  Query,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { UpsertAddressDto } from './dto/addresses.dto';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService:AddressService ) {}
  @Get()
  @ApiOperation({ summary: 'List my addresses' })
  async list(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const result = await this.addressService.list(user.id);
    return res.status(HttpStatus.OK).json({ status: 200, message: 'ok', result });
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Create address' })
  async create(@Req() req: Request, @Res() res: Response, @Body() dto: UpsertAddressDto) {
    const user = req.user as any;
    const result = await this.addressService.upsert(user.id, dto);
    return res.status(HttpStatus.CREATED).json({ status: 201, message: 'created', result });
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update address' })
  async update(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() dto: UpsertAddressDto) {
    const user = req.user as any;
    const result = await this.addressService.upsert(user.id, dto, Number(id));
    return res.status(HttpStatus.OK).json({ status: 200, message: 'updated', result });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  async remove(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    const user = req.user as any;
    const result = await this.addressService.remove(user.id, Number(id));
    return res.status(HttpStatus.OK).json({ status: 200, message: 'deleted', result });
  }
}
