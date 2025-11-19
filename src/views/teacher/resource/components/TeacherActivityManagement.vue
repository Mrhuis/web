<template>
  <div class="activity-management">
    <el-tabs v-model="activeSubTab" type="card" class="sub-tabs">
      <el-tab-pane label="习题管理" name="items">
        <TeacherItemManagement />
      </el-tab-pane>
      <el-tab-pane label="视频管理" name="media">
        <TeacherMediaManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TeacherItemManagement from './activity/TeacherItemManagement.vue';
import TeacherMediaManagement from './activity/TeacherMediaManagement.vue';

const activeSubTab = ref('items');
</script>

<style scoped>
.activity-management {
  width: 100%;
  min-width: 0;
}

.sub-tabs {
  width: 100%;
}

.activity-management :deep(.el-tabs__content) {
  padding: 0;
}

.activity-management :deep(.el-tab-pane) {
  padding: 0;
}

.activity-management :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.activity-management :deep(.el-tabs__item) {
  border: 1px solid #d4d7de;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
}

.activity-management :deep(.el-tabs__item.is-active) {
  background: #fff;
}
</style>

