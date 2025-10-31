<template>
  <div class="video-item-display">
    <div class="video-header">
      <div class="video-info">
        <span class="video-label">视频资源</span>
        <span class="video-title">{{ item.fileName || '未命名视频' }}</span>
      </div>
      <div class="resource-key-badge">
        <el-icon><Key /></el-icon>
        {{ item.resourceKey }}
      </div>
    </div>

    <div class="video-container">
      <video 
        v-if="videoUrl" 
        :src="videoUrl" 
        controls 
        controlslist="nodownload"
        class="video-player"
        @error="handleVideoError"
      >
        您的浏览器不支持视频播放。
      </video>
      <div v-else class="video-error">
        <el-icon><VideoCamera /></el-icon>
        <p>视频加载失败</p>
      </div>
    </div>

    <div class="video-meta">
      <div class="meta-item">
        <span class="meta-label">文件名：</span>
        <span class="meta-value">{{ item.fileName }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">时长：</span>
        <span class="meta-value">{{ formatDuration(item.duration) }}</span>
      </div>
      <div class="meta-item" v-if="item.url">
        <span class="meta-label">路径：</span>
        <span class="meta-value path-text">{{ item.url }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Key, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

// 处理视频URL
const videoUrl = computed(() => {
  if (!props.item.url) return null
  
  let url = props.item.url
  
  // 如果是相对路径，转换为可访问的路径
  if (!url.startsWith('http')) {
    // 移除开头的 ./ 如果存在
    if (url.startsWith('./')) {
      url = url.substring(1)
    }
    // 确保以 / 开头
    if (!url.startsWith('/')) {
      url = '/' + url
    }
  }
  
  return url
})

// 格式化时长（秒转换为 HH:MM:SS 或 MM:SS）
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

// 处理视频加载错误
const handleVideoError = () => {
  ElMessage.error('视频加载失败，请检查视频路径是否正确')
}
</script>

<style scoped>
.video-item-display {
  padding: 20px;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8e8e8;
}

.video-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-label {
  background-color: #fff0f6;
  color: #eb2f96;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.resource-key-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f0f8ff;
  color: #1890ff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.video-container {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.video-player {
  width: 100%;
  max-height: 600px;
  display: block;
}

.video-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
  font-size: 16px;
}

.video-error .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.video-meta {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  line-height: 1.6;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-weight: 600;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.meta-value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.path-text {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #909399;
}
</style>

