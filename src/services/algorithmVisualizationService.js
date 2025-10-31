import { request } from '@/utils/request'

/**
 * 算法可视化动画服务
 * 提供单步执行、播放、暂停等功能的API调用
 */
export const algorithmVisualizationService = {
  
  /**
   * 获取所有可用算法
   * @returns {Promise<Object>} 算法列表
   */
  async getAlgorithms() {
    return request({
      url: '/api/algorithm/list',
      method: 'get'
    })
  },

  /**
   * 获取算法详细信息
   * @param {string} algorithmId - 算法ID
   * @returns {Promise<Object>} 算法详细信息
   */
  async getAlgorithmInfo(algorithmId) {
    return request({
      url: `/api/algorithm/info/${algorithmId}`,
      method: 'get'
    })
  },

  /**
   * 执行算法（获取执行ID）
   * @param {string} algorithmId - 算法ID
   * @param {Object} inputData - 输入数据
   * @returns {Promise<Object>} 执行结果，包含executionId
   */
  async executeAlgorithm(algorithmId, inputData) {
    return request({
      url: '/api/algorithm/execute',
      method: 'post',
      data: {
        algorithmId,
        inputData
      }
    })
  },

  /**
   * 获取算法的所有执行步骤
   * @param {string} executionId - 执行ID
   * @returns {Promise<Object>} 所有步骤数据
   */
  async getAllSteps(executionId) {
    return request({
      url: `/api/algorithm/steps/${executionId}`,
      method: 'get'
    })
  },

  /**
   * 获取特定步骤
   * @param {string} executionId - 执行ID
   * @param {number} stepNumber - 步骤编号（从0开始）
   * @returns {Promise<Object>} 特定步骤数据
   */
  async getStep(executionId, stepNumber) {
    return request({
      url: `/api/algorithm/step/${executionId}/${stepNumber}`,
      method: 'get'
    })
  },

  /**
   * 重置算法执行
   * @param {string} executionId - 执行ID
   * @returns {Promise<Object>} 重置结果
   */
  async resetExecution(executionId) {
    return request({
      url: `/api/algorithm/reset/${executionId}`,
      method: 'post'
    })
  },

  /**
   * 验证算法输入参数
   * @param {string} algorithmId - 算法ID
   * @param {Object} inputData - 输入数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateInput(algorithmId, inputData) {
    return request({
      url: '/api/algorithm/validate',
      method: 'post',
      data: {
        algorithmId,
        inputData
      }
    })
  },

  /**
   * 完整的算法可视化流程
   * @param {string} algorithmId - 算法ID
   * @param {Object} inputData - 输入数据
   * @returns {Promise<Object>} 包含执行ID和步骤数据的完整结果
   */
  async startVisualization(algorithmId, inputData) {
    try {
      // 1. 验证输入参数
      const validationResult = await this.validateInput(algorithmId, inputData)
      if (!validationResult.success || !validationResult.valid) {
        throw new Error('输入参数验证失败: ' + (validationResult.errors?.join(', ') || '未知错误'))
      }

      // 2. 执行算法
      const executeResult = await this.executeAlgorithm(algorithmId, inputData)
      if (!executeResult.success) {
        throw new Error('算法执行失败: ' + executeResult.error)
      }

      // 3. 获取所有步骤
      const stepsResult = await this.getAllSteps(executeResult.executionId)
      if (!stepsResult.success) {
        throw new Error('获取步骤失败: ' + stepsResult.error)
      }

      return {
        success: true,
        executionId: executeResult.executionId,
        totalSteps: stepsResult.totalSteps,
        steps: stepsResult.steps,
        executionTime: executeResult.executionTime,
        memoryUsage: executeResult.memoryUsage,
        finalResult: executeResult.finalResult
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * 单步执行（获取下一步）
   * @param {string} executionId - 执行ID
   * @param {number} currentStep - 当前步骤
   * @returns {Promise<Object>} 下一步数据
   */
  async stepForward(executionId, currentStep) {
    return this.getStep(executionId, currentStep + 1)
  },

  /**
   * 单步回退（获取上一步）
   * @param {string} executionId - 执行ID
   * @param {number} currentStep - 当前步骤
   * @returns {Promise<Object>} 上一步数据
   */
  async stepBackward(executionId, currentStep) {
    return this.getStep(executionId, currentStep - 1)
  },

  /**
   * 跳转到指定步骤
   * @param {string} executionId - 执行ID
   * @param {number} stepNumber - 目标步骤
   * @returns {Promise<Object>} 指定步骤数据
   */
  async jumpToStep(executionId, stepNumber) {
    return this.getStep(executionId, stepNumber)
  },

  /**
   * 获取算法的默认输入数据
   * @param {string} algorithmId - 算法ID
   * @returns {Promise<Object>} 默认输入数据
   */
  async getDefaultInputData(algorithmId) {
    try {
      const algorithmInfo = await this.getAlgorithmInfo(algorithmId)
      if (algorithmInfo.success && algorithmInfo.algorithm) {
        return {
          success: true,
          defaultData: algorithmInfo.algorithm.defaultTestData || {}
        }
      }
      return {
        success: false,
        error: '无法获取算法信息'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 算法可视化控制器
 * 提供高级的动画控制功能
 */
export class AlgorithmVisualizationController {
  constructor() {
    this.executionId = null
    this.currentStep = -1
    this.totalSteps = 0
    this.steps = []
    this.isPlaying = false
    this.animationInterval = null
    this.animationSpeed = 1000 // 默认1秒
    this.onStepChange = null
    this.onPlayStateChange = null
  }

  /**
   * 开始算法可视化
   * @param {string} algorithmId - 算法ID
   * @param {Object} inputData - 输入数据
   * @param {Function} onStepChange - 步骤变化回调
   * @param {Function} onPlayStateChange - 播放状态变化回调
   */
  async start(algorithmId, inputData, onStepChange = null, onPlayStateChange = null) {
    this.onStepChange = onStepChange
    this.onPlayStateChange = onPlayStateChange

    const result = await algorithmVisualizationService.startVisualization(algorithmId, inputData)
    
    if (result.success) {
      this.executionId = result.executionId
      this.totalSteps = result.totalSteps
      this.steps = result.steps
      this.currentStep = -1
      
      // 显示第一步
      await this.showStep(0)
      
      return result
    } else {
      throw new Error(result.error)
    }
  }

  /**
   * 显示指定步骤
   * @param {number} stepNumber - 步骤编号
   */
  async showStep(stepNumber) {
    if (stepNumber < 0 || stepNumber >= this.totalSteps) {
      return false
    }

    this.currentStep = stepNumber
    const stepData = this.steps[stepNumber]
    
    if (this.onStepChange) {
      this.onStepChange(stepData, stepNumber, this.totalSteps)
    }
    
    return true
  }

  /**
   * 下一步
   */
  async nextStep() {
    return this.showStep(this.currentStep + 1)
  }

  /**
   * 上一步
   */
  async previousStep() {
    return this.showStep(this.currentStep - 1)
  }

  /**
   * 跳转到指定步骤
   * @param {number} stepNumber - 目标步骤
   */
  async jumpToStep(stepNumber) {
    return this.showStep(stepNumber)
  }

  /**
   * 开始播放动画
   * @param {number} speed - 播放速度（毫秒）
   */
  play(speed = this.animationSpeed) {
    if (this.isPlaying) return
    
    this.isPlaying = true
    this.animationSpeed = speed
    
    if (this.onPlayStateChange) {
      this.onPlayStateChange(true)
    }
    
    this.animationInterval = setInterval(async () => {
      if (this.currentStep >= this.totalSteps - 1) {
        this.pause()
        return
      }
      
      await this.nextStep()
    }, speed)
  }

  /**
   * 暂停动画
   */
  pause() {
    if (!this.isPlaying) return
    
    this.isPlaying = false
    
    if (this.animationInterval) {
      clearInterval(this.animationInterval)
      this.animationInterval = null
    }
    
    if (this.onPlayStateChange) {
      this.onPlayStateChange(false)
    }
  }

  /**
   * 重置动画
   */
  async reset() {
    this.pause()
    this.currentStep = -1
    await this.showStep(0)
  }

  /**
   * 设置播放速度
   * @param {number} speed - 播放速度（毫秒）
   */
  setSpeed(speed) {
    this.animationSpeed = speed
    if (this.isPlaying) {
      this.pause()
      this.play(speed)
    }
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      executionId: this.executionId,
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      isPlaying: this.isPlaying,
      animationSpeed: this.animationSpeed,
      progress: this.totalSteps > 0 ? ((this.currentStep + 1) / this.totalSteps) * 100 : 0
    }
  }

  /**
   * 销毁控制器
   */
  destroy() {
    this.pause()
    this.executionId = null
    this.currentStep = -1
    this.totalSteps = 0
    this.steps = []
    this.onStepChange = null
    this.onPlayStateChange = null
  }
} 