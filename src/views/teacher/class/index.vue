<template>
  <TeacherLayout>
    <div class="class-manage-container">
      <div class="page-header">
        <h1 class="page-title">班级管理</h1>
      </div>
      
      <!-- 主内容区域 -->
      <div class="content-wrapper">
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
          <ClassManagement v-if="activeTab === 'class'" />
          <ClassStudentManagement v-if="activeTab === 'student'" />
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import { School, User } from '@element-plus/icons-vue';
import TeacherLayout from '../layout/TeacherLayout.vue';
import ClassManagement from './ClassManagement.vue';
import ClassStudentManagement from './ClassStudentManagement.vue';

const activeTab = ref('class');

const menuItems = [
  { key: 'class', label: '班级管理', icon: 'School' },
  { key: 'student', label: '班级学生管理', icon: 'User' }
];
</script>

<style scoped>
.class-manage-container {
  width: 100%;
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

.content-wrapper {
  display: flex !important;
  gap: 24px !important;
  min-height: 600px;
  align-items: flex-start !important;
}

/* 提高子侧边栏样式优先级，防止被el-tabs等组件影响 */
.content-wrapper .sidebar {
  width: 240px !important;
  min-width: 240px !important;
  max-width: 240px !important;
  background: #f8fafc !important;
  border-radius: 8px !important;
  padding: 16px !important;
  border: 1px solid #e2e8f0 !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  position: relative !important;
  z-index: 10 !important;
}

.content-wrapper .menu-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 16px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  margin-bottom: 4px !important;
}

.content-wrapper .menu-item:hover {
  background: #e2e8f0 !important;
}

.content-wrapper .menu-item.active {
  background: #3b82f6 !important;
  color: white !important;
}

.content-wrapper .menu-item.active .menu-icon {
  color: white !important;
}

.content-wrapper .menu-icon {
  font-size: 18px !important;
  color: #64748b !important;
}

.content-wrapper .menu-text {
  font-size: 14px !important;
  font-weight: 500 !important;
}

.main-content {
  flex: 1 !important;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  min-width: 0 !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: 1 !important;
}
</style>
