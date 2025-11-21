<template>
  <el-dialog
    v-model="visible"
    :title="algorithm?.name"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 参数输入区域 -->
      <el-card class="input-card" shadow="never">
        <template #header>
          <span>输入参数</span>
        </template>
        <el-form :model="inputForm" label-width="120px">
          <el-form-item v-if="showArrayInput" label="数组元素" required>
            <el-input
              v-model="inputForm.arrayInput"
              placeholder="请输入数组元素，用逗号分隔，例如：64,34,25,12,22,11,90"
              clearable
            />
            <div class="form-tip">多个数字请用英文逗号分隔</div>
          </el-form-item>
          <el-form-item
            v-if="needsHashTableArrays"
            label="键数组"
            required
          >
            <el-input
              v-model="inputForm.keysInput"
              placeholder="请输入键数组，例如：1,12,23,34"
              clearable
            />
            <div class="form-tip">多个键请用英文逗号分隔</div>
          </el-form-item>
          <el-form-item
            v-if="needsHashTableArrays"
            label="值数组"
            required
          >
            <el-input
              v-model="inputForm.valuesInput"
              placeholder="请输入值数组，例如：10,20,30,40"
              clearable
            />
            <div class="form-tip">多个值请用英文逗号分隔</div>
          </el-form-item>
          <el-form-item
            v-if="needsTarget"
            :label="targetLabel"
            required
          >
            <el-input-number
              v-model="inputForm.target"
              :min="0"
              :placeholder="targetPlaceholder"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="needsSteps"
            label="旋转步长"
            required
          >
            <el-input-number
              v-model="inputForm.steps"
              :min="0"
              placeholder="请输入旋转步长"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="needsCapacity"
            label="队列容量"
            required
          >
            <el-input-number
              v-model="inputForm.capacity"
              :min="1"
              placeholder="请输入队列容量"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="needsHashKey"
            label="操作的键"
            required
          >
            <el-input-number
              v-model="inputForm.hashKey"
              :placeholder="hashKeyPlaceholder"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item
            v-if="needsHashValue"
            label="操作的值"
            required
          >
            <el-input-number
              v-model="inputForm.hashValue"
              placeholder="请输入要插入的值"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleExecute">
              开始可视化
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 可视化展示区域 -->
      <el-card v-if="hasData" class="visualization-card" shadow="never">
        <template #header>
          <div class="card-header-actions">
            <span>算法执行过程</span>
            <div class="control-buttons">
              <el-button-group>
                <el-button
                  :icon="isPlaying ? VideoPause : VideoPlay"
                  @click="handleTogglePlay"
                  :disabled="!hasData"
                >
                  {{ isPlaying ? '暂停' : '播放' }}
                </el-button>
                <el-button
                  :icon="ArrowLeft"
                  @click="handlePreviousStep"
                  :disabled="currentStepIndex === 0 || isPlaying"
                >
                  上一步
                </el-button>
                <el-button
                  :icon="ArrowRight"
                  @click="handleNextStep"
                  :disabled="currentStepIndex >= totalSteps - 1 || isPlaying"
                >
                  下一步
                </el-button>
                <el-button
                  :icon="RefreshLeft"
                  @click="handleResetStep"
                  :disabled="currentStepIndex === 0"
                >
                  重置
                </el-button>
              </el-button-group>
              <el-slider
                :model-value="currentStepIndex"
                :min="0"
                :max="totalSteps - 1"
                :step="1"
                :disabled="isPlaying"
                style="width: 200px; margin-left: 10px"
                @change="handleStepChange"
              />
              <span class="step-info">
                步骤 {{ currentStepIndex + 1 }} / {{ totalSteps }}
              </span>
            </div>
          </div>
        </template>

        <component
          :is="displayComponent"
          :array="currentArray"
          :current-step-index="currentStepIndex"
          :total-steps="totalSteps"
          :current-action="currentAction"
          :pointers="currentPointers"
          :changed-elements="changedElements"
          :is-search-algorithm="isLinkedList || isHashTable ? false : isSearchAlgorithm"
          :search-indices="isLinkedList ? [] : searchIndices"
          :current-search-step="isLinkedList ? -1 : currentSearchStep"
        />
      </el-card>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { VideoPlay, VideoPause, ArrowLeft, ArrowRight, RefreshLeft } from '@element-plus/icons-vue';
import { parseArray } from '../utils/arrayUtils';
import ArrayDisplay from './ArrayDisplay.vue';
import LinkedListDisplay from './LinkedListDisplay.vue';
import HashTableDisplay from './HashTableDisplay.vue';
import TreeDisplay from './TreeDisplay.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  algorithm: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasData: {
    type: Boolean,
    default: false
  },
  currentArray: {
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
  currentPointers: {
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
  isPlaying: {
    type: Boolean,
    default: false
  },
  // 是否以链表形式展示（显式 prev/next 指针）
  isLinkedList: {
    type: Boolean,
    default: false
  },
  // 是否以哈希表形式展示
  isHashTable: {
    type: Boolean,
    default: false
  },
  // 是否以树形结构展示
  isTree: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'execute', 'reset', 'toggle-play', 'next-step', 'previous-step', 'reset-step', 'step-change']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const inputForm = ref({
  arrayInput: '64,34,25,12,22,11,90',
  target: null,
  steps: null,
  capacity: null,
  keysInput: '1,12,23,34',
  valuesInput: '10,20,30,40',
  hashKey: null,
  hashValue: null
});

const needsTarget = computed(() => {
  if (!props.algorithm) return false;
  if (props.algorithm.requiresTarget) return true;
  return props.algorithm.type === 'search' || props.algorithm.type === 'value';
});

const targetLabel = computed(() => {
  if (!props.algorithm) return '目标值';
  if (props.algorithm.targetLabel) return props.algorithm.targetLabel;
  // 根据不同算法类型调整标签文案
  if (props.algorithm.id === 'delete-node') {
    return '要删除的值';
  }
  if (props.algorithm.id === 'insert-at-head' || props.algorithm.id === 'insert-at-tail') {
    return '要插入的值';
  }
  if (props.algorithm.id === 'stack-push') {
    return '入栈的值';
  }
  if (props.algorithm.type === 'search') {
    return '要搜索的值';
  }
  return '目标值';
});

const targetPlaceholder = computed(() => {
  if (!props.algorithm) return '请输入目标值';
  if (props.algorithm.targetPlaceholder) return props.algorithm.targetPlaceholder;
  if (props.algorithm.id === 'delete-node') {
    return '请输入要删除的值';
  }
  if (props.algorithm.id === 'insert-at-head' || props.algorithm.id === 'insert-at-tail') {
    return '请输入要插入的值';
  }
  if (props.algorithm.id === 'stack-push') {
    return '请输入要入栈的值';
  }
  if (props.algorithm.type === 'search') {
    return '请输入要搜索的目标值';
  }
  return '请输入目标值';
});

const showArrayInput = computed(() => {
  if (!props.algorithm) return true;
  return props.algorithm.requiresArrayInput !== false;
});

const needsHashTableArrays = computed(() => {
  return !!props.algorithm?.requiresHashTableArrays;
});

const needsHashKey = computed(() => {
  return !!props.algorithm?.requiresHashKey;
});

const needsHashValue = computed(() => {
  return !!props.algorithm?.requiresHashValue;
});

const hashKeyPlaceholder = computed(() => {
  if (!props.algorithm) return '请输入要操作的键';
  if (props.algorithm.id === 'hash-insert') {
    return '请输入要插入的键';
  }
  if (props.algorithm.id === 'hash-search') {
    return '请输入要查找的键';
  }
  if (props.algorithm.id === 'hash-delete') {
    return '请输入要删除的键';
  }
  return '请输入要操作的键';
});

const displayComponent = computed(() => {
  if (props.isLinkedList) {
    return LinkedListDisplay;
  }
  if (props.isHashTable) {
    return HashTableDisplay;
  }
  if (props.isTree) {
    return TreeDisplay;
  }
  return ArrayDisplay;
});

const needsSteps = computed(() => {
  return props.algorithm?.id === 'rotate-array';
});

const needsCapacity = computed(() => {
  return props.algorithm?.requiresCapacity || props.algorithm?.id === 'queue-circular';
});

const handleClose = () => {
  emit('close');
};

const handleExecute = () => {
  try {
    if (showArrayInput.value) {
      parseArray(inputForm.value.arrayInput);
    }

    if (needsHashTableArrays.value) {
      const keys = parseArray(inputForm.value.keysInput);
      const values = parseArray(inputForm.value.valuesInput);
      if (keys.length !== values.length) {
        ElMessage.warning('键数组和值数组长度必须一致');
        return;
      }
    }
    
    if (needsTarget.value && (inputForm.value.target === null || inputForm.value.target === undefined)) {
      ElMessage.warning('请输入目标值');
      return;
    }
    
    if (needsSteps.value && (inputForm.value.steps === null || inputForm.value.steps === undefined)) {
      ElMessage.warning('请输入旋转步长');
      return;
    }

    if (needsCapacity.value && (inputForm.value.capacity === null || inputForm.value.capacity === undefined)) {
      ElMessage.warning('请输入队列容量');
      return;
    }

    if (needsHashKey.value && (inputForm.value.hashKey === null || inputForm.value.hashKey === undefined)) {
      ElMessage.warning('请输入操作的键');
      return;
    }

    if (needsHashValue.value && (inputForm.value.hashValue === null || inputForm.value.hashValue === undefined)) {
      ElMessage.warning('请输入操作的值');
      return;
    }

    emit('execute', {
      arrayInput: inputForm.value.arrayInput,
      target: inputForm.value.target,
      steps: inputForm.value.steps,
      capacity: inputForm.value.capacity,
      keysInput: inputForm.value.keysInput,
      valuesInput: inputForm.value.valuesInput,
      hashKey: inputForm.value.hashKey,
      hashValue: inputForm.value.hashValue
    });
  } catch (error) {
    ElMessage.error(error.message);
  }
};

const handleReset = () => {
  inputForm.value = {
    arrayInput: '64,34,25,12,22,11,90',
    target: null,
    steps: null,
    capacity: null,
    keysInput: '1,12,23,34',
    valuesInput: '10,20,30,40',
    hashKey: null,
    hashValue: null
  };
  emit('reset');
};

const handleTogglePlay = () => {
  emit('toggle-play');
};

const handleNextStep = () => {
  emit('next-step');
};

const handlePreviousStep = () => {
  emit('previous-step');
};

const handleResetStep = () => {
  emit('reset-step');
};

const handleStepChange = (value) => {
  emit('step-change', value);
};

// 监听弹窗打开，重置输入
watch(visible, (newVal) => {
  if (newVal) {
    handleReset();
  }
});
</script>

<style scoped>
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-card,
.visualization-card {
  border: 1px solid #e5e7eb;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.card-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.step-info {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .card-header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .control-buttons {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-buttons .el-button-group {
    width: 100%;
  }
  
  .control-buttons .el-button-group .el-button {
    flex: 1;
  }
}
</style>

