/**
 * 数组相关工具函数
 */

/**
 * 解析用户输入的数组字符串
 * @param {string} input - 用户输入的数组字符串，用逗号分隔
 * @returns {Array<number>} 解析后的数字数组
 * @throws {Error} 如果输入无效
 */
export const parseArray = (input) => {
  if (!input || !input.trim()) {
    throw new Error('请输入数组元素');
  }
  const parts = input.split(',').map(s => s.trim()).filter(s => s);
  const array = parts.map(s => {
    const num = parseInt(s);
    if (isNaN(num)) {
      throw new Error(`无效的数字: ${s}`);
    }
    return num;
  });
  if (array.length === 0) {
    throw new Error('数组不能为空');
  }
  return array;
};

/**
 * 检查数组是否已排序（升序）
 * @param {Array<number>} array - 要检查的数组
 * @returns {boolean} 是否已排序
 */
export const isArraySorted = (array) => {
  if (array.length <= 1) return true;
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      return false;
    }
  }
  return true;
};

/**
 * 对数组进行排序（升序）
 * @param {Array<number>} array - 要排序的数组
 * @returns {Array<number>} 排序后的新数组
 */
export const sortArray = (array) => {
  return [...array].sort((a, b) => a - b);
};

