<template>
  <div class="tree-visualization">
    <h2>树算法可视化</h2>
    <p>学习树结构的遍历和操作算法</p>
    
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
      <div class="tree-display">
        <div class="tree-container">
          <div class="tree-node root">
            <div class="node-value">1</div>
            <div class="children">
              <div class="tree-node">
                <div class="node-value">2</div>
                <div class="children">
                  <div class="tree-node">
                    <div class="node-value">4</div>
                  </div>
                  <div class="tree-node">
                    <div class="node-value">5</div>
                  </div>
                </div>
              </div>
              <div class="tree-node">
                <div class="node-value">3</div>
                <div class="children">
                  <div class="tree-node">
                    <div class="node-value">6</div>
                  </div>
                  <div class="tree-node">
                    <div class="node-value">7</div>
                  </div>
                </div>
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
  { id: 'preorder', name: '前序遍历', description: '根-左-右的遍历顺序' },
  { id: 'inorder', name: '中序遍历', description: '左-根-右的遍历顺序' },
  { id: 'postorder', name: '后序遍历', description: '左-右-根的遍历顺序' },
  { id: 'level-order', name: '层序遍历', description: '按层次遍历树节点' },
  { id: 'insert', name: '插入节点', description: '向树中插入新节点' },
  { id: 'delete', name: '删除节点', description: '从树中删除指定节点' },
  { id: 'search', name: '查找节点', description: '在树中查找指定值' }
])

const selectedAlgorithm = ref(null)

const selectAlgorithm = (algorithm) => {
  selectedAlgorithm.value = algorithm
}
</script>

<style scoped>
.tree-visualization {
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

.tree-display {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.tree-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tree-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
}

.node-value {
  background: white;
  border: 2px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
}

.children {
  display: flex;
  gap: 40px;
  margin-top: 20px;
  position: relative;
}

.children::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  width: 2px;
  height: 10px;
  background: #3498db;
  transform: translateX(-50%);
}

.tree-node .children .tree-node {
  position: relative;
}

.tree-node .children .tree-node::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 50%;
  width: 2px;
  height: 15px;
  background: #3498db;
  transform: translateX(-50%);
}

.root .node-value {
  background: #3498db;
  color: white;
}
</style> 