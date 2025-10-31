<template>
  <el-header height="56px" style="background:#2d8cf0;color:#fff;display:flex;align-items:center;">
    <div style="font-size:20px;font-weight:bold;">LRP-Hybrid</div>
    <div style="flex:1"></div>
    <el-avatar :src="user.avatar" size="small"></el-avatar>
    <span style="margin-left:8px; margin-right: 16px;">{{ user.nickname }}</span>
    <el-button type="danger" @click="logout">退出登录</el-button>
  </el-header>
  <div class="main-layout">
    <div class="side-menu">
      <el-menu :default-active="route.path" router>
        <el-menu-item index="/admin/dashboard">系统总览</el-menu-item>
        <el-menu-item index="/admin/resource-manage">资源管理</el-menu-item>
        <el-menu-item index="/admin/user-mgr">用户管理</el-menu-item>
        <el-menu-item index="/admin/sys-config">系统配置</el-menu-item>
        <el-menu-item index="/admin/monitor">监控中心</el-menu-item>
      </el-menu>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const user = ref({ nickname: '管理员A', avatar: '', id: 999 });

const logout = () => {
  router.push('/login');
};
</script>

<style scoped>
.main-layout { 
  display: flex; 
  min-height: 100vh; 
}

/* 提高总侧边栏样式优先级，防止被子组件影响 */
.main-layout .side-menu { 
  width: 200px !important; 
  background: #f5f7fa !important; 
  flex-shrink: 0 !important;
  position: relative;
  z-index: 100;
}

.content { 
  flex: 1; 
  padding: 24px; 
  max-width: 100%; 
  min-width: 0;
  position: relative;
  z-index: 1;
}
</style>
