import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview(@CurrentUser() user: AuthUser) {
    const tenantId = user.tenantId;

    const residents = await this.prisma.resident.findMany({
      where: { tenantId },
      include: {
        riskRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
        followupPlans: { include: { tasks: true } },
      },
    });

    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, UNASSESSED: 0 };
    let followupTaskTotal = 0;
    let followupTaskDone = 0;
    for (const r of residents) {
      const level = r.riskRecords[0]?.level as
        | 'HIGH'
        | 'MEDIUM'
        | 'LOW'
        | undefined;
      if (level) riskDistribution[level] += 1;
      else riskDistribution.UNASSESSED += 1;
      for (const plan of r.followupPlans) {
        for (const t of plan.tasks) {
          followupTaskTotal += 1;
          if (t.status === 'DONE') followupTaskDone += 1;
        }
      }
    }

    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      include: { registrations: true },
    });
    let registered = 0;
    let checkedIn = 0;
    for (const c of campaigns) {
      registered += c.registrations.length;
      checkedIn += c.registrations.filter((r) => r.checkedIn).length;
    }
    const archived = residents.length;
    const managed = residents.filter((r) => r.followupPlans.length > 0).length;

    return {
      totals: {
        residents: archived,
        activelyManaged: managed,
        campaigns: campaigns.length,
      },
      riskDistribution,
      funnel: {
        registered,
        checkedIn,
        archived,
        managed,
      },
      followup: {
        totalTasks: followupTaskTotal,
        doneTasks: followupTaskDone,
        completionRate:
          followupTaskTotal === 0
            ? 0
            : Math.round((followupTaskDone / followupTaskTotal) * 100),
      },
    };
  }
}
