<template>
  <div class="queue-visualization">
    <h2>队列算法可视化</h2>
    <p>学习队列(FIFO)数据结构的操作和算法</p>
    
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
      <div class="queue-display">
        <div class="queue-front">队首</div>
        <div class="queue-container">
          <div
            v-for="(item, index) in queue"
            :key="index"
            class="queue-item"
          >
            {{ item }}
          </div>
        </div>
        <div class="queue-rear">队尾</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'enqueue', name: '入队操作', description: '将元素添加到队尾' },
  { id: 'dequeue', name: '出队操作', description: '从队首移除元素' },
  { id: 'peek-front', name: '查看队首', description: '查看队首元素但不移除' },
  { id: 'circular-queue', name: '循环队列', description: '实现循环队列避免空间浪费' }
])

const selectedAlgorithm = ref(null)
const queue = ref([1, 2, 3, 4, 5])

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.queue-visualization {
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

.queue-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  gap: 15px;
}

.queue-container {
  display: flex;
  align-items: center;
  gap: 5px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #3498db;
}

.queue-item {
  background: #3498db;
  color: white;
  border-radius: 6px;
  padding: 10px 15px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
  transition: all 0.3s ease;
}

.queue-front, .queue-rear {
  font-size: 0.9rem;
  color: #3498db;
  font-weight: bold;
  padding: 5px 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #3498db;
}
</style> 