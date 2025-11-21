import request from '@/utils/request';

/**
 * 学生算法可视化学习相关API接口
 */
export const algorithmVisualizationApi = {
  /**
   * 冒泡排序可视化
   * @param {number[]} array - 待排序的整数数组
   * @returns {Promise} 排序过程中每一步的状态列表
   */
  bubbleSortVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/numerical/bubble-sort',
      method: 'post',
      data: array
    });
  },

  /**
   * 快速排序可视化
   * @param {number[]} array - 待排序的整数数组
   * @returns {Promise} 排序过程中每一步的状态列表
   */
  quickSortVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/numerical/quick-sort',
      method: 'post',
      data: array
    });
  },

  /**
   * 归并排序可视化
   * @param {number[]} array - 待排序的整数数组
   * @returns {Promise} 排序过程中每一步的状态列表
   */
  mergeSortVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/numerical/merge-sort',
      method: 'post',
      data: array
    });
  },

  /**
   * 插入排序可视化
   * @param {number[]} array - 待排序的整数数组
   * @returns {Promise} 排序过程中每一步的状态列表
   */
  insertionSortVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/numerical/insertion-sort',
      method: 'post',
      data: array
    });
  },

  /**
   * 数组反转可视化
   * @param {number[]} array - 待反转的整数数组
   * @returns {Promise} 反转过程中每一步的状态列表
   */
  reverseArrayVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/numerical/reverse-array',
      method: 'post',
      data: array
    });
  },

  /**
   * 数组旋转可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 待旋转的整数数组
   * @param {number} params.steps - 旋转步长
   * @returns {Promise} 旋转过程中每一步的状态列表
   */
  rotateArrayVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/numerical/rotate-array',
      method: 'post',
      data: params
    });
  },

  /**
   * 线性搜索可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 待搜索的整数数组
   * @param {number} params.target - 目标值
   * @returns {Promise} 搜索过程中比较元素的下标顺序列表
   */
  linearSearchVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/numerical/linear-search',
      method: 'post',
      data: params
    });
  },

  /**
   * 二分搜索可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 待搜索的整数数组（必须有序）
   * @param {number} params.target - 目标值
   * @returns {Promise} 搜索过程中比较元素的下标顺序列表
   */
  binarySearchVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/numerical/binary-search',
      method: 'post',
      data: params
    });
  }
};

export default algorithmVisualizationApi;
