<template>
  <div class="tree-visualization-area">
    <div v-if="currentAction" class="step-action-info">
      <el-alert :title="currentAction" type="info" :closable="false" />
    </div>

    <div v-if="treeLevels.length" class="tree-levels">
      <div
        v-for="(level, levelIndex) in treeLevels"
        :key="`tree-level-${levelIndex}`"
        class="tree-level"
        :style="levelStyle(levelIndex)"
      >
        <div
          v-for="(slot, slotIndex) in level"
          :key="`tree-node-${levelIndex}-${slotIndex}`"
          class="tree-node-wrapper"
          :class="wrapperClass(slot)"
        >
          <template v-if="slot.hasNode">
            <div class="tree-node" :class="nodeClass(slot.node)">
              <div class="node-value">
                {{ slot.node.label }}
              </div>
              <div class="node-meta">
                <el-tag v-if="slot.node.position" size="small" effect="plain">
                  {{ slot.node.position }}
                </el-tag>
              </div>
            </div>
          </template>
          <div v-else class="tree-node tree-node-empty"></div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无树形数据，请先执行算法" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  array: {
    type: Array,
    default: () => []
  },
  currentAction: {
    type: String,
    default: ''
  },
  pointers: {
    type: Array,
    default: () => []
  }
});

const normalizedNodes = computed(() => {
  if (!Array.isArray(props.array)) return [];
  return props.array.map((node, index) => ({
    id: node?.id ?? `${index}-${node?.val ?? 'null'}`,
    label: node?.val ?? '--',
    position: node?.position || '',
    raw: node
  }));
});

const treeLevels = computed(() => {
  const nodes = normalizedNodes.value;
  if (!nodes.length) return [];

  const baseLevels = [];
  let cursor = 0;
  let levelIndex = 0;

  while (cursor < nodes.length) {
    const levelSize = 2 ** levelIndex;
    const levelSlots = [];

    for (let i = 0; i < levelSize; i += 1) {
      let node = null;
      if (cursor < nodes.length) {
        node = nodes[cursor];
        cursor += 1;
      }
      levelSlots.push({
        node,
        slotIndex: i,
        levelIndex
      });
    }

    baseLevels.push(levelSlots);
    levelIndex += 1;
  }

  return baseLevels.map((level, idx) =>
    level.map((slot) => {
      const parentLevel = baseLevels[idx - 1];
      const parentSlot = idx > 0 ? parentLevel?.[Math.floor(slot.slotIndex / 2)] : null;
      return {
        ...slot,
        hasNode: !!slot.node,
        parentExists: !!(idx > 0 && parentSlot?.node),
        isLeftChild: idx > 0 && slot.slotIndex % 2 === 0,
        isRightChild: idx > 0 && slot.slotIndex % 2 === 1
      };
    })
  );
});

const levelStyle = (levelIndex) => ({
  '--level-size': 2 ** levelIndex
});

const pointerSet = computed(() => new Set((props.pointers || []).map((pointer) => String(pointer))));

const nodeClass = (node) => {
  const classes = [];
  if (pointerSet.value.has(String(node?.raw?.val ?? node.label))) {
    classes.push('tree-node-pointer');
  }
  return classes;
};

const wrapperClass = (slot) => {
  const classes = [];
  if (!slot.hasNode) {
    classes.push('tree-node-wrapper-empty');
  }
  if (slot.parentExists) {
    classes.push('tree-node-wrapper-connected');
  }
  if (slot.isLeftChild) {
    classes.push('tree-node-left');
  }
  if (slot.isRightChild) {
    classes.push('tree-node-right');
  }
  return classes;
};
</script>

<style scoped>
.tree-visualization-area {
  padding: 20px 0;
  min-height: 260px;
}

.tree-levels {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tree-level {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--level-size), minmax(80px, 1fr));
  justify-items: center;
  gap: 8px;
}

.tree-node-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.tree-node-wrapper-empty {
  pointer-events: none;
}

.tree-node {
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.tree-node-empty {
  opacity: 0;
}

.node-value {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #1f2937;
  background: #fff;
}

.tree-node-pointer .node-value {
  border-color: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  background: #fff7e6;
}

.node-meta {
  min-height: 22px;
}

.step-action-info {
  margin-bottom: 16px;
}
</style>


