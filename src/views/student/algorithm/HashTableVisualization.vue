<template>
  <div class="hashtable-visualization">
    <h2>哈希表算法可视化</h2>
    <p>学习哈希表的操作和冲突解决方法</p>
    
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
      <div class="hashtable-display">
        <div class="hashtable-container">
          <div
            v-for="(bucket, index) in hashTable"
            :key="index"
            class="hash-bucket"
          >
            <div class="bucket-index">{{ index }}</div>
            <div class="bucket-items">
              <div
                v-for="(item, itemIndex) in bucket"
                :key="itemIndex"
                class="bucket-item"
              >
                {{ item.key }}: {{ item.value }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'insert', name: '插入操作', description: '向哈希表中插入键值对' },
  { id: 'search', name: '查找操作', description: '根据键查找对应的值' },
  { id: 'delete', name: '删除操作', description: '删除指定的键值对' }
])

const selectedAlgorithm = ref(null)
const hashTable = ref([
  [{ key: 'apple', value: 1 }],
  [{ key: 'banana', value: 2 }],
  [],
  [{ key: 'orange', value: 3 }, { key: 'grape', value: 4 }],
  [],
  [{ key: 'mango', value: 5 }],
  [],
  []
])

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.hashtable-visualization {
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

.hashtable-display {
  margin-top: 15px;
}

.hashtable-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  max-width: 800px;
  margin: 0 auto;
}

.hash-bucket {
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 10px;
  min-height: 80px;
}

.bucket-index {
  font-weight: bold;
  color: #3498db;
  text-align: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.bucket-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bucket-item {
  background: #ecf0f1;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #2c3e50;
  text-align: center;
}
</style> 