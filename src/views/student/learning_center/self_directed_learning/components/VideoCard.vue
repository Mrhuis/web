<template>
  <el-card 
    :class="['video-card', { 'checked-card': isItemChecked }]"
    shadow="hover"
    @click="handleCardClick"
  >
    <div class="card-header">
      <div class="item-type-badge type-video">
        视频
      </div>
    </div>
    
    <div class="card-content">
      <div class="item-title" :title="getItemTitle(item)">
        {{ getItemTitle(item) }}
      </div>
      <div class="item-meta">
        <span class="resource-key">
          <el-icon><Key /></el-icon>
          {{ item.mediaKey || item.media_key }}
        </span>
        <span v-if="item.duration" class="video-duration">
          <el-icon><VideoCamera /></el-icon>
          {{ formatDuration(item.duration) }}
        </span>
      </div>
    </div>
    
    <div class="card-footer">
      <el-button type="primary" size="small" @click.stop="handleCardClick">
        查看详情
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { Key, VideoCamera } from '@element-plus/icons-vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

// 获取卡片标题
const getItemTitle = (item) => {
  return item.fileName || item.file_name || '视频资源';
};

// 格式化视频时长（秒转换为 HH:MM:SS 或 MM:SS）
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 检查卡片是否已完成（视频为watchRate=1也算）
const RECORDS_KEY = 'self_directed_learning_records';
const loadRecords = () => {
  const records = localStorage.getItem(RECORDS_KEY);
  return records ? JSON.parse(records) : {};
};
const getRecordKey = (formKey, resourceKey) => `${formKey}_${resourceKey}`;
const isItemChecked = computed(() => {
  const records = loadRecords();
  const resourceKey = props.item.mediaKey || props.item.media_key;
  const key = getRecordKey('video', resourceKey);
  const saved = records[key];
  return saved && saved.formKey === 'video' && saved.watchRate === 1;
});

// 处理卡片点击
const handleCardClick = () => {
  emit('click', props.item);
};
</script>

<style scoped>
.video-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.checked-card {
  background: #ebf5ff !important;
  box-shadow: 0 0 0 2px #1890ff inset;
  border-color: #1890ff !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-video {
  background: #fff0f6;
  color: #eb2f96;
}

.card-content {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  min-height: 72px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.resource-key {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #eb2f96;
  font-weight: 500;
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
</style>
