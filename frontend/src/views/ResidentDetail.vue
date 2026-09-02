<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '../api';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const resident = ref<any>(null);
const loading = ref(true);
const addMetricVisible = ref(false);
const metricForm = ref({ metricType: 'SYSTOLIC', value: 130, unit: 'mmHg' });

const metricOptions = [
  { label: '收缩压', value: 'SYSTOLIC', unit: 'mmHg' },
  { label: '舒张压', value: 'DIASTOLIC', unit: 'mmHg' },
  { label: '空腹血糖', value: 'GLUCOSE', unit: 'mmol/L' },
  { label: 'BMI', value: 'BMI', unit: 'kg/m2' },
  { label: '心率', value: 'HEART_RATE', unit: 'bpm' },
  { label: '血氧', value: 'SPO2', unit: '%' },
];

const metricLabel: Record<string, string> = Object.fromEntries(
  metricOptions.map((m) => [m.value, m.label]),
);
const riskType: Record<string, string> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };

async function load() {
  loading.value = true;
  try {
    resident.value = (await api.get(`/residents/${id}`)).data;
  } finally {
    loading.value = false;
  }
}

function onMetricTypeChange(v: string) {
  const opt = metricOptions.find((m) => m.value === v);
  if (opt) metricForm.value.unit = opt.unit;
}

async function addMetric() {
  await api.post('/metrics/import', {
    residentId: id,
    metrics: [metricForm.value],
  });
  ElMessage.success('指标已录入');
  addMetricVisible.value = false;
  await load();
}

async function evaluateRisk() {
  const res = await api.post('/risk/evaluate', { residentId: id });
  ElMessage.success(`风险评估完成：${res.data.level}（服务${res.data.serviceLevel}级）`);
  await load();
}

async function generateFollowup() {
  await api.post('/followups/generate', { residentId: id });
  ElMessage.success('随访计划已生成');
  await load();
}

async function completeTask(taskId: string) {
  await api.post(`/followups/tasks/${taskId}/complete`);
  ElMessage.success('任务已完成');
  await load();
}

function parseReasons(r: string): string[] {
  try {
    return JSON.parse(r);
  } catch {
    return [r];
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" v-if="resident">
    <div class="page-head">
      <div>
        <el-button link @click="router.push('/residents')">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2 class="page-title">{{ resident.name }}</h2>
      </div>
      <div class="actions">
        <el-button @click="addMetricVisible = true">录入指标</el-button>
        <el-button type="warning" @click="evaluateRisk">执行风险分层</el-button>
        <el-button type="primary" @click="generateFollowup">生成随访计划</el-button>
      </div>
    </div>

    <el-descriptions :column="3" border>
      <el-descriptions-item label="性别">{{ resident.gender === 'M' ? '男' : '女' }}</el-descriptions-item>
      <el-descriptions-item label="年龄">{{ resident.age }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ resident.phone || '—' }}</el-descriptions-item>
      <el-descriptions-item label="来源">{{ resident.source }}</el-descriptions-item>
      <el-descriptions-item label="慢病史" :span="2">{{ resident.chronicHistory || '—' }}</el-descriptions-item>
    </el-descriptions>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>指标记录</b></template>
          <el-table :data="resident.metrics" size="small" border>
            <el-table-column label="指标">
              <template #default="{ row }">{{ metricLabel[row.metricType] || row.metricType }}</template>
            </el-table-column>
            <el-table-column label="数值">
              <template #default="{ row }">{{ row.value }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column prop="sourceType" label="来源" width="90" />
          </el-table>
          <el-empty v-if="!resident.metrics.length" description="暂无指标" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>风险分层历史</b></template>
          <div v-for="r in resident.riskRecords" :key="r.id" class="risk-item">
            <el-tag :type="riskType[r.level]" effect="dark">{{ r.level }}</el-tag>
            <span class="svc">服务 {{ r.serviceLevel }} 级</span>
            <ul>
              <li v-for="(reason, i) in parseReasons(r.reasons)" :key="i">{{ reason }}</li>
            </ul>
          </div>
          <el-empty v-if="!resident.riskRecords.length" description="尚未评估" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header><b>随访计划</b></template>
      <div v-for="plan in resident.followupPlans" :key="plan.id" class="plan">
        <div class="plan-head">
          <el-tag :type="riskType[plan.riskLevel]">{{ plan.riskLevel }}</el-tag>
          <span>随访频率：{{ plan.frequency }}</span>
          <span>触达方式：{{ plan.channel }}</span>
        </div>
        <el-table :data="plan.tasks" size="small" border>
          <el-table-column prop="title" label="任务" />
          <el-table-column label="计划" width="90">
            <template #default="{ row }">第 {{ row.dueDay }} 天</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'DONE' ? 'success' : 'info'">
                {{ row.status === 'DONE' ? '已完成' : '待办' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button v-if="row.status !== 'DONE'" size="small" type="primary" @click="completeTask(row.id)">
                完成
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-if="!resident.followupPlans.length" description="尚无随访计划" :image-size="60" />
    </el-card>

    <el-dialog v-model="addMetricVisible" title="录入指标" width="420px">
      <el-form label-width="70px">
        <el-form-item label="指标">
          <el-select v-model="metricForm.metricType" style="width: 100%" @change="onMetricTypeChange">
            <el-option v-for="m in metricOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="数值">
          <el-input-number v-model="metricForm.value" :step="0.1" />
          <span class="unit">{{ metricForm.unit }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMetricVisible = false">取消</el-button>
        <el-button type="primary" @click="addMetric">录入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.page-title { color: #111827; margin: 4px 0 0; }
.risk-item { margin-bottom: 12px; }
.risk-item .svc { margin-left: 10px; color: #6b7280; }
.risk-item ul { margin: 6px 0 0; padding-left: 20px; color: #374151; font-size: 13px; }
.plan { margin-bottom: 18px; }
.plan-head { display: flex; gap: 16px; align-items: center; margin-bottom: 8px; color: #374151; }
.unit { margin-left: 8px; color: #9ca3af; }
</style>
