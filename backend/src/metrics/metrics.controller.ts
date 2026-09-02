import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

const METRIC_TYPES = [
  'SYSTOLIC',
  'DIASTOLIC',
  'GLUCOSE',
  'BMI',
  'HEART_RATE',
  'SPO2',
];

class MetricItemDto {
  @IsIn(METRIC_TYPES) metricType: string;
  @IsNumber() value: number;
  @IsString() unit: string;
  @IsOptional() @IsIn(['DEVICE', 'MANUAL', 'INTERFACE']) sourceType?: string;
}

class ImportMetricsDto {
  @IsString() residentId: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MetricItemDto)
  metrics: MetricItemDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('import')
  async import(@CurrentUser() user: AuthUser, @Body() dto: ImportMetricsDto) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId: user.tenantId },
    });
    if (!resident) throw new NotFoundException('居民档案不存在');

    await this.prisma.metricRecord.createMany({
      data: dto.metrics.map((m) => ({
        residentId: dto.residentId,
        metricType: m.metricType,
        value: m.value,
        unit: m.unit,
        sourceType: m.sourceType || 'MANUAL',
      })),
    });
    return { imported: dto.metrics.length };
  }
}
