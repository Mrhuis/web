<template>
  <div class="linkedlist-visualization-area">
    <!-- 当前步骤行为描述 -->
    <div v-if="currentAction" class="step-action-info">
      <el-alert :title="currentAction" type="info" :closable="false" />
    </div>

    <div class="linkedlist-display">
      <div
        v-for="(node, index) in array"
        :key="`ll-step-${currentStepIndex}-idx-${index}-val-${node.value}`"
        class="linkedlist-node"
        :class="getNodeClass(node, index)"
      >
        <div class="node-box">
          <div class="node-header">
            <span v-if="node.prevIndex === null" class="node-tag head">HEAD</span>
            <span v-if="node.nextIndex === null" class="node-tag tail">TAIL</span>
            <span v-if="pointers.includes(index)" class="node-tag pointer">PTR</span>
          </div>
          <div class="node-value">{{ node.value }}</div>
          <div class="node-meta">
            <span class="meta-item">idx: {{ index }}</span>
            <span class="meta-item">ptrIdx: {{ node.pointerIndex === null || node.pointerIndex === undefined ? 'null' : node.pointerIndex }}</span>
            <span class="meta-item">prev: {{ node.prevIndex === null ? 'null' : node.prevIndex }}</span>
            <span class="meta-item">next: {{ node.nextIndex === null ? 'null' : node.nextIndex }}</span>
          </div>
        </div>

        <!-- 指向下一个节点的箭头（逻辑 next 指针） -->
        <div
          v-if="node.nextIndex !== null && index < array.length - 1"
          class="arrow"
        >
          <span class="arrow-line"></span>
          <span class="arrow-head">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  }
});

const getNodeClass = (node, index) => {
  const classes = [];

  if (props.pointers.includes(index)) {
    classes.push('node-pointer');
  }

  if (props.changedElements.has(index)) {
    classes.push('node-changed');
  }

  return classes;
};
</script>

<style scoped>
.linkedlist-visualization-area {
  padding: 20px 0;
}

.step-action-info {
  margin-bottom: 16px;
}

.linkedlist-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  min-height: 200px;
}

.linkedlist-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-box {
  background: #ffffff;
  border: 2px solid #409eff;
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.node-header {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.node-tag {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  color: #ffffff;
}

.node-tag.head {
  background-color: #10b981;
}

.node-tag.tail {
  background-color: #6366f1;
}

.node-tag.pointer {
  background-color: #f97316;
}

.node-value {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  margin-bottom: 6px;
}

.node-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #6b7280;
}

.meta-item {
  line-height: 1.2;
}

.arrow {
  display: flex;
  align-items: center;
  gap: 2px;
}

.arrow-line {
  display: inline-block;
  width: 24px;
  height: 2px;
  background-color: #9ca3af;
  border-radius: 999px;
}

.arrow-head {
  font-size: 18px;
  color: #4b5563;
}

.linkedlist-node.node-pointer .node-box {
  background: #e8f5e9;
  border-color: #4caf50;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.linkedlist-node.node-changed .node-box {
  background: #fff7e6;
  border-color: #ff9800;
  animation: pulse 1s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>


