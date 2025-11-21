<template>
  <div class="graph-display">
    <div v-if="currentAction" class="graph-action">
      <el-alert :title="currentAction" type="info" :closable="false" />
    </div>

    <div v-if="hasNodes" class="graph-canvas-wrapper">
      <svg
        :viewBox="`0 0 ${canvasSize} ${canvasSize}`"
        class="graph-canvas"
        preserveAspectRatio="xMidYMid meet"
      >
        <g v-for="edge in renderedEdges" :key="edge.id">
          <line
            class="graph-edge"
            :class="{ 'graph-edge-active': edge.isActive }"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
          />
          <text
            v-if="edge.weightLabel"
            class="edge-weight"
            :x="edge.labelX"
            :y="edge.labelY"
          >
            {{ edge.weightLabel }}
          </text>
        </g>

        <g v-for="node in nodeRenderData" :key="node.id" class="graph-node-group">
          <circle
            class="graph-node-circle"
            :class="{
              'graph-node-visited': node.isVisited,
              'graph-node-pointer': node.isPointer
            }"
            :cx="node.x"
            :cy="node.y"
            :r="nodeRadius"
          />
          <text
            class="graph-node-text"
            :x="node.x"
            :y="node.y + 4"
          >
            {{ node.label }}
          </text>
        </g>
      </svg>
    </div>
    <el-empty v-else description="暂无图数据，请先执行算法" />

    <div v-if="hasNodes" class="graph-meta">
      <div class="meta-block">
        <h4>访问顺序</h4>
        <div class="tag-list">
          <el-tag
            v-for="(nodeIndex, idx) in visitedNodes"
            :key="`visited-node-${nodeIndex}-${idx}`"
            :type="pointerSet.has(nodeIndex) ? 'warning' : 'success'"
            effect="dark"
          >
            {{ nodes[nodeIndex] ?? `#${nodeIndex}` }}
          </el-tag>
        </div>
      </div>
      <div class="meta-block">
        <h4>当前指针</h4>
        <div class="tag-list">
          <el-tag
            v-for="nodeIndex in pointers"
            :key="`pointer-node-${nodeIndex}`"
            type="warning"
            effect="plain"
          >
            {{ nodes[nodeIndex] ?? `#${nodeIndex}` }}
          </el-tag>
          <span v-if="!pointers.length" class="tag-placeholder">暂无指针</span>
        </div>
      </div>
      <div class="meta-block">
        <h4>邻接矩阵</h4>
        <div class="matrix-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th v-for="(node, index) in nodes" :key="`matrix-header-${node}-${index}`">
                  {{ node }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in adjacencyMatrix" :key="`matrix-row-${rowIndex}`">
                <th>{{ nodes[rowIndex] }}</th>
                <td
                  v-for="(value, colIndex) in row"
                  :key="`matrix-cell-${rowIndex}-${colIndex}`"
                  :class="{
                    'matrix-cell-visited': visitedSet.has(rowIndex) || visitedSet.has(colIndex),
                    'matrix-cell-pointer': pointerSet.has(rowIndex) || pointerSet.has(colIndex)
                  }"
                >
                  {{ value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  },
  visitedNodes: {
    type: Array,
    default: () => []
  },
  pointers: {
    type: Array,
    default: () => []
  },
  adjacencyMatrix: {
    type: Array,
    default: () => []
  },
  currentAction: {
    type: String,
    default: ''
  }
});

const canvasSize = 420;
const nodeRadius = 23;

const hasNodes = computed(() => props.nodes.length > 0);
const visitedSet = computed(() => new Set(props.visitedNodes || []));
const pointerSet = computed(() => new Set(props.pointers || []));

const nodePositions = computed(() => {
  const count = props.nodes.length;
  if (!count) return [];

  const radius = canvasSize / 2 - 40;
  const center = canvasSize / 2;

  return props.nodes.map((_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  });
});

const rawEdges = computed(() => {
  const matrix = props.adjacencyMatrix || [];
  const edges = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value && rowIndex !== colIndex) {
        const key = `${rowIndex}-${colIndex}`;
        edges.push({
          id: key,
          from: rowIndex,
          to: colIndex,
          weight: value
        });
      }
    });
  });

  return edges;
});

const highlightedEdges = computed(() => {
  const set = new Set();
  (props.edges || []).forEach((edge) => {
    set.add(`${edge.from}-${edge.to}`);
    set.add(`${edge.to}-${edge.from}`);
  });
  return set;
});

const renderedEdges = computed(() => {
  const positions = nodePositions.value;
  return rawEdges.value.map((edge) => {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) return null;

    const labelX = (from.x + to.x) / 2;
    const labelY = (from.y + to.y) / 2;

    return {
      ...edge,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      labelX,
      labelY,
      weightLabel: edge.weight,
      isActive: highlightedEdges.value.has(edge.id)
    };
  }).filter(Boolean);
});

const nodeRenderData = computed(() =>
  props.nodes.map((label, index) => {
    const position = nodePositions.value[index] || { x: 0, y: 0 };
    return {
      id: `graph-node-${label}-${index}`,
      label,
      x: position.x,
      y: position.y,
      isVisited: visitedSet.value.has(index),
      isPointer: pointerSet.value.has(index)
    };
  })
);
</script>

<style scoped>
.graph-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.graph-action {
  margin-bottom: 4px;
}

.graph-canvas-wrapper {
  width: 100%;
  max-width: 520px;
  min-height: 420px;
  margin: 0 auto;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.graph-node-group {
  cursor: default;
}

.graph-edge {
  stroke: #cbd5f5;
  stroke-width: 2;
  transition: stroke 0.3s ease;
}

.graph-edge-active {
  stroke: #f59e0b;
  stroke-width: 3;
}

.edge-weight {
  fill: #374151;
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}

.graph-node-circle {
  fill: #e0f2fe;
  stroke: #93c5fd;
  stroke-width: 3;
  transition: all 0.3s ease;
}

.graph-node-text {
  fill: #1f2937;
  font-size: 14px;
  font-weight: 600;
  text-anchor: middle;
  user-select: none;
}

.graph-node-visited {
  fill: #d1fae5;
  stroke: #34d399;
  filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.4));
}

.graph-node-pointer {
  fill: #fef3c7;
  stroke: #f59e0b;
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.45));
}

.graph-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.meta-block {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}

.meta-block h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}

.tag-placeholder {
  font-size: 13px;
  color: #9ca3af;
}

.matrix-table {
  overflow-x: auto;
}

.matrix-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
  text-align: center;
  min-width: 32px;
}

.matrix-table thead th {
  background: #f9fafb;
}

.matrix-cell-visited {
  background: rgba(52, 211, 153, 0.12);
}

.matrix-cell-pointer {
  background: rgba(245, 158, 11, 0.12);
}

@media (max-width: 768px) {
  .graph-canvas-wrapper {
    max-width: 100%;
    min-height: 360px;
  }
}
</style>


