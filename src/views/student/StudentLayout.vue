<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const props = defineProps({
  activeMenu: String,
  hideSidebar: {
    type: Boolean,
    default: false
  }
});

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
    <div class="side-menu" v-if="!props.hideSidebar">
      <el-menu :default-active="route.path" router>
        <el-menu-item index="/student/learning-center">学习中心</el-menu-item>
        <el-menu-item index="/student/test-center">测验中心</el-menu-item>
        <el-menu-item index="/student/message">消息中心</el-menu-item>
        <el-menu-item index="/student/profile">个人信息管理</el-menu-item>
      </el-menu>
    </div>
    <div :class="['content', { 'full-width': props.hideSidebar }]">
      <slot></slot>
    </div>
  </div>
</template>


<style scoped>
.main-layout { display: flex; min-height: 100vh; }
.side-menu { width: 200px; background: #f5f7fa; }
.content { flex: 1; padding: 24px; }
.content.full-width { width: 100%; }
</style>
