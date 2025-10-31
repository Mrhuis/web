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
        <el-menu-item index="/teacher/course-edit">课程管理</el-menu-item>
        <el-menu-item index="/teacher/item-mgr">题库管理</el-menu-item>
        <el-menu-item index="/teacher/video-mgr">视频/动画库</el-menu-item>
        <el-menu-item index="/teacher/class-mgr">班级与学员</el-menu-item>
        <el-menu-item index="/teacher/report">学情报告</el-menu-item>
        <el-menu-item index="/teacher/qa-mgr">答疑中心</el-menu-item>
      </el-menu>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>


<style scoped>
.main-layout { display: flex; min-height: 100vh; }
.side-menu { width: 200px; background: #f5f7fa; }
.content { flex: 1; padding: 24px; }
</style>
