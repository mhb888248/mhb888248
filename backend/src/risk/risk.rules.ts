// Configurable risk stratification rules (§5.4). Maps the latest metric readings
// of a resident to a HIGH/MEDIUM/LOW risk level, a service level (1/2/3), and
// human-readable reasons. Thresholds are intentionally simple and tunable.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskResult {
  level: RiskLevel;
  serviceLevel: number;
  frequency: string;
  channel: string;
  reasons: string[];
}

interface Thresholds {
  metric: string;
  label: string;
  high: (v: number) => boolean;
  medium: (v: number) => boolean;
}

const THRESHOLDS: Thresholds[] = [
  {
    metric: 'SYSTOLIC',
    label: '收缩压',
    high: (v) => v >= 160,
    medium: (v) => v >= 140,
  },
  {
    metric: 'DIASTOLIC',
    label: '舒张压',
    high: (v) => v >= 100,
    medium: (v) => v >= 90,
  },
  {
    metric: 'GLUCOSE',
    label: '空腹血糖',
    high: (v) => v >= 7.0,
    medium: (v) => v >= 6.1,
  },
  {
    metric: 'BMI',
    label: 'BMI',
    high: (v) => v >= 30,
    medium: (v) => v >= 28,
  },
  {
    metric: 'SPO2',
    label: '血氧',
    high: (v) => v < 90,
    medium: (v) => v < 94,
  },
];

const SERVICE_MATRIX: Record<RiskLevel, Omit<RiskResult, 'level' | 'reasons'>> = {
  HIGH: { serviceLevel: 3, frequency: '每日/按需', channel: 'AI+管理师+医生' },
  MEDIUM: { serviceLevel: 2, frequency: '每周', channel: 'AI+管理师' },
  LOW: { serviceLevel: 1, frequency: '每月', channel: 'AI为主' },
};

export function evaluateRisk(
  latestMetrics: Record<string, number>,
): RiskResult {
  const reasons: string[] = [];
  let level: RiskLevel = 'LOW';

  for (const t of THRESHOLDS) {
    const value = latestMetrics[t.metric];
    if (value === undefined) continue;
    if (t.high(value)) {
      level = 'HIGH';
      reasons.push(`${t.label}${value} 达到高风险阈值`);
    } else if (t.medium(value)) {
      if (level !== 'HIGH') level = 'MEDIUM';
      reasons.push(`${t.label}${value} 达到中风险阈值`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('各项指标均在正常范围内');
  }

  return { level, reasons, ...SERVICE_MATRIX[level] };
}

export function buildFollowupTasks(
  level: RiskLevel,
): { title: string; dueDay: number }[] {
  const base = [
    { title: '发送 7 天激活问候与健康问卷', dueDay: 1 },
    { title: '采集基础指标并完成首次随访', dueDay: 3 },
  ];
  if (level === 'MEDIUM') {
    base.push({ title: '健康管理师电话随访', dueDay: 7 });
  }
  if (level === 'HIGH') {
    base.push({ title: '健康管理师电话随访', dueDay: 2 });
    base.push({ title: '家庭医生评估并给出复诊/转诊建议', dueDay: 4 });
  }
  base.push({ title: '月度复盘与服务续费评估', dueDay: 30 });
  return base;
}
