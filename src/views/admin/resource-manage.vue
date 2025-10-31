<template>
  <AdminLayout>
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">资源管理</h1>
    </div>
    
    <!-- 主内容区域 -->
    <div class="resource-container">
      <!-- 侧边栏导航 -->
      <div class="sidebar">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          class="menu-item"
          :class="{ active: activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <el-icon class="menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="menu-text">{{ item.label }}</span>
        </div>
      </div>
      
      <!-- 主内容区域 -->
      <div class="main-content">
        <PluginManagement v-if="activeTab === 'plugins'" />
        <KnowledgeManagement v-if="activeTab === 'knowledge'" />
        <ActivityManagement v-if="activeTab === 'activities'" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue';
import { Folder, Document, VideoPlay } from '@element-plus/icons-vue';
import AdminLayout from '@/views/admin/AdminLayout.vue';
import PluginManagement from './resource_manage_components/PluginManagement.vue';
import KnowledgeManagement from './resource_manage_components/KnowledgeManagement.vue';
import ActivityManagement from './resource_manage_components/ActivityManagement.vue';

const activeTab = ref('plugins');

const menuItems = [
  { key: 'plugins', label: '资源包管理', icon: 'Folder' },
  { key: 'knowledge', label: '知识体系管理', icon: 'Document' },
  { key: 'activities', label: '学习活动管理', icon: 'VideoPlay' }
];
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
  padding: 0 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.resource-container {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

/* 提高子侧边栏样式优先级，防止被el-tabs等组件影响 */
.resource-container .sidebar {
  width: 240px !important;
  background: #f8fafc !important;
  border-radius: 8px !important;
  padding: 16px !important;
  border: 1px solid #e2e8f0 !important;
  flex-shrink: 0 !important;
  position: relative;
  z-index: 50;
}

.resource-container .menu-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 16px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  margin-bottom: 4px !important;
  position: relative;
  z-index: 51;
}

.resource-container .menu-item:hover {
  background: #e2e8f0 !important;
}

.resource-container .menu-item.active {
  background: #3b82f6 !important;
  color: white !important;
}

.resource-container .menu-item.active .menu-icon {
  color: white !important;
}

.resource-container .menu-icon {
  font-size: 18px !important;
  color: #64748b !important;
}

.resource-container .menu-text {
  font-size: 14px !important;
  font-weight: 500 !important;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  min-width: 0;
  position: relative;
  z-index: 1;
}
</style>
