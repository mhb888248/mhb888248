import { Controller, Get, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResidentsModule } from './residents/residents.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MetricsModule } from './metrics/metrics.module';
import { RiskModule } from './risk/risk.module';
import { FollowupsModule } from './followups/followups.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'sxl-health-saas-backend' };
  }
}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ResidentsModule,
    CampaignsModule,
    MetricsModule,
    RiskModule,
    FollowupsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
