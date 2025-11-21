/**
 * 数组可视化组合式函数
 * 管理算法执行、步骤控制等核心逻辑
 */
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { algorithmVisualizationApi } from '@/api/student/learning_center/algorithm_visualization_learning/algorithm_visualization_learning_api';
import { extractArrayFromStep, createInitialStep } from '../utils/arrayStepParser';
import { parseArray, isArraySorted, sortArray } from '../utils/arrayUtils';

export function useArrayVisualization() {
  // 状态
  const loading = ref(false);
  const steps = ref([]);
  const currentStepIndex = ref(0);
  const isPlaying = ref(false);
  const playTimer = ref(null);
  const searchIndices = ref([]);
  const currentSearchStep = ref(-1);
  const originalArray = ref([]);

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
      console.warn('步骤数据为空，索引:', currentStepIndex.value);
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

    // 方法1：比较相同位置的值是否改变
    for (let i = 0; i < current.length; i++) {
      const currentItem = current[i];
      const nextItem = next[i];
      
      if (currentItem && nextItem) {
        if (currentItem.value !== nextItem.value) {
          changed.add(i);
        }
      }
    }

    // 方法2：通过 originalIndex 追踪元素位置变化
    // 如果某个元素的 originalIndex 在当前位置，但在下一步骤中位置改变了，标记为变化
    for (let i = 0; i < current.length; i++) {
      const currentItem = current[i];
      if (currentItem && currentItem.originalIndex !== undefined) {
        // 在下一步骤中查找具有相同 originalIndex 的元素
        const nextItem = next.find(item => item && item.originalIndex === currentItem.originalIndex);
        if (nextItem) {
          // 如果位置改变了，标记当前位置和下一个位置都发生变化
          if (nextItem.index !== i) {
            changed.add(i);
            changed.add(nextItem.index);
          }
        }
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
    searchIndices.value = [];
    currentSearchStep.value = -1;
    originalArray.value = [];
  };

  const executeAlgorithm = async (algorithmId, arrayInput, target, stepsParam) => {
    try {
      const array = parseArray(arrayInput);
      
      // 对于二分搜索，检查数组是否有序
      if (algorithmId === 'binary-search') {
        if (!isArraySorted(array)) {
          ElMessage.warning('二分搜索要求数组必须是有序的，已自动排序');
          const sorted = sortArray(array);
          array.length = 0;
          array.push(...sorted);
        }
      }

      loading.value = true;
      resetVisualization();

      let response;
      
      switch (algorithmId) {
        case 'bubble-sort':
          response = await algorithmVisualizationApi.bubbleSortVisualization(array);
          break;
        case 'quick-sort':
          response = await algorithmVisualizationApi.quickSortVisualization(array);
          break;
        case 'merge-sort':
          response = await algorithmVisualizationApi.mergeSortVisualization(array);
          break;
        case 'insertion-sort':
          response = await algorithmVisualizationApi.insertionSortVisualization(array);
          break;
        case 'reverse-array':
          response = await algorithmVisualizationApi.reverseArrayVisualization(array);
          break;
        case 'rotate-array':
          response = await algorithmVisualizationApi.rotateArrayVisualization({
            array,
            steps: stepsParam
          });
          break;
        case 'linear-search':
          response = await algorithmVisualizationApi.linearSearchVisualization({
            array,
            target
          });
          break;
        case 'binary-search':
          response = await algorithmVisualizationApi.binarySearchVisualization({
            array,
            target
          });
          break;
        default:
          throw new Error('未知的算法类型');
      }

      if (response.success && response.data) {
        steps.value = response.data;
        
        // 处理搜索算法的返回数据
        const isSearchAlgo = algorithmId === 'linear-search' || algorithmId === 'binary-search';
        if (isSearchAlgo) {
          originalArray.value = [...array];
          // 从 AlgorithmStep 中提取搜索索引（用于兼容旧格式的显示）
          if (steps.value.length > 0 && steps.value[0].pointers) {
            searchIndices.value = steps.value.map(step => {
              if (step.pointers && step.pointers.length > 0) {
                return step.pointers[0];
              }
              return -1;
            }).filter(idx => idx >= 0);
          } else {
            // 兼容旧格式：如果返回的是索引数组
            if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'number') {
              searchIndices.value = response.data;
            } else {
              searchIndices.value = [];
            }
          }
          currentStepIndex.value = 0;
          currentSearchStep.value = -1;
        } else {
          // 处理排序和数组操作的返回数据
          if (steps.value.length > 0) {
            // 检查第一个步骤是否是初始状态
            const firstStep = steps.value[0];
            const firstStepArray = extractArrayFromStep(firstStep);
            const firstStepValues = firstStepArray.map(item => item.value);
            
            // 比较第一个步骤的数组值是否与输入数组匹配（顺序和值都要匹配）
            const isFirstStepMatchesInput = firstStepValues.length === array.length &&
              firstStepValues.every((val, idx) => val === array[idx]);
            
            // 检查是否是初始状态（通过 action 字段判断）
            const isInitialState = firstStep.action && (
              firstStep.action.includes('初始') || 
              firstStep.action.includes('初始状态')
            );
            
            // 如果第一个步骤不是初始状态，或者数组顺序不匹配，添加真正的初始步骤
            // 这样可以确保用户看到的第一个步骤是未排序的原始数组
            if (!isInitialState || !isFirstStepMatchesInput) {
              const initialStep = createInitialStep(array);
              steps.value.unshift(initialStep);
              
              if (process.env.NODE_ENV === 'development') {
                console.log('添加初始步骤:', {
                  inputArray: array,
                  firstStepValues: firstStepValues,
                  isInitialState: isInitialState,
                  isFirstStepMatchesInput: isFirstStepMatchesInput
                });
              }
            }
            
            currentStepIndex.value = 0;
            await nextTick();
          }
        }
        
        ElMessage.success('算法执行完成，可以开始可视化');
      } else {
        ElMessage.error(response.message || '算法执行失败');
      }
    } catch (error) {
      console.error('执行算法失败:', error);
      ElMessage.error(error.message || '执行算法失败，请稍后重试');
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
    searchIndices,
    currentSearchStep,
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

