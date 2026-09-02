import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { evaluateRisk } from './risk.rules';

class EvaluateDto {
  @IsString() residentId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('risk')
export class RiskController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('evaluate')
  async evaluate(@CurrentUser() user: AuthUser, @Body() dto: EvaluateDto) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId: user.tenantId },
      include: { metrics: { orderBy: { measuredAt: 'desc' } } },
    });
    if (!resident) throw new NotFoundException('居民档案不存在');

    // Reduce to the latest reading per metric type.
    const latest: Record<string, number> = {};
    for (const m of resident.metrics) {
      if (latest[m.metricType] === undefined) latest[m.metricType] = m.value;
    }

    const result = evaluateRisk(latest);
    const record = await this.prisma.riskLevelRecord.create({
      data: {
        residentId: resident.id,
        level: result.level,
        serviceLevel: result.serviceLevel,
        reasons: JSON.stringify(result.reasons),
      },
    });

    return {
      id: record.id,
      residentId: resident.id,
      level: result.level,
      serviceLevel: result.serviceLevel,
      frequency: result.frequency,
      channel: result.channel,
      reasons: result.reasons,
      evaluatedMetrics: latest,
    };
  }
}
