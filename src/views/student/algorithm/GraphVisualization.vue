<template>
  <div class="graph-visualization-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">图算法可视化</h1>
        <p class="page-subtitle">
          学习图遍历、最短路径和最小生成树算法，点击卡片在弹窗中配置并查看动画。
        </p>
      </div>
    </div>

    <AlgorithmList :algorithms="algorithms" @select="openDialog" />

    <GraphAlgorithmDialog
      v-model="dialogVisible"
      :algorithm="currentAlgorithm"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AlgorithmList from './components/AlgorithmList.vue';
import GraphAlgorithmDialog from './components/GraphAlgorithmDialog.vue';
import { GRAPH_ALGORITHMS } from './config/graphAlgorithms';

const algorithms = ref(GRAPH_ALGORITHMS);
const dialogVisible = ref(false);
const currentAlgorithm = ref(null);

const openDialog = (algorithm) => {
  currentAlgorithm.value = algorithm;
  dialogVisible.value = true;
};

const handleDialogClose = () => {
  dialogVisible.value = false;
};
</script>

<style scoped>
.graph-visualization-page {
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

