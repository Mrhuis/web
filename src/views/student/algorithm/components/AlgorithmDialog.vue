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
          <el-form-item label="数组元素" required>
            <el-input
              v-model="inputForm.arrayInput"
              placeholder="请输入数组元素，用逗号分隔，例如：64,34,25,12,22,11,90"
              clearable
            />
            <div class="form-tip">多个数字请用英文逗号分隔</div>
          </el-form-item>
          <el-form-item
            v-if="needsTarget"
            label="目标值"
            required
          >
            <el-input-number
              v-model="inputForm.target"
              :min="0"
              placeholder="请输入要搜索的目标值"
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

        <ArrayDisplay
          :array="currentArray"
          :current-step-index="currentStepIndex"
          :total-steps="totalSteps"
          :current-action="currentAction"
          :pointers="currentPointers"
          :changed-elements="changedElements"
          :is-search-algorithm="isSearchAlgorithm"
          :search-indices="searchIndices"
          :current-search-step="currentSearchStep"
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
  steps: null
});

const needsTarget = computed(() => {
  return props.algorithm?.type === 'search';
});

const needsSteps = computed(() => {
  return props.algorithm?.id === 'rotate-array';
});

const handleClose = () => {
  emit('close');
};

const handleExecute = () => {
  try {
    parseArray(inputForm.value.arrayInput);
    
    if (needsTarget.value && (inputForm.value.target === null || inputForm.value.target === undefined)) {
      ElMessage.warning('请输入目标值');
      return;
    }
    
    if (needsSteps.value && (inputForm.value.steps === null || inputForm.value.steps === undefined)) {
      ElMessage.warning('请输入旋转步长');
      return;
    }

    emit('execute', {
      arrayInput: inputForm.value.arrayInput,
      target: inputForm.value.target,
      steps: inputForm.value.steps
    });
  } catch (error) {
    ElMessage.error(error.message);
  }
};

const handleReset = () => {
  inputForm.value = {
    arrayInput: '64,34,25,12,22,11,90',
    target: null,
    steps: null
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

