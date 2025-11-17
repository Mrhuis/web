<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const logout = () => {
  userStore.logout();
};
</script>

<template>
  <el-header height="56px" style="background:#2d8cf0;color:#fff;display:flex;align-items:center;">
    <div style="font-size:20px;font-weight:bold;">LRP-Hybrid</div>
    <div style="flex:1"></div>
    <el-avatar :src="userStore.avatar" size="small"></el-avatar>
    <span style="margin-left:8px; margin-right: 16px;">{{ userStore.nickname }}</span>
    <el-button type="danger" @click="logout">退出登录</el-button>
  </el-header>
  <div class="main-layout">
    <div class="side-menu">
      <el-menu :default-active="route.path" router>
        <el-menu-item index="/teacher/test-manage">测验管理</el-menu-item>
        <el-menu-item index="/teacher/resource-manage">资源管理</el-menu-item>
        <el-menu-item index="/teacher/message-center">消息中心</el-menu-item>
        <el-menu-item index="/teacher/class-mgr">班级管理</el-menu-item>
        <el-menu-item index="/teacher/profile">个人信息管理</el-menu-item>
      </el-menu>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>


<style scoped>
.main-layout { 
  display: flex !important; 
  min-height: 100vh; 
}
.side-menu { 
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  background: #f5f7fa; 
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  position: relative !important;
  z-index: 10 !important;
}
.content { 
  flex: 1 !important; 
  padding: 24px; 
  min-width: 0 !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: 1 !important;
}
</style>
