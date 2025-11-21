/**
 * 数组 / 链表步骤解析工具
 * 用于从后端返回的步骤对象中提取线性展示所需的数据
 */

/**
 * 从步骤对象中提取线性结构（数组或链表）
 * @param {Object|Array} step - 算法步骤对象或数组
 * @returns {Array} 解析后的数组，每个元素至少包含 {value, index}
 *                  如有 originalIndex / prevIndex / nextIndex 也一并带上
 */
export const extractArrayFromStep = (step) => {
  if (!step) return [];
  
  // 数组算法：新的后端格式，AlgorithmStep 对象，包含 arrayState, pointers, action
  if (step.arrayState) {
    // 新格式：arrayState 是一个数组，每个元素包含 {value, originalIndex}
    // 这样可以保持数组顺序，避免 JavaScript 对象键排序的问题
    if (Array.isArray(step.arrayState)) {
      return step.arrayState.map((element, index) => ({
        value: element.value,
        originalIndex: element.originalIndex,
        index: index
      }));
    }
    
    // 兼容旧格式：arrayState 是一个对象（Map）
    // 这种情况应该不会再出现，但为了兼容性保留
    if (typeof step.arrayState === 'object') {
      const entries = Object.entries(step.arrayState);
      
      // 调试信息
      if (process.env.NODE_ENV === 'development') {
        console.warn('检测到旧格式的 arrayState（对象格式），建议后端升级到数组格式');
        console.log('extractArrayFromStep:', {
          action: step.action,
          entries: entries.map(([key, origIdx]) => [parseInt(key, 10), origIdx]),
          pointers: step.pointers
        });
      }
      
      // 对于旧格式，直接按照 Object.entries() 的顺序解析
      // 注意：这可能不准确，因为 JavaScript 会排序数字字符串键
      return entries.map(([key, originalIndex], index) => ({
        value: parseInt(key, 10),
        originalIndex: parseInt(originalIndex, 10),
        index: index
      }));
    }
  }

  // 链表算法：LinkedListAlgorithmStep 对象，包含 listState, pointers, action
  if (step.listState && Array.isArray(step.listState)) {
    return step.listState.map((node, index) => ({
      value: node.value,
      // 使用当前位置作为 originalIndex，保证高亮等逻辑可用
      originalIndex: index,
      // 透传链表结构信息，后续如果要做更复杂的链表可视化可以直接使用
      prevIndex: node.prevIndex,
      nextIndex: node.nextIndex,
      // 透传后端提供的节点自身指针标识
      pointerIndex: node.pointerIndex,
      index
    }));
  }
  
  // 兼容旧格式：如果 step 是数组
  if (Array.isArray(step)) {
    return step.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        if (item.value !== undefined && item.originalIndex !== undefined) {
          return {
            value: item.value,
            originalIndex: item.originalIndex,
            index
          };
        }
        const keys = Object.keys(item);
        const value = keys.length > 0 ? parseInt(keys[0]) : 0;
        const originalIndex = item[keys[0]];
        return {
          value,
          originalIndex,
          index
        };
      }
      return {
        value: item,
        index
      };
    });
  }
  
  // 兼容旧格式：如果 step 是对象（Map），但不是 AlgorithmStep 格式
  if (typeof step === 'object' && step !== null && !step.arrayState) {
    const result = [];
    const entries = Object.entries(step);
    for (const [key, originalIndex] of entries) {
      result.push({
        value: parseInt(key),
        originalIndex: originalIndex,
        index: result.length
      });
    }
    return result;
  }
  
  return [];
};

/**
 * 创建初始状态的步骤
 * @param {Array<number>} array - 数组
 * @returns {Object} 初始状态的 AlgorithmStep 对象
 */
export const createInitialStep = (array) => {
  // 构建 arrayState 数组，每个元素包含 value 和 originalIndex
  // 使用数组格式可以保持顺序，避免 JavaScript 对象键排序的问题
  const arrayState = array.map((value, index) => ({
    value: value,
    originalIndex: index
  }));
  
  return {
    arrayState: arrayState,
    pointers: [],
    action: '初始状态'
  };
};

