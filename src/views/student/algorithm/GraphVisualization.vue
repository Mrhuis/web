<template>
  <div class="graph-visualization">
    <h2>图算法可视化</h2>
    <p>学习图的遍历和路径查找算法</p>
    
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
      <div class="graph-display">
        <div class="graph-container">
          <div class="graph-node" style="top: 50px; left: 100px;">A</div>
          <div class="graph-node" style="top: 50px; right: 100px;">B</div>
          <div class="graph-node" style="top: 150px; left: 50px;">C</div>
          <div class="graph-node" style="top: 150px; right: 50px;">D</div>
          <div class="graph-node" style="bottom: 50px; left: 50%; transform: translateX(-50%);">E</div>
          
          <!-- 边 -->
          <svg class="graph-edges" width="400" height="200">
            <line x1="120" y1="70" x2="280" y2="70" stroke="#3498db" stroke-width="2"/>
            <line x1="120" y1="70" x2="70" y2="170" stroke="#3498db" stroke-width="2"/>
            <line x1="280" y1="70" x2="330" y2="170" stroke="#3498db" stroke-width="2"/>
            <line x1="70" y1="170" x2="330" y2="170" stroke="#3498db" stroke-width="2"/>
            <line x1="70" y1="170" x2="200" y2="150" stroke="#3498db" stroke-width="2"/>
            <line x1="330" y1="170" x2="200" y2="150" stroke="#3498db" stroke-width="2"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const algorithms = ref([
  { id: 'dfs', name: '深度优先搜索', description: '深度优先遍历图的所有节点' },
  { id: 'bfs', name: '广度优先搜索', description: '广度优先遍历图的所有节点' },
  { id: 'dijkstra', name: 'Dijkstra算法', description: '寻找最短路径的经典算法' },
  { id: 'prim', name: 'Prim算法', description: '寻找最小生成树的算法' },
  { id: 'kruskal', name: 'Kruskal算法', description: '另一种最小生成树算法' }
])

const selectedAlgorithm = ref(null)

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.graph-visualization {
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

.graph-display {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.graph-container {
  position: relative;
  width: 400px;
  height: 200px;
  background: white;
  border-radius: 8px;
  border: 2px solid #3498db;
}

.graph-node {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 10;
}

.graph-edges {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
}
</style> 