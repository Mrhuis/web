<template>
  <div class="array-visualization-area">
    <!-- 显示当前步骤的详细信息 -->
    <div v-if="showDebugInfo" class="step-debug-info">
      <el-alert 
        :title="`当前步骤: ${currentStepIndex + 1} / ${totalSteps} | 步骤索引: ${currentStepIndex}`" 
        type="success" 
        :closable="false"
        style="margin-bottom: 10px;"
      />
    </div>
    
    <!-- 显示当前步骤的行为描述 -->
    <div v-if="currentAction" class="step-action-info">
      <el-alert :title="currentAction" type="info" :closable="false" />
    </div>
    
    <div class="array-display">
      <div
        v-for="(item, index) in array"
        :key="`step-${currentStepIndex}-idx-${index}-val-${item.value}-orig-${item.originalIndex !== undefined ? item.originalIndex : 'none'}-pointers-${pointers.join(',')}`"
        class="array-element"
        :class="getElementClass(item, index)"
      >
        <div class="element-value">{{ item.value }}</div>
        <div class="element-index">索引: {{ index }}</div>
        <div v-if="item.originalIndex !== undefined" class="element-original">
          原位置: {{ item.originalIndex }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  array: {
    type: Array,
    required: true
  },
  currentStepIndex: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  currentAction: {
    type: String,
    default: ''
  },
  pointers: {
    type: Array,
    default: () => []
  },
  changedElements: {
    type: Set,
    default: () => new Set()
  },
  isSearchAlgorithm: {
    type: Boolean,
    default: false
  },
  searchIndices: {
    type: Array,
    default: () => []
  },
  currentSearchStep: {
    type: Number,
    default: -1
  },
  showDebugInfo: {
    type: Boolean,
    default: false
  }
});

const getElementClass = (item, index) => {
  const classes = [];
  
  if (props.isSearchAlgorithm) {
    if (props.pointers.includes(index)) {
      classes.push('active-search');
    }
  } else {
    if (props.pointers.includes(index)) {
      classes.push('element-pointer');
    }
    
    if (props.changedElements.has(index)) {
      classes.push('element-changed');
    }
  }
  
  return classes;
};
</script>

<style scoped>
.array-visualization-area {
  padding: 20px 0;
}

.array-display {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  align-items: flex-start;
  min-height: 200px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.array-element {
  background: white;
  border: 2px solid #409eff;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 80px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.array-element.active-search {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
}

.array-element.element-changed {
  background: #fff7e6;
  border-color: #ff9800;
  animation: pulse 1s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.array-element.element-pointer {
  background: #e8f5e9;
  border-color: #4caf50;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.step-action-info {
  margin-bottom: 16px;
}

.element-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.element-index {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.element-original {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>

