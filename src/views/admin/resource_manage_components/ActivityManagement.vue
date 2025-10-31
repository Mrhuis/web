<template>
  <div class="activity-management">
    <el-tabs v-model="activeSubTab" type="card" class="sub-tabs">
      <!-- 习题管理 -->
      <el-tab-pane label="习题管理" name="items">
        <div class="tab-content">
          <ItemManagement :selectedPlugin="selectedPlugin" />
        </div>
      </el-tab-pane>

      <!-- 视频管理 -->
      <el-tab-pane label="视频管理" name="videos">
        <div class="tab-content">
          <MediaManagement 
            ref="mediaManagementRef"
            :selectedPluginForVideo="selectedPluginForVideo" 
          />
        </div>
      </el-tab-pane>

      <!-- 动画管理 -->
      <el-tab-pane label="动画管理" name="animations">
        <div class="tab-content">
          <AnimationManagement :selectedPluginForAnimation="selectedPluginForAnimation" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import ItemManagement from './activity_components/ItemManagement.vue';
import MediaManagement from './activity_components/MediaManagement.vue';
import AnimationManagement from './activity_components/AnimationManagement.vue';

// 活动管理相关
const activeSubTab = ref('items');

// 筛选条件
const selectedPlugin = ref('');
const selectedPluginForVideo = ref('');
const selectedPluginForAnimation = ref('');

// 媒体管理组件引用
const mediaManagementRef = ref(null);

// 监听活动管理标签页变化
watch(activeSubTab, (newTab) => {
  if (newTab === 'videos' && mediaManagementRef.value) {
    // 当切换到视频管理页面时，刷新数据
    mediaManagementRef.value.fetchVideos();
    mediaManagementRef.value.fetchRelatedData();
  }
});
</script>

<style scoped>
.activity-management {
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

.tab-content {
  width: 100%;
  min-width: 0;
}

/* 更精确的深度选择器，只影响当前组件内的tabs */
.activity-management :deep(.el-tabs__content) {
  padding: 0;
  width: 100%;
  min-width: 0;
}

.activity-management :deep(.el-tab-pane) {
  width: 100%;
  min-width: 0;
}

/* 确保tabs组件不会影响外部样式 */
.activity-management :deep(.el-tabs) {
  width: 100%;
  min-width: 0;
}

.activity-management :deep(.el-tabs__header) {
  margin: 0 0 16px 0;
}

.activity-management :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.activity-management :deep(.el-tabs__nav) {
  border: none;
}

.activity-management :deep(.el-tabs__item) {
  border: 1px solid #d4d7de;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
}

.activity-management :deep(.el-tabs__item.is-active) {
  border-bottom: 1px solid #fff;
  background: #fff;
}

:deep(.el-table) {
  width: 100%;
  min-width: 0;
}
</style> 