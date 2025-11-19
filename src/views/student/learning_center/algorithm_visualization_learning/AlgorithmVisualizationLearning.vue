<template>
  <div class="algorithm-visualization">
    <div class="header">
      <h1>算法可视化学习</h1>
      <p>通过交互式动画学习各种数据结构和算法</p>
    </div>

    <!-- 数据结构导航 -->
    <div class="data-structure-nav">
      <h2>选择数据结构</h2>
      <div class="nav-grid">
        <div
          v-for="structure in dataStructures"
          :key="structure.id"
          class="nav-card"
          :class="{ active: currentStructure === structure.id }"
          @click="selectStructure(structure.id)"
        >
          <div class="nav-icon">
            <i :class="structure.icon"></i>
          </div>
          <div class="nav-info">
            <h3>{{ structure.name }}</h3>
            <p>{{ structure.description }}</p>
            <div class="nav-meta">
              <span class="algorithms-count">{{ structure.algorithmsCount }} 个算法</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子页面容器 -->
    <div class="sub-page-container">
      <component
        :is="currentComponent"
        v-if="currentComponent"
        @algorithm-selected="handleAlgorithmSelected"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ArrayVisualization from '../../algorithm/ArrayVisualization.vue';
import LinkedListVisualization from '../../algorithm/LinkedListVisualization.vue';
import StackVisualization from '../../algorithm/StackVisualization.vue';
import QueueVisualization from '../../algorithm/QueueVisualization.vue';
import HashTableVisualization from '../../algorithm/HashTableVisualization.vue';
import TreeVisualization from '../../algorithm/TreeVisualization.vue';
import GraphVisualization from '../../algorithm/GraphVisualization.vue';

// 数据结构定义
const dataStructures = ref([
  {
    id: 'array',
    name: '数组',
    description: '线性数据结构，支持随机访问',
    icon: 'fas fa-list',
    algorithmsCount: 8,
    component: 'ArrayVisualization'
  },
  {
    id: 'linked-list',
    name: '链表',
    description: '线性数据结构，支持动态插入删除',
    icon: 'fas fa-link',
    algorithmsCount: 6,
    component: 'LinkedListVisualization'
  },
  {
    id: 'stack',
    name: '栈',
    description: '后进先出(LIFO)的数据结构',
    icon: 'fas fa-layer-group',
    algorithmsCount: 4,
    component: 'StackVisualization'
  },
  {
    id: 'queue',
    name: '队列',
    description: '先进先出(FIFO)的数据结构',
    icon: 'fas fa-stream',
    algorithmsCount: 4,
    component: 'QueueVisualization'
  },
  {
    id: 'hash-table',
    name: '哈希表',
    description: '基于键值对的高效查找结构',
    icon: 'fas fa-hashtag',
    algorithmsCount: 3,
    component: 'HashTableVisualization'
  },
  {
    id: 'tree',
    name: '树',
    description: '层次化的非线性数据结构',
    icon: 'fas fa-tree',
    algorithmsCount: 7,
    component: 'TreeVisualization'
  },
  {
    id: 'graph',
    name: '图',
    description: '表示对象间关系的网络结构',
    icon: 'fas fa-project-diagram',
    algorithmsCount: 5,
    component: 'GraphVisualization'
  }
]);

const currentStructure = ref('array');

// 计算当前应该显示的组件
const currentComponent = computed(() => {
  const structure = dataStructures.value.find((s) => s.id === currentStructure.value);
  if (!structure) return null;

  const componentMap = {
    ArrayVisualization,
    LinkedListVisualization,
    StackVisualization,
    QueueVisualization,
    HashTableVisualization,
    TreeVisualization,
    GraphVisualization
  };

  return componentMap[structure.component];
});

// 选择数据结构
const selectStructure = (structureId) => {
  currentStructure.value = structureId;
};

// 处理算法选择事件
const handleAlgorithmSelected = (algorithm) => {
  console.log('选择的算法:', algorithm);
  // 这里可以添加全局的算法选择处理逻辑
};
</script>

<style scoped>
.algorithm-visualization {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.data-structure-nav {
  margin-bottom: 40px;
}

.data-structure-nav h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.nav-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.15);
}

.nav-card.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.nav-card.active .nav-info h3,
.nav-card.active .nav-info p {
  color: white;
}

.nav-icon {
  font-size: 2rem;
  color: #3498db;
  min-width: 50px;
  text-align: center;
}

.nav-card.active .nav-icon {
  color: white;
}

.nav-info {
  flex: 1;
}

.nav-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.nav-info p {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.nav-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.algorithms-count {
  background: #ecf0f1;
  color: #34495e;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.nav-card.active .algorithms-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.sub-page-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 600px;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-grid {
    grid-template-columns: 1fr;
  }

  .nav-card {
    flex-direction: column;
    text-align: center;
  }

  .nav-icon {
    margin-bottom: 10px;
  }
}
</style>
