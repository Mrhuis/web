<template>
  <div class="array-visualization">
    <h2>数组算法可视化</h2>
    <p>学习数组相关的排序、搜索和操作算法</p>
    
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
      <div class="array-display">
        <div
          v-for="(value, index) in array"
          :key="index"
          class="array-element"
        >
          {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'bubble-sort', name: '冒泡排序', description: '通过重复遍历数组，比较相邻元素并交换' },
  { id: 'quick-sort', name: '快速排序', description: '使用分治策略的高效排序算法' },
  { id: 'merge-sort', name: '归并排序', description: '稳定的分治排序算法' },
  { id: 'insertion-sort', name: '插入排序', description: '构建有序序列的简单排序算法' },
  { id: 'linear-search', name: '线性搜索', description: '逐个检查数组元素的搜索算法' },
  { id: 'binary-search', name: '二分搜索', description: '在有序数组中高效查找元素' },
  { id: 'array-reverse', name: '数组反转', description: '将数组元素顺序颠倒' },
  { id: 'array-rotation', name: '数组旋转', description: '将数组元素按指定步长旋转' }
])

const selectedAlgorithm = ref(null)
const array = ref([64, 34, 25, 12, 22, 11, 90])

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.array-visualization {
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

.array-display {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 15px;
}

.array-element {
  background: white;
  border: 2px solid #3498db;
  border-radius: 6px;
  padding: 10px 15px;
  font-weight: bold;
  color: #2c3e50;
  min-width: 40px;
  text-align: center;
}
</style> 