import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';

export function useGraphVisualization() {
  const loading = ref(false);
  const steps = ref([]);
  const currentStepIndex = ref(0);
  const isPlaying = ref(false);
  const playTimer = ref(null);

  const hasData = computed(() => steps.value.length > 0);
  const currentStep = computed(() => (hasData.value ? steps.value[currentStepIndex.value] : null));

  const currentNodes = computed(() => currentStep.value?.nodes ?? []);
  const currentEdges = computed(() => currentStep.value?.edges ?? []);
  const currentVisitedNodes = computed(() => currentStep.value?.visitedNodes ?? []);
  const currentPointers = computed(() => currentStep.value?.pointers ?? []);
  const currentMatrix = computed(() => currentStep.value?.adjacencyMatrix ?? []);
  const currentAction = computed(() => currentStep.value?.action ?? '');

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

  const executeAlgorithm = async (algorithmId, payload) => {
    try {
      loading.value = true;
      resetVisualization();

      let response;
      switch (algorithmId) {
        case 'graph-dfs':
          response = await algorithmVisualizationApi.graphDfsVisualization(payload);
          break;
        case 'graph-bfs':
          response = await algorithmVisualizationApi.graphBfsVisualization(payload);
          break;
        case 'graph-dijkstra':
          response = await algorithmVisualizationApi.graphDijkstraVisualization(payload);
          break;
        case 'graph-prim':
          response = await algorithmVisualizationApi.graphPrimVisualization(payload);
          break;
        case 'graph-kruskal':
          response = await algorithmVisualizationApi.graphKruskalVisualization(payload);
          break;
        default:
          throw new Error('未知的图算法类型');
      }

      const resultSteps = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : null;

      if (resultSteps) {
        steps.value = resultSteps;
        currentStepIndex.value = 0;
        ElMessage.success('算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '执行算法失败');
      }
    } catch (error) {
      console.error('执行图算法失败:', error);
      ElMessage.error(error.message || '执行图算法失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };

  const togglePlay = () => {
    if (!hasData.value) {
      ElMessage.warning('没有可播放的步骤');
      return;
    }

    if (isPlaying.value) {
      clearPlayTimer();
      isPlaying.value = false;
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
    }, 900);
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
    clearPlayTimer();
    isPlaying.value = false;
    currentStepIndex.value = 0;
  };

  const handleStepChange = (value) => {
    currentStepIndex.value = value;
  };

  return {
    loading,
    steps,
    hasData,
    currentStepIndex,
    isPlaying,
    currentNodes,
    currentEdges,
    currentVisitedNodes,
    currentPointers,
    currentMatrix,
    currentAction,
    executeAlgorithm,
    resetVisualization,
    togglePlay,
    nextStep,
    previousStep,
    resetStep,
    handleStepChange
  };
}

export default useGraphVisualization;

