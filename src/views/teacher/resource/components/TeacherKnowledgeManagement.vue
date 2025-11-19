<template>
  <div class="knowledge-management">
    <el-tabs v-model="activeSubTab" type="card" class="sub-tabs">
      <el-tab-pane label="知识点管理" name="knowledge">
        <TeacherKnowledgePointManagement />
      </el-tab-pane>
      <el-tab-pane label="章节管理" name="chapters">
        <TeacherChapterManagement />
      </el-tab-pane>
      <el-tab-pane label="标签管理" name="tags">
        <TeacherTagManagement />
      </el-tab-pane>
      <el-tab-pane label="资源形式管理" name="resource-forms">
        <TeacherResourceFormManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TeacherKnowledgePointManagement from './knowledge/TeacherKnowledgePointManagement.vue';
import TeacherChapterManagement from './knowledge/TeacherChapterManagement.vue';
import TeacherTagManagement from './knowledge/TeacherTagManagement.vue';
import TeacherResourceFormManagement from './knowledge/TeacherResourceFormManagement.vue';

const activeSubTab = ref('knowledge');
</script>

<style scoped>
.knowledge-management {
  width: 100%;
  min-width: 0;
}

.sub-tabs {
  width: 100%;
}

.knowledge-management :deep(.el-tabs__content) {
  padding: 0;
}

.knowledge-management :deep(.el-tab-pane) {
  padding: 0;
}

.knowledge-management :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.knowledge-management :deep(.el-tabs__item) {
  border: 1px solid #d4d7de;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
}

.knowledge-management :deep(.el-tabs__item.is-active) {
  background: #fff;
}
</style>

