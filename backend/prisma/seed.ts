import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'tenant-sxl';

async function main() {
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: { id: TENANT_ID, name: '市西路社区卫生服务中心' },
  });

  const users = [
    {
      username: 'admin',
      displayName: '院长（管理员）',
      role: 'MANAGER',
      password: 'admin123',
    },
    {
      username: 'doctor',
      displayName: '家庭医生·王医生',
      role: 'DOCTOR',
      password: 'doctor123',
    },
    {
      username: 'manager',
      displayName: '健康管理师·李老师',
      role: 'HEALTH_MANAGER',
      password: 'manager123',
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName, role: u.role },
      create: {
        tenantId: TENANT_ID,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        passwordHash: bcrypt.hashSync(u.password, 10),
      },
    });
  }

  // Only seed demo business data once (idempotent guard).
  const existingResidents = await prisma.resident.count({
    where: { tenantId: TENANT_ID },
  });
  if (existingResidents === 0) {
    const campaign = await prisma.campaign.create({
      data: {
        tenantId: TENANT_ID,
        name: '中医体质辨识周',
        template: 'TCM_CONSTITUTION',
        status: 'ACTIVE',
        registrations: {
          create: [
            { name: '赵大爷', phone: '13800000001' },
            { name: '钱阿姨', phone: '13800000002', checkedIn: true, checkedInAt: new Date() },
          ],
        },
      },
    });
    void campaign;

    const zhang = await prisma.resident.create({
      data: {
        tenantId: TENANT_ID,
        name: '张建国',
        gender: 'M',
        age: 63,
        phone: '13900000001',
        chronicHistory: '高血压 8 年',
        source: 'CAMPAIGN',
        metrics: {
          create: [
            { metricType: 'SYSTOLIC', value: 168, unit: 'mmHg', sourceType: 'DEVICE' },
            { metricType: 'DIASTOLIC', value: 102, unit: 'mmHg', sourceType: 'DEVICE' },
            { metricType: 'GLUCOSE', value: 6.4, unit: 'mmol/L', sourceType: 'DEVICE' },
            { metricType: 'BMI', value: 27.1, unit: 'kg/m2', sourceType: 'MANUAL' },
          ],
        },
      },
    });
    void zhang;

    await prisma.resident.create({
      data: {
        tenantId: TENANT_ID,
        name: '刘玉兰',
        gender: 'F',
        age: 52,
        phone: '13900000002',
        chronicHistory: '糖代谢异常',
        source: 'CAMPAIGN',
        metrics: {
          create: [
            { metricType: 'SYSTOLIC', value: 132, unit: 'mmHg', sourceType: 'MANUAL' },
            { metricType: 'GLUCOSE', value: 6.3, unit: 'mmol/L', sourceType: 'DEVICE' },
            { metricType: 'BMI', value: 24.5, unit: 'kg/m2', sourceType: 'MANUAL' },
          ],
        },
      },
    });

    await prisma.resident.create({
      data: {
        tenantId: TENANT_ID,
        name: '孙小梅',
        gender: 'F',
        age: 34,
        phone: '13900000003',
        source: 'REFERRAL',
        metrics: {
          create: [
            { metricType: 'SYSTOLIC', value: 118, unit: 'mmHg', sourceType: 'MANUAL' },
            { metricType: 'GLUCOSE', value: 5.1, unit: 'mmol/L', sourceType: 'MANUAL' },
            { metricType: 'BMI', value: 21.8, unit: 'kg/m2', sourceType: 'MANUAL' },
            { metricType: 'SPO2', value: 98, unit: '%', sourceType: 'DEVICE' },
          ],
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with admin / admin123');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
