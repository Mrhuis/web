import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求失败:', error)
    return Promise.reject(error)
  }
)

export const algorithmService = {
  /**
   * 获取所有可用算法
   */
  async getAlgorithms() {
    try {
      const response = await api.get('/algorithm/list')
      return response
    } catch (error) {
      throw new Error('获取算法列表失败: ' + error.message)
    }
  },

  /**
   * 执行算法
   * @param {string} algorithmId - 算法ID
   * @param {Array} input - 输入数组
   * @param {Object} options - 其他选项
   */
  async executeAlgorithm(algorithmId, input, options = {}) {
    try {
      const response = await api.post('/algorithm/execute', {
        algorithmId,
        input,
        ...options
      })
      return response
    } catch (error) {
      throw new Error('执行算法失败: ' + error.message)
    }
  },

  /**
   * 获取算法详情
   * @param {string} algorithmId - 算法ID
   */
  async getAlgorithmDetails(algorithmId) {
    try {
      const response = await api.get(`/algorithm/${algorithmId}`)
      return response
    } catch (error) {
      throw new Error('获取算法详情失败: ' + error.message)
    }
  },

  /**
   * 获取算法执行历史
   * @param {Object} filters - 过滤条件
   */
  async getExecutionHistory(filters = {}) {
    try {
      const response = await api.get('/algorithm/history', { params: filters })
      return response
    } catch (error) {
      throw new Error('获取执行历史失败: ' + error.message)
    }
  },

  /**
   * 保存算法执行结果
   * @param {Object} result - 执行结果
   */
  async saveExecutionResult(result) {
    try {
      const response = await api.post('/algorithm/result', result)
      return response
    } catch (error) {
      throw new Error('保存执行结果失败: ' + error.message)
    }
  },

  /**
   * 获取算法统计信息
   */
  async getAlgorithmStats() {
    try {
      const response = await api.get('/algorithm/stats')
      return response
    } catch (error) {
      throw new Error('获取算法统计失败: ' + error.message)
    }
  },

  /**
   * 验证算法输入
   * @param {string} algorithmId - 算法ID
   * @param {Array} input - 输入数组
   */
  async validateInput(algorithmId, input) {
    try {
      const response = await api.post('/algorithm/validate', {
        algorithmId,
        input
      })
      return response
    } catch (error) {
      throw new Error('验证输入失败: ' + error.message)
    }
  },

  /**
   * 获取算法复杂度信息
   * @param {string} algorithmId - 算法ID
   */
  async getComplexityInfo(algorithmId) {
    try {
      const response = await api.get(`/algorithm/${algorithmId}/complexity`)
      return response
    } catch (error) {
      throw new Error('获取复杂度信息失败: ' + error.message)
    }
  },

  /**
   * 获取算法可视化配置
   * @param {string} algorithmId - 算法ID
   */
  async getVisualizationConfig(algorithmId) {
    try {
      const response = await api.get(`/algorithm/${algorithmId}/visualization`)
      return response
    } catch (error) {
      throw new Error('获取可视化配置失败: ' + error.message)
    }
  }
}

export default algorithmService 