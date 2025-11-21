<template>
  <div class="array-visualization">
    <div class="page-header">
      <div>
        <h1 class="page-title">数组算法可视化</h1>
        <p class="page-subtitle">学习数组相关的排序、搜索和操作算法</p>
      </div>
    </div>
    
    <AlgorithmList :algorithms="algorithms" @select="openDialog" />
    
    <AlgorithmDialog
      v-model="dialogVisible"
      :algorithm="currentAlgorithm"
      :loading="loading"
      :has-data="hasData"
      :current-array="currentArray"
      :current-step-index="currentStepIndex"
      :total-steps="steps.length"
      :current-action="currentAction"
      :current-pointers="currentPointers"
      :changed-elements="changedElements"
      :is-search-algorithm="isSearchAlgorithm"
      :search-indices="searchIndices"
      :current-search-step="currentSearchStep"
      :is-playing="isPlaying"
      @close="handleDialogClose"
      @execute="handleExecute"
      @reset="handleReset"
      @toggle-play="togglePlay"
      @next-step="nextStep"
      @previous-step="previousStep"
      @reset-step="resetStep"
      @step-change="handleStepChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ALGORITHMS } from './config/algorithms';
import { useArrayVisualization } from './composables/useArrayVisualization';
import AlgorithmList from './components/AlgorithmList.vue';
import AlgorithmDialog from './components/AlgorithmDialog.vue';

const algorithms = ref(ALGORITHMS);
const dialogVisible = ref(false);
const currentAlgorithm = ref(null);

const isSearchAlgorithm = computed(() => {
  return currentAlgorithm.value?.type === 'search';
});

// 使用组合式函数
const {
  loading,
  steps,
  currentStepIndex,
  isPlaying,
  hasData,
  currentArray,
  currentAction,
  currentPointers,
  changedElements,
  searchIndices,
  currentSearchStep,
  resetVisualization,
  executeAlgorithm: executeAlgorithmCore,
  togglePlay,
  nextStep,
  previousStep,
  resetStep,
  handleStepChange
} = useArrayVisualization();

const openDialog = (algorithm) => {
  currentAlgorithm.value = algorithm;
  dialogVisible.value = true;
  handleReset();
};

const handleDialogClose = () => {
  resetVisualization();
};

const handleExecute = async ({ arrayInput, target, steps: stepsParam }) => {
  if (!currentAlgorithm.value) return;
  
  await executeAlgorithmCore(
    currentAlgorithm.value.id,
    arrayInput,
    target,
    stepsParam
  );
};

const handleReset = () => {
  resetVisualization();
};

// 监听弹窗关闭，清理定时器
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    resetVisualization();
  }
});
</script>

<style scoped>
.array-visualization {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}
</style>
