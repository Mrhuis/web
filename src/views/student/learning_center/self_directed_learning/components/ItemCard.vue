<template>
  <el-card 
    :class="['item-card', { 'checked-card': isItemChecked }]"
    shadow="hover"
    @click="handleCardClick"
  >
    <div class="card-header">
      <div class="item-type-badge" :class="`type-${item.formKey}`">
        {{ getItemTypeName(item.formKey) }}
      </div>
      <div class="difficulty-badge" :class="`difficulty-${item.difficulty}`">
        {{ getDifficultyText(item.difficulty) }}
      </div>
    </div>
    
    <div class="card-content">
      <div class="item-title" :title="getItemTitle(item)">
        {{ getItemTitle(item) }}
      </div>
      <div class="item-meta">
        <span class="resource-key">
          <el-icon><Key /></el-icon>
          {{ item.itemKey }}
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
import { Key } from '@element-plus/icons-vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

// 获取题目类型名称
const getItemTypeName = (formKey) => {
  const typeMap = {
    'qa': '问答题',
    'choice': '选择题',
    'judge': '判断题',
    'blank': '填空题',
    'video': '视频',
    'code': '编程题',
    'drawing': '画图题',
    'document': '文档'
  };
  return typeMap[formKey] || '未知类型';
};

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    1: '简单',
    2: '中等',
    3: '较难',
    4: '困难',
    5: '极难'
  };
  return difficultyMap[difficulty] || '未知';
};

// 获取卡片标题
const getItemTitle = (item) => {
  if (item.formType === 'item' || item.formKey) {
    // 题目类型，显示题目内容的前50个字符
    const content = item.content || '无内容';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }
  return '资源';
};

// 检查卡片是否已完成
const RECORDS_KEY = 'self_directed_learning_records';
const loadRecords = () => {
  const records = localStorage.getItem(RECORDS_KEY);
  return records ? JSON.parse(records) : {};
};
const getRecordKey = (formKey, resourceKey) => `${formKey}_${resourceKey}`;
const isItemChecked = computed(() => {
  const records = loadRecords();
  const key = getRecordKey(props.item.formKey, props.item.itemKey);
  return !!records[key];
});

// 处理卡片点击
const handleCardClick = () => {
  emit('click', props.item);
};
</script>

<style scoped>
.item-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
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

.type-qa {
  background: #e6f7ff;
  color: #1890ff;
}

.type-choice {
  background: #f0f5ff;
  color: #597ef7;
}

.type-judge {
  background: #fff7e6;
  color: #fa8c16;
}

.type-blank {
  background: #f6ffed;
  color: #52c41a;
}

.type-video {
  background: #fff0f6;
  color: #eb2f96;
}

.type-document {
  background: #f9f0ff;
  color: #722ed1;
}

.type-code {
  background: #e6f4ff;
  color: #166de8;
}

.type-drawing {
  background: #f8e6ff;
  color: #be29ec;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.difficulty-1 {
  background: #d4f4dd;
  color: #389e0d;
}

.difficulty-2 {
  background: #d3f1ff;
  color: #0958d9;
}

.difficulty-3 {
  background: #ffecc0;
  color: #d46b08;
}

.difficulty-4 {
  background: #ffd6e7;
  color: #c41d7f;
}

.difficulty-5 {
  background: #ffd4d4;
  color: #cf1322;
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

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
</style>
