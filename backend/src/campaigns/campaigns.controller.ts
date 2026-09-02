import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

class CreateCampaignDto {
  @IsString() name: string;
  @IsString() template: string;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'CLOSED']) status?: string;
}

class RegisterDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { registrations: true },
    });
    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      template: c.template,
      status: c.status,
      startAt: c.startAt,
      registeredCount: c.registrations.length,
      checkedInCount: c.registrations.filter((r) => r.checkedIn).length,
    }));
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name,
        template: dto.template,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  @Get(':id')
  async detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { registrations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!campaign) throw new NotFoundException('活动不存在');
    return campaign;
  }

  @Post(':id/register')
  async register(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegisterDto,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!campaign) throw new NotFoundException('活动不存在');
    return this.prisma.campaignRegistration.create({
      data: { campaignId: id, name: dto.name, phone: dto.phone },
    });
  }

  @Post(':id/checkin')
  async checkin(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('registrationId') registrationId: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!campaign) throw new NotFoundException('活动不存在');
    const reg = await this.prisma.campaignRegistration.findFirst({
      where: { id: registrationId, campaignId: id },
    });
    if (!reg) throw new NotFoundException('报名记录不存在');

    const updated = await this.prisma.campaignRegistration.update({
      where: { id: registrationId },
      data: { checkedIn: true, checkedInAt: new Date() },
    });

    // Check-in auto-creates a resident archive if not already linked (§6.1).
    if (!updated.residentId) {
      const resident = await this.prisma.resident.create({
        data: {
          tenantId: user.tenantId,
          name: updated.name,
          gender: 'F',
          age: 45,
          phone: updated.phone,
          source: 'CAMPAIGN',
        },
      });
      await this.prisma.campaignRegistration.update({
        where: { id: registrationId },
        data: { residentId: resident.id },
      });
      return { ...updated, residentId: resident.id, residentCreated: true };
    }
    return { ...updated, residentCreated: false };
  }
}
