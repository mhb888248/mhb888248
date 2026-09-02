<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../api';

interface Campaign {
  id: string;
  name: string;
  template: string;
  status: string;
  registeredCount: number;
  checkedInCount: number;
}

const campaigns = ref<Campaign[]>([]);
const loading = ref(true);
const createVisible = ref(false);
const regVisible = ref(false);
const activeCampaign = ref<Campaign | null>(null);
const registrations = ref<any[]>([]);

const form = ref({ name: '', template: 'TCM_CONSTITUTION' });
const regForm = ref({ name: '', phone: '' });

const templates = [
  { label: '中医体质辨识周', value: 'TCM_CONSTITUTION' },
  { label: '慢病筛查日', value: 'CHRONIC_SCREENING' },
  { label: '市西公益检测日', value: 'PUBLIC_SCREENING' },
];

async function load() {
  loading.value = true;
  try {
    campaigns.value = (await api.get<Campaign[]>('/campaigns')).data;
  } finally {
    loading.value = false;
  }
}

async function createCampaign() {
  if (!form.value.name) return ElMessage.warning('请填写活动名称');
  await api.post('/campaigns', form.value);
  ElMessage.success('活动已创建');
  createVisible.value = false;
  form.value = { name: '', template: 'TCM_CONSTITUTION' };
  await load();
}

async function openRegistrations(c: Campaign) {
  activeCampaign.value = c;
  regVisible.value = true;
  await refreshRegistrations();
}

async function refreshRegistrations() {
  if (!activeCampaign.value) return;
  const detail = (await api.get(`/campaigns/${activeCampaign.value.id}`)).data;
  registrations.value = detail.registrations;
}

async function addRegistration() {
  if (!activeCampaign.value || !regForm.value.name) return ElMessage.warning('请填写姓名');
  await api.post(`/campaigns/${activeCampaign.value.id}/register`, regForm.value);
  regForm.value = { name: '', phone: '' };
  await refreshRegistrations();
  await load();
}

async function checkin(regId: string) {
  if (!activeCampaign.value) return;
  const res = await api.post(`/campaigns/${activeCampaign.value.id}/checkin`, {
    registrationId: regId,
  });
  ElMessage.success(res.data.residentCreated ? '核销成功，已自动建立居民档案' : '核销成功');
  await refreshRegistrations();
  await load();
}

onMounted(load);
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <h2 class="page-title">活动获客</h2>
      <el-button type="primary" @click="createVisible = true">
        <el-icon><Plus /></el-icon> 新建活动
      </el-button>
    </div>

    <el-table :data="campaigns" border stripe>
      <el-table-column prop="name" label="活动名称" />
      <el-table-column prop="template" label="模板" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="registeredCount" label="报名" width="90" />
      <el-table-column prop="checkedInCount" label="到场核销" width="100" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openRegistrations(row)">报名/核销</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新建活动" width="440px">
      <el-form label-width="80px">
        <el-form-item label="活动名称">
          <el-input v-model="form.name" placeholder="如：市西中医康复季" />
        </el-form-item>
        <el-form-item label="活动模板">
          <el-select v-model="form.template" style="width: 100%">
            <el-option v-for="t in templates" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createCampaign">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="regVisible" :title="`报名与核销 · ${activeCampaign?.name}`" width="620px">
      <div class="reg-form">
        <el-input v-model="regForm.name" placeholder="居民姓名" style="width: 160px" />
        <el-input v-model="regForm.phone" placeholder="手机号" style="width: 180px" />
        <el-button type="primary" @click="addRegistration">添加报名</el-button>
      </div>
      <el-table :data="registrations" border style="margin-top: 12px">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.checkedIn ? 'success' : 'info'">
              {{ row.checkedIn ? '已核销' : '待核销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="!row.checkedIn" size="small" type="primary" @click="checkin(row.id)">
              签到核销
            </el-button>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { color: #111827; margin: 0; }
.reg-form { display: flex; gap: 10px; }
.muted { color: #9ca3af; }
</style>
