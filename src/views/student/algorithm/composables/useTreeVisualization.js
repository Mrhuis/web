/**
 * 树算法可视化组合式函数
 * 负责树步骤播放、状态管理与后端交互
 */
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';
import { parseArray } from '../utils/arrayUtils';

export function useTreeVisualization() {
  const loading = ref(false);
  const steps = ref([]);
  const currentStepIndex = ref(0);
  const isPlaying = ref(false);
  const playTimer = ref(null);

  const hasData = computed(() => steps.value.length > 0);

  const currentTreeState = computed(() => {
    if (!hasData.value) return [];
    const step = steps.value[currentStepIndex.value];
    return Array.isArray(step?.treeState) ? step.treeState : [];
  });

  const currentAction = computed(() => {
    if (!hasData.value) return '';
    return steps.value[currentStepIndex.value]?.action ?? '';
  });

  const currentPointers = computed(() => {
    if (!hasData.value) return [];
    const pointers = steps.value[currentStepIndex.value]?.pointers;
    return Array.isArray(pointers) ? pointers : [];
  });

  const changedElements = computed(() => new Set());

  const clearPlayTimer = () => {
    if (playTimer.value) {
      clearInterval(playTimer.value);
      playTimer.value = null;
    }
  };

  const resetVisualization = () => {
    clearPlayTimer();
    steps.value = [];
    currentStepIndex.value = 0;
    isPlaying.value = false;
  };

  const executeAlgorithm = async (algorithmId, { arrayInput, target }) => {
    try {
      const values = parseArray(arrayInput);

      loading.value = true;
      resetVisualization();

      let response;
      switch (algorithmId) {
        case 'tree-preorder-traversal':
          response = await algorithmVisualizationApi.treePreorderTraversalVisualization({ values });
          break;
        case 'tree-inorder-traversal':
          response = await algorithmVisualizationApi.treeInorderTraversalVisualization({ values });
          break;
        case 'tree-postorder-traversal':
          response = await algorithmVisualizationApi.treePostorderTraversalVisualization({ values });
          break;
        case 'tree-level-order-traversal':
          response = await algorithmVisualizationApi.treeLevelOrderTraversalVisualization({ values });
          break;
        case 'tree-insert-node':
          response = await algorithmVisualizationApi.treeInsertNodeVisualization({ values, value: target });
          break;
        case 'tree-delete-node':
          response = await algorithmVisualizationApi.treeDeleteNodeVisualization({ values, value: target });
          break;
        case 'tree-search-node':
          response = await algorithmVisualizationApi.treeSearchNodeVisualization({ values, value: target });
          break;
        default:
          throw new Error('未知的树算法类型');
      }

      if (response.success && response.data) {
        steps.value = response.data;
        currentStepIndex.value = 0;
        ElMessage.success('树算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '树算法执行失败');
      }
    } catch (error) {
      console.error('执行树算法失败:', error);
      ElMessage.error(error.message || '执行树算法失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };

  const togglePlay = () => {
    if (isPlaying.value) {
      clearPlayTimer();
      isPlaying.value = false;
      return;
    }

    if (!hasData.value) {
      ElMessage.warning('没有可播放的步骤');
      return;
    }

    if (currentStepIndex.value >= steps.value.length - 1) {
      currentStepIndex.value = 0;
    }

    isPlaying.value = true;
    playTimer.value = setInterval(() => {
      if (currentStepIndex.value < steps.value.length - 1) {
        currentStepIndex.value += 1;
      } else {
        clearPlayTimer();
        isPlaying.value = false;
        ElMessage.success('动画播放完成');
      }
    }, 800);
  };

  const nextStep = () => {
    if (currentStepIndex.value < steps.value.length - 1) {
      currentStepIndex.value += 1;
    }
  };

  const previousStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value -= 1;
    }
  };

  const resetStep = () => {
    if (isPlaying.value) {
      clearPlayTimer();
      isPlaying.value = false;
    }
    currentStepIndex.value = 0;
  };

  const handleStepChange = (value) => {
    currentStepIndex.value = value;
  };

  return {
    loading,
    steps,
    currentStepIndex,
    isPlaying,
    hasData,
    currentArray: currentTreeState,
    currentAction,
    currentPointers,
    changedElements,
    resetVisualization,
    executeAlgorithm,
    togglePlay,
    nextStep,
    previousStep,
    resetStep,
    handleStepChange
  };
}


