/**
 * 算法配置
 */

export const ALGORITHMS = [
  { id: 'bubble-sort', name: '冒泡排序', description: '通过重复遍历数组，比较相邻元素并交换', type: 'sort' },
  { id: 'quick-sort', name: '快速排序', description: '使用分治策略的高效排序算法', type: 'sort' },
  { id: 'merge-sort', name: '归并排序', description: '稳定的分治排序算法', type: 'sort' },
  { id: 'insertion-sort', name: '插入排序', description: '构建有序序列的简单排序算法', type: 'sort' },
  { id: 'linear-search', name: '线性搜索', description: '逐个检查数组元素的搜索算法', type: 'search' },
  { id: 'binary-search', name: '二分搜索', description: '在有序数组中高效查找元素', type: 'search' },
  { id: 'reverse-array', name: '数组反转', description: '将数组元素顺序颠倒', type: 'operation' },
  { id: 'rotate-array', name: '数组旋转', description: '将数组元素按指定步长旋转', type: 'operation' }
];

