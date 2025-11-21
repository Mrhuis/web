/**
 * 链表可视化组合式函数
 * 管理链表算法执行、步骤控制等核心逻辑
 */
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';
import { extractArrayFromStep } from '../utils/arrayStepParser';
import { parseArray } from '../utils/arrayUtils';

export function useLinkedListVisualization() {
  // 状态
  const loading = ref(false);
  const steps = ref([]);
  const currentStepIndex = ref(0);
  const isPlaying = ref(false);
  const playTimer = ref(null);

  // 计算属性
  const hasData = computed(() => steps.value.length > 0);

  const currentArray = computed(() => {
    if (steps.value.length === 0) {
      return [];
    }

    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.value.length) {
      return [];
    }

    const step = steps.value[currentStepIndex.value];
    if (!step) {
      console.warn('链表步骤数据为空，索引:', currentStepIndex.value);
      return [];
    }

    const array = extractArrayFromStep(step);

    if (step.pointers && Array.isArray(step.pointers)) {
      return array.map((item, index) => ({
        ...item,
        isPointer: step.pointers.includes(index)
      }));
    }

    return array;
  });

  const currentAction = computed(() => {
    if (steps.value.length === 0) return '';
    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.value.length) return '';

    const step = steps.value[currentStepIndex.value];
    if (step && step.action) {
      return step.action;
    }
    return '';
  });

  const currentPointers = computed(() => {
    if (steps.value.length === 0) return [];
    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.value.length) return [];

    const step = steps.value[currentStepIndex.value];
    if (step && step.pointers && Array.isArray(step.pointers)) {
      return step.pointers;
    }
    return [];
  });

  const nextArray = computed(() => {
    if (currentStepIndex.value >= steps.value.length - 1) {
      return [];
    }

    const nextStep = steps.value[currentStepIndex.value + 1];
    if (!nextStep) {
      return [];
    }

    return extractArrayFromStep(nextStep);
  });

  const changedElements = computed(() => {
    const changed = new Set();

    if (currentStepIndex.value >= steps.value.length - 1) {
      return changed;
    }

    const current = currentArray.value;
    const next = nextArray.value;

    if (current.length !== next.length) {
      return changed;
    }

    for (let i = 0; i < current.length; i++) {
      const currentItem = current[i];
      const nextItem = next[i];

      if (currentItem && nextItem && currentItem.value !== nextItem.value) {
        changed.add(i);
      }
    }

    return changed;
  });

  // 清理定时器
  const clearPlayTimer = () => {
    if (playTimer.value) {
      clearInterval(playTimer.value);
      playTimer.value = null;
    }
  };

  // 方法
  const resetVisualization = () => {
    clearPlayTimer();
    steps.value = [];
    currentStepIndex.value = 0;
    isPlaying.value = false;
  };

  const executeAlgorithm = async (algorithmId, arrayInput, valueParam) => {
    try {
      const array = parseArray(arrayInput);

      loading.value = true;
      resetVisualization();

      let response;

      switch (algorithmId) {
        case 'insert-at-head':
          response = await algorithmVisualizationApi.linkedListInsertAtHeadVisualization({
            array,
            value: valueParam
          });
          break;
        case 'insert-at-tail':
          response = await algorithmVisualizationApi.linkedListInsertAtTailVisualization({
            array,
            value: valueParam
          });
          break;
        case 'delete-node':
          response = await algorithmVisualizationApi.linkedListDeleteNodeVisualization({
            array,
            value: valueParam
          });
          break;
        case 'reverse-list':
          response = await algorithmVisualizationApi.linkedListReverseListVisualization(array);
          break;
        case 'find-middle-node':
          response = await algorithmVisualizationApi.linkedListFindMiddleNodeVisualization(array);
          break;
        case 'has-cycle':
          response = await algorithmVisualizationApi.linkedListHasCycleVisualization(array);
          break;
        default:
          throw new Error('未知的链表算法类型');
      }

      if (response.success && response.data) {
        steps.value = response.data;
        currentStepIndex.value = 0;
        ElMessage.success('链表算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '链表算法执行失败');
      }
    } catch (error) {
      console.error('执行链表算法失败:', error);
      ElMessage.error(error.message || '执行链表算法失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };

  const togglePlay = () => {
    if (isPlaying.value) {
      // 停止播放
      clearPlayTimer();
      isPlaying.value = false;
    } else {
      // 开始播放
      const maxSteps = steps.value.length;
      if (maxSteps === 0) {
        ElMessage.warning('没有可播放的步骤');
        return;
      }

      // 如果已经到达最后一步，重置到第一步
      if (currentStepIndex.value >= maxSteps - 1) {
        currentStepIndex.value = 0;
      }

      isPlaying.value = true;
      // 设置播放间隔（800ms，可根据需要调整）
      playTimer.value = setInterval(() => {
        if (currentStepIndex.value < steps.value.length - 1) {
          nextStep();
        } else {
          // 播放完成，自动停止
          clearPlayTimer();
          isPlaying.value = false;
          ElMessage.success('动画播放完成');
        }
      }, 800);
    }
  };

  const nextStep = () => {
    if (currentStepIndex.value < steps.value.length - 1) {
      currentStepIndex.value++;
    }
  };

  const previousStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--;
    }
  };

  const resetStep = () => {
    // 如果正在播放，先停止
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
    // 状态
    loading,
    steps,
    currentStepIndex,
    isPlaying,
    hasData,
    currentArray,
    currentAction,
    currentPointers,
    changedElements,
    // 方法
    resetVisualization,
    executeAlgorithm,
    togglePlay,
    nextStep,
    previousStep,
    resetStep,
    handleStepChange
  };
}


