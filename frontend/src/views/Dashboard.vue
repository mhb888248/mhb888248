<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';

interface Overview {
  totals: { residents: number; activelyManaged: number; campaigns: number };
  riskDistribution: { HIGH: number; MEDIUM: number; LOW: number; UNASSESSED: number };
  funnel: { registered: number; checkedIn: number; archived: number; managed: number };
  followup: { totalTasks: number; doneTasks: number; completionRate: number };
}

const data = ref<Overview | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const res = await api.get<Overview>('/dashboard/overview');
    data.value = res.data;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const funnelSteps = () =>
  data.value
    ? [
        { label: '活动报名', value: data.value.funnel.registered, color: '#0891b2' },
        { label: '到场核销', value: data.value.funnel.checkedIn, color: '#0e7490' },
        { label: '建立档案', value: data.value.funnel.archived, color: '#0f766e' },
        { label: '纳入管理', value: data.value.funnel.managed, color: '#047857' },
      ]
    : [];

const maxFunnel = () =>
  Math.max(1, ...funnelSteps().map((s) => s.value));
</script>

<template>
  <div v-loading="loading">
    <h2 class="page-title">经营看板</h2>

    <el-row :gutter="16" v-if="data">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">总建档人数</div>
          <div class="stat-value">{{ data.totals.residents }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">活跃管理人数</div>
          <div class="stat-value">{{ data.totals.activelyManaged }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">进行中活动</div>
          <div class="stat-value">{{ data.totals.campaigns }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px" v-if="data">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>风险分层分布</b></template>
          <div class="risk-row">
            <el-tag type="danger" effect="dark">高风险 {{ data.riskDistribution.HIGH }}</el-tag>
            <el-tag type="warning" effect="dark">中风险 {{ data.riskDistribution.MEDIUM }}</el-tag>
            <el-tag type="success" effect="dark">低风险 {{ data.riskDistribution.LOW }}</el-tag>
            <el-tag type="info" effect="plain">未评估 {{ data.riskDistribution.UNASSESSED }}</el-tag>
          </div>
          <div class="risk-bar">
            <div class="seg high" :style="{ flex: data.riskDistribution.HIGH || 0.001 }"></div>
            <div class="seg mid" :style="{ flex: data.riskDistribution.MEDIUM || 0.001 }"></div>
            <div class="seg low" :style="{ flex: data.riskDistribution.LOW || 0.001 }"></div>
            <div class="seg none" :style="{ flex: data.riskDistribution.UNASSESSED || 0.001 }"></div>
          </div>
          <el-divider />
          <div class="followup-metric">
            <span>随访任务完成率</span>
            <el-progress
              :percentage="data.followup.completionRate"
              :stroke-width="16"
              striped
            />
            <small>{{ data.followup.doneTasks }} / {{ data.followup.totalTasks }} 项任务已完成</small>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>获客转化漏斗</b></template>
          <div v-for="step in funnelSteps()" :key="step.label" class="funnel-step">
            <div class="funnel-label">{{ step.label }}</div>
            <div class="funnel-track">
              <div
                class="funnel-fill"
                :style="{ width: (step.value / maxFunnel()) * 100 + '%', background: step.color }"
              >
                {{ step.value }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-title { color: #111827; margin: 0 0 16px; }
.stat-card { text-align: center; }
.stat-label { color: #6b7280; font-size: 14px; }
.stat-value { font-size: 34px; font-weight: 700; color: #0f766e; margin-top: 8px; }
.risk-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.risk-bar { display: flex; height: 18px; border-radius: 9px; overflow: hidden; }
.risk-bar .seg.high { background: #ef4444; }
.risk-bar .seg.mid { background: #f59e0b; }
.risk-bar .seg.low { background: #10b981; }
.risk-bar .seg.none { background: #d1d5db; }
.followup-metric small { color: #9ca3af; display: block; margin-top: 6px; }
.funnel-step { margin-bottom: 14px; }
.funnel-label { font-size: 13px; color: #374151; margin-bottom: 4px; }
.funnel-track { background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.funnel-fill {
  color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 6px;
  min-width: 28px; transition: width 0.4s ease;
}
</style>
