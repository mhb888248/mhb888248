import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

class CreateResidentDto {
  @IsString() name: string;
  @IsIn(['M', 'F']) gender: string;
  @IsInt() @Min(0) @Max(120) age: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() chronicHistory?: string;
  @IsOptional() @IsString() source?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('residents')
export class ResidentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.resident.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        riskRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateResidentDto) {
    return this.prisma.resident.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name,
        gender: dto.gender,
        age: dto.age,
        phone: dto.phone,
        chronicHistory: dto.chronicHistory,
        source: dto.source || 'MANUAL',
      },
    });
  }

  @Get(':id')
  async detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        metrics: { orderBy: { measuredAt: 'desc' } },
        riskRecords: { orderBy: { createdAt: 'desc' } },
        followupPlans: {
          orderBy: { createdAt: 'desc' },
          include: { tasks: { orderBy: { dueDay: 'asc' } } },
        },
      },
    });
    if (!resident) throw new NotFoundException('居民档案不存在');
    return resident;
  }
}
