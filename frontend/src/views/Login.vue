<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const auth = useAuthStore();
const username = ref('admin');
const password = ref('admin123');
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-brand">
        <div class="mark">中医</div>
        <h2>市西路社区卫生服务中心</h2>
        <p>AI 中医驱动的数字化健康管理 SaaS</p>
      </div>
      <el-form @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" size="large">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" size="large" show-password>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="submit">
          登录
        </el-button>
      </el-form>
      <div class="login-hint">演示账号：admin / admin123（管理员）· doctor / doctor123 · manager / manager123</div>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
}
.login-card { width: 400px; padding: 12px 16px; border-radius: 14px; }
.login-brand { text-align: center; margin-bottom: 20px; }
.login-brand .mark {
  width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 12px;
  background: #0f766e; color: #fff; font-weight: 700; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
}
.login-brand h2 { margin: 0; font-size: 18px; color: #111827; }
.login-brand p { margin: 6px 0 0; color: #6b7280; font-size: 13px; }
.login-hint { margin-top: 14px; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
