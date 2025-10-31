<template>
  <StudentLayout>
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">学习中心</h1>
    </div>
    
    <!-- 主内容区域 -->
    <div class="learning-container">
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
        <RecommendedLearning v-if="activeTab === 'recommended'" />
        <SelfDirectedLearning v-if="activeTab === 'self-directed'" />
        <AlgorithmVisualizationLearning v-if="activeTab === 'algorithm-visualization'" />
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref } from 'vue';
import { Star, ReadingLamp, Monitor } from '@element-plus/icons-vue';
import StudentLayout from './StudentLayout.vue';
import RecommendedLearning from './learning_center/recommended_learning/RecommendedLearning.vue';
import SelfDirectedLearning from './learning_center/self_directed_learning/SelfDirectedLearning.vue';
import AlgorithmVisualizationLearning from './learning_center/algorithm_visualization_learning/AlgorithmVisualizationLearning.vue';

const activeTab = ref('recommended');

const menuItems = [
  { key: 'recommended', label: '推荐学习', icon: 'Star' },
  { key: 'self-directed', label: '自主学习', icon: 'ReadingLamp' },
  { key: 'algorithm-visualization', label: '算法可视化学习', icon: 'Monitor' }
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

.learning-container {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

/* 提高子侧边栏样式优先级，防止被el-tabs等组件影响 */
.learning-container .sidebar {
  width: 240px !important;
  background: #f8fafc !important;
  border-radius: 8px !important;
  padding: 16px !important;
  border: 1px solid #e2e8f0 !important;
  flex-shrink: 0 !important;
}

.learning-container .menu-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 16px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  margin-bottom: 4px !important;
}

.learning-container .menu-item:hover {
  background: #e2e8f0 !important;
}

.learning-container .menu-item.active {
  background: #3b82f6 !important;
  color: white !important;
}

.learning-container .menu-item.active .menu-icon {
  color: white !important;
}

.learning-container .menu-icon {
  font-size: 18px !important;
  color: #64748b !important;
}

.learning-container .menu-text {
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
}
</style>

