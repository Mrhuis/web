<template>
  <el-dialog
    v-model="visible"
    :title="props.algorithm?.name || '图算法可视化'"
    width="92%"
    top="4vh"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div class="graph-dialog">
      <div class="panel-header">
        <div>
          <h2>{{ props.algorithm?.name || '请选择算法' }}</h2>
          <p>{{ props.algorithm?.description || '选择一个算法后配置图结构并运行可视化。' }}</p>
        </div>
        <div class="tag-group" v-if="highlightTags.length">
          <el-tag
            v-for="tag in highlightTags"
            :key="tag"
            type="info"
            effect="plain"
            size="small"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <div class="dialog-body">
        <el-card class="config-card" shadow="never">
          <template #header>
            <div class="card-title">
              <span>图结构配置</span>
              <el-button text type="primary" size="small" @click="handleResetGraph">
                恢复默认示例
              </el-button>
            </div>
          </template>

          <el-form label-width="110px">
            <el-form-item label="节点数量">
              <div class="node-count-control">
                <el-input-number
                  v-model="nodeCount"
                  :min="MIN_NODES"
                  :max="MAX_NODES"
                  :step="1"
                />
                <span class="count-hint">建议 3~{{ MAX_NODES }} 个节点</span>
              </div>
            </el-form-item>

            <el-form-item label="节点标签">
              <div class="label-editor">
                <div
                  v-for="(label, index) in nodeLabels"
                  :key="`node-label-${index}`"
                  class="label-field"
                >
                  <span>节点 {{ index + 1 }}</span>
                  <el-input
                    v-model="nodeLabels[index]"
                    size="small"
                    placeholder="如：A"
                    maxlength="8"
                  />
                </div>
              </div>
            </el-form-item>

            <el-form-item label="邻接矩阵">
              <div class="matrix-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th v-for="(label, index) in nodeLabels" :key="`matrix-head-${index}`">
                        {{ displayLabel(label, index) }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in adjacencyMatrixInput" :key="`matrix-row-${rowIndex}`">
                      <th>{{ displayLabel(nodeLabels[rowIndex], rowIndex) }}</th>
                      <td
                        v-for="(_, colIndex) in row"
                        :key="`matrix-cell-${rowIndex}-${colIndex}`"
                        :class="{ 'cell-diagonal': rowIndex === colIndex }"
                      >
                        <span v-if="rowIndex === colIndex" class="diag-value">0</span>
                        <el-input-number
                          v-else
                          :model-value="adjacencyMatrixInput[rowIndex][colIndex]"
                          :min="0"
                          :max="999"
                          :step="1"
                          controls-position="right"
                          size="small"
                          class="matrix-input"
                          @change="(value) => updateMatrixValue(rowIndex, colIndex, value)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="matrix-tip">
                边权为 0 表示不存在边。
                <span v-if="enforceUndirected">Prim / Kruskal 需要无向图，我们已自动保持矩阵对称。</span>
              </p>
            </el-form-item>

            <el-form-item v-if="requiresStartNode" label="起始节点">
              <el-select v-model="startNodeIndex" placeholder="请选择起点" style="width: 100%;">
                <el-option
                  v-for="(label, index) in nodeLabels"
                  :key="`start-node-${index}`"
                  :label="displayLabel(label, index)"
                  :value="index"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading" :disabled="!props.algorithm" @click="handleExecute">
                开始可视化
              </el-button>
              <el-button @click="handleResetGraph">重置输入</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="visualization-card" shadow="never">
          <template #header>
            <div class="card-header-actions">
              <span>算法执行过程</span>
              <div class="control-buttons">
                <el-button-group>
                  <el-button
                    :icon="isPlaying ? VideoPause : VideoPlay"
                    @click="togglePlay"
                    :disabled="!hasData"
                  >
                    {{ isPlaying ? '暂停' : '播放' }}
                  </el-button>
                  <el-button
                    :icon="ArrowLeft"
                    @click="previousStep"
                    :disabled="currentStepIndex === 0 || !hasData || isPlaying"
                  >
                    上一步
                  </el-button>
                  <el-button
                    :icon="ArrowRight"
                    @click="nextStep"
                    :disabled="currentStepIndex >= totalSteps - 1 || !hasData || isPlaying"
                  >
                    下一步
                  </el-button>
                  <el-button
                    :icon="RefreshLeft"
                    @click="resetStep"
                    :disabled="!hasData || currentStepIndex === 0"
                  >
                    重置
                  </el-button>
                </el-button-group>
                <el-slider
                  :model-value="currentStepIndex"
                  :min="0"
                  :max="Math.max(totalSteps - 1, 0)"
                  :step="1"
                  :disabled="!hasData || isPlaying"
                  style="width: 200px; margin-left: 10px"
                  @change="handleStepChange"
                />
                <span class="step-info">
                  步骤 {{ hasData ? currentStepIndex + 1 : 0 }} / {{ totalSteps }}
                </span>
              </div>
            </div>
          </template>

          <GraphDisplay
            :nodes="currentNodes"
            :edges="currentEdges"
            :visited-nodes="currentVisitedNodes"
            :pointers="currentPointers"
            :adjacency-matrix="currentMatrix"
            :current-action="currentAction"
          />
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { VideoPlay, VideoPause, ArrowLeft, ArrowRight, RefreshLeft } from '@element-plus/icons-vue';
import GraphDisplay from './GraphDisplay.vue';
import { useGraphVisualization } from '../composables/useGraphVisualization';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  algorithm: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const MIN_NODES = 2;
const MAX_NODES = 8;
const DEFAULT_NODE_COUNT = 5;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const createDefaultLabels = (count) =>
  Array.from({ length: count }, (_, index) => LETTERS[index] || `节点${index + 1}`);
const createZeroMatrix = (count) =>
  Array.from({ length: count }, () => Array(count).fill(0));

const nodeCount = ref(DEFAULT_NODE_COUNT);
const nodeLabels = ref(createDefaultLabels(DEFAULT_NODE_COUNT));
const adjacencyMatrixInput = ref(createZeroMatrix(DEFAULT_NODE_COUNT));
const startNodeIndex = ref(0);

const highlightTags = computed(() => props.algorithm?.highlight ?? []);
const requiresStartNode = computed(() => !!props.algorithm?.requiresStartNode);
const enforceUndirected = computed(() => props.algorithm?.forceUndirected ?? false);

const {
  loading,
  steps,
  hasData,
  currentStepIndex,
  isPlaying,
  currentNodes,
  currentEdges,
  currentVisitedNodes,
  currentPointers,
  currentMatrix,
  currentAction,
  executeAlgorithm,
  resetVisualization,
  togglePlay,
  nextStep,
  previousStep,
  resetStep,
  handleStepChange
} = useGraphVisualization();

const totalSteps = computed(() => steps.value.length);

const displayLabel = (label, index) => (label && label.trim() ? label.trim() : `节点${index + 1}`);

const clampNodeCount = (value) => Math.max(MIN_NODES, Math.min(MAX_NODES, value));

const synchronizeMatrix = (count) => {
  const prev = adjacencyMatrixInput.value;
  const next = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => prev[row]?.[col] ?? 0)
  );
  adjacencyMatrixInput.value = next;
};

const synchronizeLabels = (count) => {
  const labels = [...nodeLabels.value];
  if (labels.length < count) {
    for (let i = labels.length; i < count; i += 1) {
      labels.push(LETTERS[i] || `节点${i + 1}`);
    }
  } else if (labels.length > count) {
    labels.splice(count);
  }
  nodeLabels.value = labels;
};

watch(nodeCount, (newValue) => {
  const clamped = clampNodeCount(newValue);
  if (clamped !== newValue) {
    nodeCount.value = clamped;
    return;
  }
  synchronizeLabels(clamped);
  synchronizeMatrix(clamped);
  if (startNodeIndex.value >= clamped) {
    startNodeIndex.value = 0;
  }
});

watch(enforceUndirected, (needUndirected) => {
  if (!needUndirected) return;
  const matrix = adjacencyMatrixInput.value.map((row) => [...row]);
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const value = matrix[i][j];
      matrix[j][i] = value;
    }
    matrix[i][i] = 0;
  }
  adjacencyMatrixInput.value = matrix;
});

const updateMatrixValue = (row, col, value) => {
  const sanitized = Number.isFinite(Number(value)) ? Number(value) : 0;
  const matrix = adjacencyMatrixInput.value.map((line) => [...line]);
  matrix[row][col] = row === col ? 0 : sanitized;
  if (enforceUndirected.value && row !== col) {
    matrix[col][row] = sanitized;
  }
  adjacencyMatrixInput.value = matrix;
};

const buildPayload = () => {
  if (!props.algorithm) {
    ElMessage.warning('请先选择算法');
    return null;
  }

  const nodes = nodeLabels.value.map((label, index) => displayLabel(label, index));
  const adjacencyMatrix = adjacencyMatrixInput.value.map((row, rowIndex) =>
    row.map((value, colIndex) => (rowIndex === colIndex ? 0 : Number(value) || 0))
  );

  const hasEdge = adjacencyMatrix.some((row, rowIndex) =>
    row.some((value, colIndex) => rowIndex !== colIndex && value > 0)
  );

  if (!hasEdge) {
    ElMessage.warning('请至少为一个节点对设置正权重的边');
    return null;
  }

  const payload = {
    adjacencyMatrix,
    nodes
  };

  if (requiresStartNode.value) {
    payload.startNode = startNodeIndex.value;
  }

  return payload;
};

const handleExecute = async () => {
  const payload = buildPayload();
  if (!payload) return;
  await executeAlgorithm(props.algorithm.id, payload);
};

const handleResetGraph = () => {
  nodeCount.value = DEFAULT_NODE_COUNT;
  nodeLabels.value = createDefaultLabels(DEFAULT_NODE_COUNT);
  adjacencyMatrixInput.value = createZeroMatrix(DEFAULT_NODE_COUNT);
  startNodeIndex.value = 0;
  resetVisualization();
};

const handleClose = () => {
  emit('close');
  resetVisualization();
};

watch(visible, (newVal) => {
  if (newVal) {
    handleResetGraph();
  } else {
    resetVisualization();
  }
});

watch(
  () => props.algorithm,
  () => {
    startNodeIndex.value = 0;
    if (visible.value) {
      handleResetGraph();
    }
  }
);
</script>

<style scoped>
.graph-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-header h2 {
  margin: 0 0 6px 0;
  font-size: 22px;
  color: #111827;
}

.panel-header p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.tag-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dialog-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #111827;
}

.node-count-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-hint {
  font-size: 13px;
  color: #6b7280;
}

.label-editor {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.label-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
}

.matrix-wrapper {
  overflow-x: auto;
}

.matrix-wrapper table {
  border-collapse: collapse;
  width: 100%;
  min-width: 320px;
  font-size: 13px;
}

.matrix-wrapper th,
.matrix-wrapper td {
  border: 1px solid #e5e7eb;
  padding: 4px;
  text-align: center;
  min-width: 52px;
}

.matrix-wrapper thead th {
  background: #f9fafb;
  font-weight: 600;
}

.matrix-input {
  width: 100%;
}

.cell-diagonal {
  background: #f3f4f6;
  color: #9ca3af;
}

.diag-value {
  display: inline-block;
  font-weight: 600;
}

.matrix-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.visualization-card {
  min-height: 520px;
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
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 1024px) {
  .dialog-body {
    grid-template-columns: 1fr;
  }
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

