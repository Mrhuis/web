<template>
  <div class="linkedlist-visualization">
    <h2>链表算法可视化</h2>
    <p>学习链表相关的操作和算法</p>
    
    <div class="algorithm-list">
      <div
        v-for="algorithm in algorithms"
        :key="algorithm.id"
        class="algorithm-item"
        @click="selectAlgorithm(algorithm)"
      >
        <h3>{{ algorithm.name }}</h3>
        <p>{{ algorithm.description }}</p>
      </div>
    </div>
    
    <div v-if="selectedAlgorithm" class="visualization-area">
      <h3>{{ selectedAlgorithm.name }}</h3>
      <div class="linkedlist-display">
        <div
          v-for="(node, index) in linkedList"
          :key="index"
          class="linkedlist-node"
        >
          <div class="node-value">{{ node.value }}</div>
          <div v-if="index < linkedList.length - 1" class="node-pointer">→</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'insert-at-beginning', name: '在开头插入', description: '在链表头部插入新节点' },
  { id: 'insert-at-end', name: '在末尾插入', description: '在链表尾部插入新节点' },
  { id: 'delete-node', name: '删除节点', description: '删除指定值的节点' },
  { id: 'reverse-list', name: '反转链表', description: '将链表节点顺序颠倒' },
  { id: 'find-middle', name: '查找中间节点', description: '使用快慢指针找到中间节点' },
  { id: 'detect-cycle', name: '检测环', description: '检测链表中是否存在环' }
])

const selectedAlgorithm = ref(null)
const linkedList = ref([
  { value: 1, next: 1 },
  { value: 2, next: 2 },
  { value: 3, next: 3 },
  { value: 4, next: 4 },
  { value: 5, next: null }
])

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.linkedlist-visualization {
  padding: 20px;
}

.algorithm-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.algorithm-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.algorithm-item:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.algorithm-item h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.algorithm-item p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.visualization-area {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.linkedlist-display {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.linkedlist-node {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-value {
  background: white;
  border: 2px solid #3498db;
  border-radius: 6px;
  padding: 10px 15px;
  font-weight: bold;
  color: #2c3e50;
  min-width: 40px;
  text-align: center;
}

.node-pointer {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: bold;
}
</style> 