import { nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useArrayVisualization } from './useArrayVisualization';
import { parseArray } from '../utils/arrayUtils';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';

/**
 * 哈希表算法可视化组合式函数
 * 复用数组可视化的状态管理，仅替换算法执行逻辑
 */
export function useHashTableVisualization() {
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

  const parseHashTableInputs = (keysInput, valuesInput) => {
    if (keysInput === undefined || keysInput === null || keysInput === '') {
      throw new Error('请输入键数组');
    }
    if (valuesInput === undefined || valuesInput === null || valuesInput === '') {
      throw new Error('请输入值数组');
    }
    const keys = parseArray(keysInput);
    const values = parseArray(valuesInput);

    if (keys.length !== values.length) {
      throw new Error('键数组和值数组的长度必须一致');
    }

    return { keys, values };
  };

  const executeAlgorithm = async (algorithmId, { keysInput, valuesInput, hashKey, hashValue }) => {
    try {
      const { keys, values } = parseHashTableInputs(keysInput, valuesInput);

      if (hashKey === null || hashKey === undefined) {
        throw new Error('请输入要操作的键');
      }

      if (algorithmId === 'hash-insert' && (hashValue === null || hashValue === undefined)) {
        throw new Error('请输入要插入的值');
      }

      loading.value = true;
      resetVisualization();

      let response;

      switch (algorithmId) {
        case 'hash-insert':
          response = await algorithmVisualizationApi.hashInsertVisualization({
            keys,
            values,
            key: hashKey,
            value: hashValue
          });
          break;
        case 'hash-search':
          response = await algorithmVisualizationApi.hashSearchVisualization({
            keys,
            values,
            key: hashKey
          });
          break;
        case 'hash-delete':
          response = await algorithmVisualizationApi.hashDeleteVisualization({
            keys,
            values,
            key: hashKey
          });
          break;
        default:
          throw new Error('未知的哈希表算法类型');
      }

      if (response.success && response.data) {
        steps.value = response.data;
        searchIndices.value = [];
        currentStepIndex.value = 0;
        currentSearchStep.value = -1;
        await nextTick();
        ElMessage.success('算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '算法执行失败');
      }
    } catch (error) {
      console.error('执行哈希表算法失败:', error);
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


