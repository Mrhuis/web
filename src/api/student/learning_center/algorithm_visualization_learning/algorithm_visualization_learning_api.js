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
  },

  /**
   * 在链表开头插入节点可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始链表对应的数组
   * @param {number} params.value - 要插入的值
   * @returns {Promise} 插入过程中每一步的链表状态列表
   */
  linkedListInsertAtHeadVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/linked-list/insert-at-head',
      method: 'post',
      data: params
    });
  },

  /**
   * 在链表末尾插入节点可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始链表对应的数组
   * @param {number} params.value - 要插入的值
   * @returns {Promise} 插入过程中每一步的链表状态列表
   */
  linkedListInsertAtTailVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/linked-list/insert-at-tail',
      method: 'post',
      data: params
    });
  },

  /**
   * 删除链表中指定值的节点可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始链表对应的数组
   * @param {number} params.value - 要删除的值
   * @returns {Promise} 删除过程中每一步的链表状态列表
   */
  linkedListDeleteNodeVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/linked-list/delete-node',
      method: 'post',
      data: params
    });
  },

  /**
   * 反转链表可视化
   * @param {number[]} array - 初始链表对应的数组
   * @returns {Promise} 反转过程中每一步的链表状态列表
   */
  linkedListReverseListVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/linked-list/reverse-list',
      method: 'post',
      data: { array }
    });
  },

  /**
   * 查找链表中间节点可视化
   * @param {number[]} array - 初始链表对应的数组
   * @returns {Promise} 查找过程中每一步的链表状态列表
   */
  linkedListFindMiddleNodeVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/linked-list/find-middle-node',
      method: 'post',
      data: { array }
    });
  },

  /**
   * 检测链表中是否存在环可视化
   * @param {number[]} array - 初始链表对应的数组
   * @returns {Promise} 检测过程中每一步的链表状态列表
   */
  linkedListHasCycleVisualization(array) {
    return request({
      url: '/student/algorithm-visualization/linked-list/has-cycle',
      method: 'post',
      data: { array }
    });
  },

  /**
   * 栈入栈操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始栈数组
   * @param {number} params.value - 要入栈的值
   */
  stackPushVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/stack/push',
      method: 'post',
      data: params
    });
  },

  /**
   * 栈出栈操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始栈数组
   */
  stackPopVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/stack/pop',
      method: 'post',
      data: params
    });
  },

  /**
   * 栈顶查看操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始栈数组
   */
  stackPeekVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/stack/peek',
      method: 'post',
      data: params
    });
  },

  /**
   * 栈反转操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始数组
   */
  stackReverseVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/stack/reverse',
      method: 'post',
      data: params
    });
  },

  /**
   * 队列入队操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始队列数组
   * @param {number} params.value - 要入队的值
   */
  queueEnqueueVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/queue/enqueue',
      method: 'post',
      data: params
    });
  },

  /**
   * 队列出队操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始队列数组
   */
  queueDequeueVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/queue/dequeue',
      method: 'post',
      data: params
    });
  },

  /**
   * 查看队首操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始队列数组
   */
  queuePeekFrontVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/queue/peek-front',
      method: 'post',
      data: params
    });
  },

  /**
   * 循环队列操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.array - 初始队列数组
   * @param {number} params.value - 要入队的值
   * @param {number} params.capacity - 队列容量
   */
  queueCircularVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/queue/circular-queue',
      method: 'post',
      data: params
    });
  },

  /**
   * 哈希表插入操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.keys - 现有键数组
   * @param {number[]} params.values - 现有值数组
   * @param {number} params.key - 要插入的键
   * @param {number} params.value - 要插入的值
   */
  hashInsertVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/hash/insert',
      method: 'post',
      data: params
    });
  },

  /**
   * 哈希表查找操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.keys - 现有键数组
   * @param {number[]} params.values - 现有值数组
   * @param {number} params.key - 要查找的键
   */
  hashSearchVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/hash/search',
      method: 'post',
      data: params
    });
  },

  /**
   * 哈希表删除操作可视化
   * @param {Object} params - 请求参数
   * @param {number[]} params.keys - 现有键数组
   * @param {number[]} params.values - 现有值数组
   * @param {number} params.key - 要删除的键
   */
  hashDeleteVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/hash/delete',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 前序遍历可视化
   * @param {Object} params
   * @param {number[]} params.values - 构建树的节点数组
   */
  treePreorderTraversalVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/preorder-traversal',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 中序遍历可视化
   * @param {Object} params
   * @param {number[]} params.values - 构建树的节点数组
   */
  treeInorderTraversalVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/inorder-traversal',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 后序遍历可视化
   * @param {Object} params
   * @param {number[]} params.values - 构建树的节点数组
   */
  treePostorderTraversalVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/postorder-traversal',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 层序遍历可视化
   * @param {Object} params
   * @param {number[]} params.values - 构建树的节点数组
   */
  treeLevelOrderTraversalVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/level-order-traversal',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 插入节点可视化
   * @param {Object} params
   * @param {number[]} params.values - 初始二叉搜索树节点
   * @param {number} params.value - 要插入的值
   */
  treeInsertNodeVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/insert-node',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 删除节点可视化
   * @param {Object} params
   * @param {number[]} params.values - 初始二叉搜索树节点
   * @param {number} params.value - 要删除的值
   */
  treeDeleteNodeVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/delete-node',
      method: 'post',
      data: params
    });
  },

  /**
   * 树 - 查找节点可视化
   * @param {Object} params
   * @param {number[]} params.values - 初始二叉搜索树节点
   * @param {number} params.value - 要查找的值
   */
  treeSearchNodeVisualization(params) {
    return request({
      url: '/student/algorithm-visualization/tree/search-node',
      method: 'post',
      data: params
    });
  }
};

export default algorithmVisualizationApi;
