<template>
  <div class="knowledge-management">
    <el-tabs v-model="activeSubTab" type="card" class="sub-tabs">
      <!-- 知识点管理 -->
      <el-tab-pane label="知识点管理" name="knowledge">
        <KnowledgePointManagement />
      </el-tab-pane>
      
      <!-- 章节管理 -->
      <el-tab-pane label="章节管理" name="chapter">
        <ChapterManagementStandalone />
      </el-tab-pane>
      
      <!-- 标签管理 -->
      <el-tab-pane label="标签管理" name="tag">
        <TagManagement />
      </el-tab-pane>
      
      <!-- 资源类型管理 -->
      <el-tab-pane label="资源类型管理" name="resource-form">
        <ResourceFormManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import KnowledgePointManagement from './knowledge_components/KnowledgePointManagement.vue';
import ChapterManagementStandalone from './knowledge_components/ChapterManagementStandalone.vue';
import TagManagement from './knowledge_components/TagManagement.vue';
import ResourceFormManagement from './knowledge_components/ResourceFormManagement.vue';

const activeSubTab = ref('knowledge');
</script>

<style scoped>
.knowledge-management {
  width: 100%;
  min-width: 0;
  /* 确保组件样式隔离 */
  position: relative;
  z-index: 1;
  /* 防止样式泄露到父组件 */
  overflow: hidden;
}

.sub-tabs {
  width: 100%;
}

/* 更精确的深度选择器，只影响当前组件内的tabs */
.knowledge-management :deep(.el-tabs__content) {
  padding: 0;
  width: 100%;
  min-width: 0;
}

.knowledge-management :deep(.el-tab-pane) {
  width: 100%;
  min-width: 0;
}

/* 确保tabs组件不会影响外部样式 */
.knowledge-management :deep(.el-tabs) {
  width: 100%;
  min-width: 0;
}

.knowledge-management :deep(.el-tabs__header) {
  margin: 0 0 16px 0;
}

.knowledge-management :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.knowledge-management :deep(.el-tabs__nav) {
  border: none;
}

.knowledge-management :deep(.el-tabs__item) {
  border: 1px solid #d4d7de;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
}

.knowledge-management :deep(.el-tabs__item.is-active) {
  border-bottom: 1px solid #fff;
  background: #fff;
}
</style>
