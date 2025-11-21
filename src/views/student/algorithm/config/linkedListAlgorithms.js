/**
 * 链表算法配置
 */

export const LINKED_LIST_ALGORITHMS = [
  {
    id: 'insert-at-head',
    name: '在链表头部插入',
    description: '在链表头部插入新节点，演示头插法的指针变化',
    type: 'value' // 需要额外的值参数
  },
  {
    id: 'insert-at-tail',
    name: '在链表尾部插入',
    description: '在链表尾部插入新节点，演示尾插法的指针变化',
    type: 'value'
  },
  {
    id: 'delete-node',
    name: '删除指定节点',
    description: '删除链表中第一个等于给定值的节点，并更新相邻指针',
    type: 'value'
  },
  {
    id: 'reverse-list',
    name: '反转链表',
    description: '演示双向链表反转过程中 prev / next 指针的变化',
    type: 'basic'
  },
  {
    id: 'find-middle-node',
    name: '查找中间节点',
    description: '使用快慢指针找到链表中间节点的过程',
    type: 'basic'
  },
  {
    id: 'has-cycle',
    name: '检测环',
    description: '使用快慢指针(Floyd判圈法)检测链表中是否存在环',
    type: 'basic'
  }
];


