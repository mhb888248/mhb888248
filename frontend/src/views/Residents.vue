<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '../api';

const router = useRouter();
const residents = ref<any[]>([]);
const loading = ref(true);
const createVisible = ref(false);
const form = ref({ name: '', gender: 'F', age: 50, phone: '', chronicHistory: '' });

const riskType: Record<string, string> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

async function load() {
  loading.value = true;
  try {
    residents.value = (await api.get('/residents')).data;
  } finally {
    loading.value = false;
  }
}

async function createResident() {
  if (!form.value.name) return ElMessage.warning('请填写姓名');
  await api.post('/residents', form.value);
  ElMessage.success('居民档案已创建');
  createVisible.value = false;
  form.value = { name: '', gender: 'F', age: 50, phone: '', chronicHistory: '' };
  await load();
}

function open(id: string) {
  router.push(`/residents/${id}`);
}

onMounted(load);
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <h2 class="page-title">居民档案</h2>
      <el-button type="primary" @click="createVisible = true">
        <el-icon><Plus /></el-icon> 新建档案
      </el-button>
    </div>

    <el-table :data="residents" border stripe @row-click="(row: any) => open(row.id)" class="clickable">
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="性别" width="80">
        <template #default="{ row }">{{ row.gender === 'M' ? '男' : '女' }}</template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" width="80" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="source" label="来源" width="110" />
      <el-table-column label="风险层级" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.riskRecords && row.riskRecords.length" :type="riskType[row.riskRecords[0].level]">
            {{ row.riskRecords[0].level }}
          </el-tag>
          <el-tag v-else type="info" effect="plain">未评估</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button size="small" @click.stop="open(row.id)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新建居民档案" width="460px">
      <el-form label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio value="F">女</el-radio>
            <el-radio value="M">男</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="form.age" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="慢病史">
          <el-input v-model="form.chronicHistory" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createResident">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { color: #111827; margin: 0; }
.clickable :deep(.el-table__row) { cursor: pointer; }
</style>
