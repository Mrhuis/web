/**
 * 哈希表算法配置
 */

export const HASH_TABLE_ALGORITHMS = [
  {
    id: 'hash-insert',
    name: '插入操作',
    description: '向哈希表中插入新的键值对',
    category: 'hash-table',
    requiresHashTableArrays: true,
    requiresHashKey: true,
    requiresHashValue: true,
    requiresArrayInput: false
  },
  {
    id: 'hash-search',
    name: '查找操作',
    description: '根据键查找对应的值',
    category: 'hash-table',
    requiresHashTableArrays: true,
    requiresHashKey: true,
    requiresArrayInput: false
  },
  {
    id: 'hash-delete',
    name: '删除操作',
    description: '删除指定的键值对',
    category: 'hash-table',
    requiresHashTableArrays: true,
    requiresHashKey: true,
    requiresArrayInput: false
  }
];


