<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const showChrome = computed(() => route.path !== '/login' && auth.isAuthenticated);
const activeMenu = computed(() => '/' + (route.path.split('/')[1] || 'dashboard'));

function go(path: string) {
  router.push(path);
}

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <el-container v-if="showChrome" class="app-shell">
    <el-aside width="220px" class="sidebar">
      <div class="brand">
        <span class="brand-mark">中医</span>
        <div class="brand-text">
          <div class="brand-title">市西路社区</div>
          <div class="brand-sub">健康管理 SaaS</div>
        </div>
      </div>
      <el-menu :default-active="activeMenu" class="menu" @select="go">
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon><span>经营看板</span>
        </el-menu-item>
        <el-menu-item index="/campaigns">
          <el-icon><Promotion /></el-icon><span>活动获客</span>
        </el-menu-item>
        <el-menu-item index="/residents">
          <el-icon><User /></el-icon><span>居民档案</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">AI 中医驱动的健康管理闭环</div>
        <div class="header-right">
          <el-tag type="success" effect="plain">{{ auth.user?.displayName }}</el-tag>
          <el-button link type="primary" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <router-view v-else />
</template>

<style>
html, body, #app { height: 100%; margin: 0; }
body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
.app-shell { height: 100vh; }
.sidebar {
  background: linear-gradient(180deg, #0f766e 0%, #115e59 100%);
  color: #fff;
}
.brand { display: flex; align-items: center; gap: 12px; padding: 20px 18px; }
.brand-mark {
  width: 40px; height: 40px; border-radius: 10px;
  background: #f0fdfa; color: #0f766e; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.brand-title { font-size: 16px; font-weight: 600; }
.brand-sub { font-size: 12px; opacity: 0.8; }
.menu { background: transparent; border: none; }
.menu .el-menu-item { color: #d1fae5; }
.menu .el-menu-item.is-active { color: #fff; background: rgba(255,255,255,0.14); }
.menu .el-menu-item:hover { background: rgba(255,255,255,0.08); }
.header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-bottom: 1px solid #e5e7eb;
}
.header-title { font-size: 16px; font-weight: 600; color: #0f766e; }
.header-right { display: flex; align-items: center; gap: 12px; }
.main { background: #f3f4f6; }
</style>
