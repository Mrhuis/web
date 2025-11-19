<template>
  <TeacherLayout>
    <div class="resource-manage-container">
      <div class="page-header">
        <h1 class="page-title">资源管理</h1>
        <p class="page-subtitle">面向教师的知识体系与学习活动管理</p>
      </div>

      <div class="resource-body">
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

        <div class="main-content">
          <TeacherKnowledgeManagement v-if="activeTab === 'knowledge'" />
          <TeacherActivityManagement v-else />
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import { Document, VideoPlay } from '@element-plus/icons-vue';
import TeacherLayout from '../layout/TeacherLayout.vue';
import TeacherKnowledgeManagement from './components/TeacherKnowledgeManagement.vue';
import TeacherActivityManagement from './components/TeacherActivityManagement.vue';

const activeTab = ref('knowledge');

const menuItems = [
  { key: 'knowledge', label: '知识体系管理', icon: Document },
  { key: 'activities', label: '学习活动管理', icon: VideoPlay }
];
</script>

<style scoped>
.resource-manage-container {
  width: 100%;
  min-height: calc(100vh - 120px);
}

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

.page-subtitle {
  margin-top: 6px;
  color: #64748b;
  font-size: 14px;
}

.resource-body {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.sidebar {
  width: 220px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  height: fit-content;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
  margin-bottom: 4px;
}

.menu-item:hover {
  background: #e2e8f0;
}

.menu-item.active {
  background: #2563eb;
  color: #fff;
}

.menu-item.active .menu-icon {
  color: #fff;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
</style>

