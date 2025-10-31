<template>
  <div class="stack-visualization">
    <h2>栈算法可视化</h2>
    <p>学习栈(LIFO)数据结构的操作和算法</p>
    
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
      <div class="stack-display">
        <div class="stack-container">
          <div
            v-for="(item, index) in stack"
            :key="index"
            class="stack-item"
          >
            {{ item }}
          </div>
        </div>
        <div class="stack-top-indicator">栈顶</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'push', name: '入栈操作', description: '将元素压入栈顶' },
  { id: 'pop', name: '出栈操作', description: '从栈顶弹出元素' },
  { id: 'peek', name: '查看栈顶', description: '查看栈顶元素但不移除' },
  { id: 'stack-reverse', name: '栈反转', description: '使用栈反转字符串或数组' }
])

const selectedAlgorithm = ref(null)
const stack = ref([5, 4, 3, 2, 1])

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.stack-visualization {
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

.stack-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
}

.stack-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 200px;
  justify-content: flex-end;
}

.stack-item {
  background: white;
  border: 2px solid #3498db;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: bold;
  color: #2c3e50;
  min-width: 60px;
  text-align: center;
  transition: all 0.3s ease;
}

.stack-top-indicator {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #3498db;
  font-weight: bold;
}
</style> 