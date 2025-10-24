import { PartialType } from '@nestjs/swagger';
import { CreateEpaycoConfigDto } from './create-epayco-config.dto';

export class UpdateEpaycoConfigDto extends PartialType(CreateEpaycoConfigDto) {}
