/**
 * 队列算法配置
 */

export const QUEUE_ALGORITHMS = [
  {
    id: 'queue-enqueue',
    name: '入队操作',
    description: '将元素添加到队尾',
    type: 'value'
  },
  {
    id: 'queue-dequeue',
    name: '出队操作',
    description: '从队首移除元素',
    type: 'operation'
  },
  {
    id: 'queue-peek-front',
    name: '查看队首',
    description: '查看队首元素但不移除',
    type: 'operation'
  },
  {
    id: 'queue-circular',
    name: '循环队列',
    description: '通过循环队列避免空间浪费',
    type: 'value',
    requiresCapacity: true
  }
];


