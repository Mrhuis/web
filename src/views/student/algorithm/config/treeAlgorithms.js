/**
 * 树算法配置
 */

export const TREE_ALGORITHMS = [
  {
    id: 'tree-preorder-traversal',
    name: '前序遍历',
    description: '以根-左-右顺序遍历二叉树节点，展示访问过程',
    category: 'tree',
    requiresArrayInput: true
  },
  {
    id: 'tree-inorder-traversal',
    name: '中序遍历',
    description: '以左-根-右顺序遍历二叉树节点，观察递归过程',
    category: 'tree',
    requiresArrayInput: true
  },
  {
    id: 'tree-postorder-traversal',
    name: '后序遍历',
    description: '以左-右-根顺序遍历二叉树节点，适合理解树删除策略',
    category: 'tree',
    requiresArrayInput: true
  },
  {
    id: 'tree-level-order-traversal',
    name: '层序遍历',
    description: '自顶向下按层访问节点，借助队列完成遍历',
    category: 'tree',
    requiresArrayInput: true
  },
  {
    id: 'tree-insert-node',
    name: '插入节点',
    description: '向二叉搜索树插入新节点，展示比较与指针调整步骤',
    category: 'tree',
    requiresArrayInput: true,
    requiresTarget: true,
    targetLabel: '要插入的值',
    targetPlaceholder: '请输入要插入的节点值'
  },
  {
    id: 'tree-delete-node',
    name: '删除节点',
    description: '从二叉搜索树删除节点，演示三种删除情形',
    category: 'tree',
    requiresArrayInput: true,
    requiresTarget: true,
    targetLabel: '要删除的值',
    targetPlaceholder: '请输入要删除的节点值'
  },
  {
    id: 'tree-search-node',
    name: '查找节点',
    description: '在二叉搜索树中查找目标值，展示比较路径',
    category: 'tree',
    requiresArrayInput: true,
    requiresTarget: true,
    targetLabel: '要查找的值',
    targetPlaceholder: '请输入要查找的节点值'
  }
];


