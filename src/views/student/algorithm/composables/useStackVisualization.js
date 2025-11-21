import { nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useArrayVisualization } from './useArrayVisualization';
import { parseArray } from '../utils/arrayUtils';
import { createInitialStep, extractArrayFromStep } from '../utils/arrayStepParser';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';

/**
 * 栈算法可视化组合式函数
 * 复用数组可视化的状态管理，仅替换算法执行逻辑
 */
export function useStackVisualization() {
  const arrayVisualization = useArrayVisualization();
  const {
    loading,
    steps,
    currentStepIndex,
    isPlaying,
    hasData,
    currentArray,
    currentAction,
    currentPointers,
    changedElements,
    searchIndices,
    currentSearchStep,
    resetVisualization,
    togglePlay,
    nextStep,
    previousStep,
    resetStep,
    handleStepChange
  } = arrayVisualization;

  const ensureInitialStep = (inputArray) => {
    if (steps.value.length === 0) {
      return;
    }

    const firstStep = steps.value[0];
    const firstStepArray = extractArrayFromStep(firstStep);
    const firstStepValues = firstStepArray.map((item) => item.value);

    const isFirstStepMatchesInput =
      firstStepValues.length === inputArray.length &&
      firstStepValues.every((val, idx) => val === inputArray[idx]);

    const isInitialState =
      firstStep.action &&
      (firstStep.action.includes('初始') || firstStep.action.includes('初始化'));

    if (!isInitialState || !isFirstStepMatchesInput) {
      const initialStep = createInitialStep(inputArray);
      steps.value.unshift(initialStep);
    }
  };

  const executeAlgorithm = async (algorithmId, arrayInput, target) => {
    try {
      const array = parseArray(arrayInput);
      loading.value = true;
      resetVisualization();

      let response;

      switch (algorithmId) {
        case 'stack-push':
          response = await algorithmVisualizationApi.stackPushVisualization({
            array,
            value: target
          });
          break;
        case 'stack-pop':
          response = await algorithmVisualizationApi.stackPopVisualization({ array });
          break;
        case 'stack-peek':
          response = await algorithmVisualizationApi.stackPeekVisualization({ array });
          break;
        case 'stack-reverse':
          response = await algorithmVisualizationApi.stackReverseVisualization({ array });
          break;
        default:
          throw new Error('未知的栈算法类型');
      }

      if (response.success && response.data) {
        steps.value = response.data;
        ensureInitialStep(array);
        searchIndices.value = [];
        currentStepIndex.value = 0;
        currentSearchStep.value = -1;
        await nextTick();
        ElMessage.success('算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '算法执行失败');
      }
    } catch (error) {
      console.error('执行栈算法失败:', error);
      ElMessage.error(error.message || '执行算法失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    steps,
    currentStepIndex,
    isPlaying,
    hasData,
    currentArray,
    currentAction,
    currentPointers,
    changedElements,
    searchIndices,
    currentSearchStep,
    resetVisualization,
    executeAlgorithm,
    togglePlay,
    nextStep,
    previousStep,
    resetStep,
    handleStepChange
  };
}


