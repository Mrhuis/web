export const GRAPH_ALGORITHMS = [
  {
    id: 'graph-dfs',
    name: '深度优先搜索 (DFS)',
    description: '沿着图的分支深入访问节点，适用于路径探索与拓扑遍历。',
    requiresStartNode: true,
    directed: false,
    forceUndirected: false,
    highlight: ['遍历', '递归']
  },
  {
    id: 'graph-bfs',
    name: '广度优先搜索 (BFS)',
    description: '按层次逐步扩散访问节点，可用于最短路径和连通性判定。',
    requiresStartNode: true,
    directed: false,
    forceUndirected: false,
    highlight: ['队列', '分层']
  },
  {
    id: 'graph-dijkstra',
    name: 'Dijkstra 最短路径',
    description: '在加权图中从起点计算到其他节点的最短距离，边权需为非负。',
    requiresStartNode: true,
    directed: false,
    forceUndirected: false,
    highlight: ['最短路径', '加权']
  },
  {
    id: 'graph-prim',
    name: 'Prim 最小生成树',
    description: '逐步扩展已选节点集合，得到连通图的最小生成树。',
    requiresStartNode: false,
    directed: false,
    forceUndirected: true,
    highlight: ['MST', '贪心']
  },
  {
    id: 'graph-kruskal',
    name: 'Kruskal 最小生成树',
    description: '按权重排序边并选择不会成环的边，构建最小生成树。',
    requiresStartNode: false,
    directed: false,
    forceUndirected: true,
    highlight: ['并查集', 'MST']
  }
];

export default GRAPH_ALGORITHMS;

