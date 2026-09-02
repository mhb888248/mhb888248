import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { evaluateRisk, buildFollowupTasks, RiskLevel } from '../risk/risk.rules';

class GenerateDto {
  @IsString() residentId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('followups')
export class FollowupsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('generate')
  async generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateDto) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId: user.tenantId },
      include: {
        metrics: { orderBy: { measuredAt: 'desc' } },
        riskRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!resident) throw new NotFoundException('居民档案不存在');

    let level: RiskLevel;
    let frequency: string;
    let channel: string;
    if (resident.riskRecords.length > 0) {
      level = resident.riskRecords[0].level as RiskLevel;
      const r = evaluateRisk({});
      // Re-derive frequency/channel from service matrix by evaluating with the
      // stored level via the shared rules.
      const matrix = { HIGH: { frequency: '每日/按需', channel: 'AI+管理师+医生' }, MEDIUM: { frequency: '每周', channel: 'AI+管理师' }, LOW: { frequency: '每月', channel: 'AI为主' } } as const;
      frequency = matrix[level].frequency;
      channel = matrix[level].channel;
      void r;
    } else {
      const latest: Record<string, number> = {};
      for (const m of resident.metrics) {
        if (latest[m.metricType] === undefined) latest[m.metricType] = m.value;
      }
      const result = evaluateRisk(latest);
      level = result.level;
      frequency = result.frequency;
      channel = result.channel;
    }

    const tasks = buildFollowupTasks(level);
    const plan = await this.prisma.followupPlan.create({
      data: {
        residentId: resident.id,
        riskLevel: level,
        frequency,
        channel,
        tasks: {
          create: tasks.map((t) => ({ title: t.title, dueDay: t.dueDay })),
        },
      },
      include: { tasks: { orderBy: { dueDay: 'asc' } } },
    });
    return plan;
  }

  @Post('tasks/:id/complete')
  async complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const task = await this.prisma.followupTask.findFirst({
      where: { id, plan: { resident: { tenantId: user.tenantId } } },
    });
    if (!task) throw new NotFoundException('随访任务不存在');
    return this.prisma.followupTask.update({
      where: { id },
      data: { status: 'DONE' },
    });
  }
}
