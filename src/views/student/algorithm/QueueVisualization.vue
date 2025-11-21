<template>
  <div class="queue-visualization">
    <div class="page-header">
      <div>
        <h1 class="page-title">队列算法可视化</h1>
        <p class="page-subtitle">交互式演示 FIFO 队列的核心操作</p>
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
      :is-search-algorithm="false"
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
import { ref, watch } from 'vue';
import AlgorithmList from './components/AlgorithmList.vue';
import AlgorithmDialog from './components/AlgorithmDialog.vue';
import { QUEUE_ALGORITHMS } from './config/queueAlgorithms';
import { useQueueVisualization } from './composables/useQueueVisualization';

const algorithms = ref(QUEUE_ALGORITHMS);
const dialogVisible = ref(false);
const currentAlgorithm = ref(null);

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
  executeAlgorithm,
  togglePlay,
  nextStep,
  previousStep,
  resetStep,
  handleStepChange
} = useQueueVisualization();

const openDialog = (algorithm) => {
  currentAlgorithm.value = algorithm;
  dialogVisible.value = true;
  handleReset();
};

const handleDialogClose = () => {
  resetVisualization();
};

const handleExecute = async ({ arrayInput, target, capacity }) => {
  if (!currentAlgorithm.value) return;
  await executeAlgorithm(currentAlgorithm.value.id, arrayInput, target, capacity);
};

const handleReset = () => {
  resetVisualization();
};

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    resetVisualization();
  }
});
</script>

<style scoped>
.queue-visualization {
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