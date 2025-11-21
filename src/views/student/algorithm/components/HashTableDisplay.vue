<template>
  <div class="hash-table-visualization-area">
    <div v-if="currentAction" class="step-action-info">
      <el-alert :title="currentAction" type="info" :closable="false" />
    </div>

    <div class="hash-table-grid">
      <div
        v-for="(slot, index) in normalizedArray"
        :key="`hash-slot-${index}`"
        class="hash-slot"
        :class="slotClass(index, slot)"
      >
        <div class="slot-header">
          <span>槽位 {{ index }}</span>
          <el-tag v-if="pointers.includes(index)" size="small" type="success">指针</el-tag>
        </div>
        <div class="slot-body">
          <div class="slot-key">
            <span>键：</span>
            <strong>{{ slot.keyLabel }}</strong>
          </div>
          <div class="slot-value">
            <span>值：</span>
            <strong>{{ slot.valueLabel }}</strong>
          </div>
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
    default: () => []
  },
  currentStepIndex: {
    type: Number,
    default: 0
  },
  totalSteps: {
    type: Number,
    default: 0
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

const normalizedArray = computed(() => {
  if (!Array.isArray(props.array)) {
    return [];
  }

  return props.array.map((item) => {
    if (!item || item.value === undefined || item.value === null) {
      return {
        keyLabel: '--',
        valueLabel: '--',
        isEmpty: true
      };
    }

    const isEmpty = item.value === -1;

    return {
      keyLabel: isEmpty ? '--' : (item.originalIndex ?? '--'),
      valueLabel: isEmpty ? '--' : item.value,
      isEmpty
    };
  });
});

const slotClass = (index, slot) => {
  const classes = [];

  if (slot.isEmpty) {
    classes.push('hash-slot-empty');
  }

  if (props.pointers.includes(index)) {
    classes.push('hash-slot-pointer');
  }

  if (props.changedElements && props.changedElements.has(index)) {
    classes.push('hash-slot-changed');
  }

  return classes;
};
</script>

<style scoped>
.hash-table-visualization-area {
  padding: 20px 0;
}

.hash-table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.hash-slot {
  background: white;
  border: 2px solid #409eff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
  min-height: 120px;
}

.hash-slot-empty {
  border-style: dashed;
  opacity: 0.7;
}

.hash-slot-pointer {
  border-color: #4caf50;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
}

.hash-slot-changed {
  border-color: #ff9800;
  background: #fff7e6;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1f2937;
}

.slot-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

.slot-key,
.slot-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-action-info {
  margin-bottom: 16px;
}
</style>


