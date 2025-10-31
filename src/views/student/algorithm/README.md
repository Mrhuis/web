# 算法可视化模块架构

## 概述

算法可视化模块已经重构为模块化架构，将原来的单一大型文件拆分为多个专门的数据结构子页面，每个子页面负责处理特定数据结构的算法可视化。

## 文件结构

```
algorithm/
├── README.md                           # 本文件
├── ArrayVisualization.vue             # 数组算法可视化
├── LinkedListVisualization.vue        # 链表算法可视化
├── StackVisualization.vue             # 栈算法可视化
├── QueueVisualization.vue             # 队列算法可视化
├── HashTableVisualization.vue         # 哈希表算法可视化
├── TreeVisualization.vue              # 树算法可视化
└── GraphVisualization.vue             # 图算法可视化
```

## 架构优势

### 1. 模块化设计
- 每个数据结构有独立的组件文件
- 便于维护和扩展
- 代码职责清晰

### 2. 性能优化
- 按需加载组件
- 减少单个文件的复杂度
- 提高页面响应速度

### 3. 开发效率
- 团队可以并行开发不同数据结构
- 便于单元测试
- 代码复用性更高

## 数据结构覆盖

### 数组 (ArrayVisualization.vue)
- 冒泡排序
- 快速排序
- 归并排序
- 插入排序
- 线性搜索
- 二分搜索
- 数组反转
- 数组旋转

### 链表 (LinkedListVisualization.vue)
- 在开头插入
- 在末尾插入
- 删除节点
- 反转链表
- 查找中间节点
- 检测环

### 栈 (StackVisualization.vue)
- 入栈操作
- 出栈操作
- 查看栈顶
- 栈反转

### 队列 (QueueVisualization.vue)
- 入队操作
- 出队操作
- 查看队首
- 循环队列

### 哈希表 (HashTableVisualization.vue)
- 插入操作
- 查找操作
- 删除操作

### 树 (TreeVisualization.vue)
- 前序遍历
- 中序遍历
- 后序遍历
- 层序遍历
- 插入节点
- 删除节点
- 查找节点

### 图 (GraphVisualization.vue)
- 深度优先搜索
- 广度优先搜索
- Dijkstra算法
- Prim算法
- Kruskal算法

## 使用方式

1. 在主页面 `AlgorithmVisualization.vue` 中选择数据结构
2. 系统会自动加载对应的子页面组件
3. 在子页面中选择具体的算法进行可视化学习

## 扩展指南

### 添加新的数据结构
1. 在 `algorithm/` 目录下创建新的 Vue 组件
2. 在主页面中导入并注册新组件
3. 在 `dataStructures` 数组中添加新数据结构配置
4. 在 `componentMap` 中添加组件映射

### 添加新的算法
1. 在对应数据结构组件的 `algorithms` 数组中添加新算法
2. 实现算法的可视化逻辑
3. 添加相应的交互功能

## 技术栈

- Vue 3 Composition API
- CSS Grid 和 Flexbox 布局
- SVG 图形绘制
- 响应式设计

## 后续优化方向

1. 添加动画效果
2. 实现算法执行步骤的可视化
3. 添加代码高亮显示
4. 支持自定义数据输入
5. 添加算法复杂度分析
6. 实现算法性能对比 
 