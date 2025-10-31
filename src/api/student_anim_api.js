import request from '@/utils/request'

/**
 * 学生动画页面API接口
 */
export const studentAnimApi = {
  /**
   * 获取动画列表
   */
  getAnimations() {
    return request({
      url: '/api/student/anim/animations',
      method: 'get'
    })
  },

  /**
   * 获取动画详情
   * @param {string} animationId - 动画ID
   */
  getAnimationDetail(animationId) {
    return request({
      url: `/api/student/anim/animations/${animationId}`,
      method: 'get'
    })
  },

  /**
   * 获取动画播放历史
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页大小
   * @param {string} params.animationId - 动画ID（可选）
   */
  getPlayHistory(params) {
    return request({
      url: '/api/student/anim/history',
      method: 'get',
      params
    })
  },

  /**
   * 保存播放记录
   * @param {Object} data - 保存数据
   * @param {string} data.animationId - 动画ID
   * @param {number} data.watchTime - 观看时长（秒）
   * @param {number} data.progress - 观看进度（0-1）
   */
  savePlayRecord(data) {
    return request({
      url: '/api/student/anim/record',
      method: 'post',
      data
    })
  },

  /**
   * 获取动画统计信息
   */
  getAnimationStats() {
    return request({
      url: '/api/student/anim/stats',
      method: 'get'
    })
  },

  /**
   * 获取推荐动画
   */
  getRecommendedAnimations() {
    return request({
      url: '/api/student/anim/recommended',
      method: 'get'
    })
  },

  /**
   * 获取动画分类
   */
  getAnimationCategories() {
    return request({
      url: '/api/student/anim/categories',
      method: 'get'
    })
  },

  /**
   * 搜索动画
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 关键词
   * @param {string} params.category - 分类
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页大小
   */
  searchAnimations(params) {
    return request({
      url: '/api/student/anim/search',
      method: 'get',
      params
    })
  },

  /**
   * 获取动画播放配置
   * @param {string} animationId - 动画ID
   */
  getAnimationConfig(animationId) {
    return request({
      url: `/api/student/anim/config/${animationId}`,
      method: 'get'
    })
  },

  /**
   * 更新动画播放配置
   * @param {string} animationId - 动画ID
   * @param {Object} config - 配置数据
   */
  updateAnimationConfig(animationId, config) {
    return request({
      url: `/api/student/anim/config/${animationId}`,
      method: 'put',
      data: config
    })
  },

  /**
   * 获取动画帧数据
   * @param {string} animationId - 动画ID
   * @param {number} frameIndex - 帧索引
   */
  getAnimationFrame(animationId, frameIndex) {
    return request({
      url: `/api/student/anim/frame/${animationId}/${frameIndex}`,
      method: 'get'
    })
  },

  /**
   * 获取动画缩略图
   * @param {string} animationId - 动画ID
   */
  getAnimationThumbnail(animationId) {
    return request({
      url: `/api/student/anim/thumbnail/${animationId}`,
      method: 'get'
    })
  },

  // ========== 算法单步可视化相关API ==========
  
  /**
   * 获取可用算法列表
   */
  getAvailableAlgorithms() {
    return request({
      url: '/api/algorithm/list',
      method: 'get'
    })
  },

  /**
   * 获取算法详细信息
   * @param {string} algorithmId - 算法ID
   */
  getAlgorithmInfo(algorithmId) {
    return request({
      url: `/api/algorithm/info/${algorithmId}`,
      method: 'get'
    })
  },

  /**
   * 执行算法
   * @param {Object} data - 执行数据
   * @param {string} data.algorithmId - 算法ID
   * @param {Object} data.inputData - 输入数据
   */
  executeAlgorithm(data) {
    return request({
      url: '/api/algorithm/execute',
      method: 'post',
      data
    })
  },

  /**
   * 获取算法执行步骤
   * @param {string} executionId - 执行ID
   */
  getExecutionSteps(executionId) {
    return request({
      url: `/api/algorithm/steps/${executionId}`,
      method: 'get'
    })
  },

  /**
   * 获取特定步骤数据
   * @param {string} executionId - 执行ID
   * @param {number} stepNumber - 步骤编号
   */
  getStepData(executionId, stepNumber) {
    return request({
      url: `/api/algorithm/step/${executionId}/${stepNumber}`,
      method: 'get'
    })
  },

  /**
   * 重置算法执行
   * @param {string} executionId - 执行ID
   */
  resetExecution(executionId) {
    return request({
      url: `/api/algorithm/reset/${executionId}`,
      method: 'post'
    })
  },

  /**
   * 获取算法执行状态
   * @param {string} executionId - 执行ID
   */
  getExecutionStatus(executionId) {
    return request({
      url: `/api/algorithm/status/${executionId}`,
      method: 'get'
    })
  },

  /**
   * 获取算法测试用例
   * @param {string} algorithmId - 算法ID
   */
  getTestCases(algorithmId) {
    return request({
      url: `/api/algorithm/testcases/${algorithmId}`,
      method: 'get'
    })
  },

  /**
   * 验证算法输入参数
   * @param {Object} data - 验证数据
   * @param {string} data.algorithmId - 算法ID
   * @param {Object} data.inputData - 输入数据
   */
  validateInput(data) {
    return request({
      url: '/api/algorithm/validate',
      method: 'post',
      data
    })
  }
}

export default studentAnimApi