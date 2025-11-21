<template>
  <div class="linkedlist-visualization">
    <div class="page-header">
      <div>
        <h1 class="page-title">链表算法可视化</h1>
        <p class="page-subtitle">学习链表相关的插入、删除、反转和指针技巧</p>
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
      :search-indices="[]"
      :current-search-step="-1"
      :is-playing="isPlaying"
      :is-linked-list="true"
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
import { LINKED_LIST_ALGORITHMS } from './config/linkedListAlgorithms';
import { useLinkedListVisualization } from './composables/useLinkedListVisualization';
import AlgorithmList from './components/AlgorithmList.vue';
import AlgorithmDialog from './components/AlgorithmDialog.vue';

const algorithms = ref(LINKED_LIST_ALGORITHMS);
const dialogVisible = ref(false);
const currentAlgorithm = ref(null);

// 使用链表可视化组合式函数
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
  resetVisualization,
  executeAlgorithm: executeAlgorithmCore,
  togglePlay,
  nextStep,
  previousStep,
  resetStep,
  handleStepChange
} = useLinkedListVisualization();

const openDialog = (algorithm) => {
  currentAlgorithm.value = algorithm;
  dialogVisible.value = true;
  handleReset();
};

const handleDialogClose = () => {
  resetVisualization();
};

const handleExecute = async ({ arrayInput, target }) => {
  if (!currentAlgorithm.value) return;

  await executeAlgorithmCore(
    currentAlgorithm.value.id,
    arrayInput,
    target
  );
};

const handleReset = () => {
  resetVisualization();
};

// 监听弹窗关闭，清理定时器和状态
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    resetVisualization();
  }
});
</script>

<style scoped>
.linkedlist-visualization {
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