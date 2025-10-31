/**
 * 分块上传工具类
 * 支持大文件分块上传、断点续传、进度跟踪等功能
 */

export class ChunkUploader {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1024 * 1024;
    this.concurrent = options.concurrent || 3;
    this.retryTimes = options.retryTimes || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.uploadUrl = options.uploadUrl || '/api/upload/chunk';
    this.mergeUrl = options.mergeUrl || '/api/upload/merge';
    this.file = null;
    this.fileId = null;
    this.chunks = [];
    this.uploadedChunks = new Set();
    this.failedChunks = new Set();
    this.retryMap = new Map(); // 添加缺失的retryMap
    this.isPaused = false;
    this.isCancelled = false;
    this.onProgress = options.onProgress || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onChunkComplete = options.onChunkComplete || (() => {});
    
    // 用户ID相关
    this.userId = options.userId || null;
    this.getUserIdFromStore = options.getUserIdFromStore || null;
    
    // 调试日志
    console.log('ChunkUploader 初始化完成:', {
      chunkSize: this.chunkSize,
      concurrent: this.concurrent,
      hasRetryMap: !!this.retryMap,
      hasUploadedChunks: !!this.uploadedChunks,
      hasFailedChunks: !!this.failedChunks
    });
  }

  /**
   * 设置要上传的文件
   */
  setFile(file) {
    // 确保所有必要的属性都已初始化
    if (!this.uploadedChunks) this.uploadedChunks = new Set();
    if (!this.failedChunks) this.failedChunks = new Set();
    if (!this.retryMap) this.retryMap = new Map();
    
    console.log('setFile 调用前状态:', {
      hasFile: !!this.file,
      hasRetryMap: !!this.retryMap,
      hasUploadedChunks: !!this.uploadedChunks,
      hasFailedChunks: !!this.failedChunks,
      retryMapType: this.retryMap ? typeof this.retryMap : 'undefined'
    });
    
    this.file = file;
    this.fileId = this.generateFileId(file);
    this.chunks = this.createChunks(file);
    this.uploadedChunks.clear();
    this.failedChunks.clear();
    this.retryMap.clear();
    
    console.log('setFile 调用后状态:', {
      hasFile: !!this.file,
      hasRetryMap: !!this.retryMap,
      hasUploadedChunks: !!this.uploadedChunks,
      hasFailedChunks: !!this.failedChunks
    });
  }

  /**
   * 生成文件唯一ID
   */
  generateFileId(file) {
    return `${file.name}_${file.size}_${file.lastModified}_${Date.now()}`;
  }

  /**
   * 创建文件分块
   */
  createChunks(file) {
    const chunks = [];
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      chunks.push({
        index: i,
        data: chunk,
        start,
        end,
        size: chunk.size
      });
    }
    
    return chunks;
  }

  /**
   * 开始上传
   */
  async startUpload() {
    if (!this.file) {
      throw new Error('请先设置要上传的文件');
    }

    this.isPaused = false;
    this.isCancelled = false;
    
    // 开始并发上传
    const uploadPromises = [];
    for (let i = 0; i < this.concurrent; i++) {
      uploadPromises.push(this.uploadWorker());
    }
    
    try {
      await Promise.all(uploadPromises);
      
      if (this.isCancelled) {
        console.log('上传已取消，不进行合并');
        return;
      }
      
      if (this.isPaused) {
        console.log('上传已暂停，不进行合并');
        return;
      }
      
      // 检查是否所有分块都已上传
      const totalChunks = this.chunks.length + this.uploadedChunks.size + this.failedChunks.size;
      if (this.uploadedChunks.size < totalChunks) {
        console.log('还有分块未上传完成，不进行合并');
        return;
      }
      
      console.log('所有分块上传完成，开始合并...');
      // 所有分块上传完成，合并文件
      await this.mergeChunks();
      
    } catch (error) {
      console.error('上传过程中发生错误:', error);
      this.onError(error);
    }
  }

  /**
   * 上传工作线程
   */
  async uploadWorker() {
    while (this.chunks.length > 0 && !this.isPaused && !this.isCancelled) {
      const chunk = this.chunks.shift();
      if (!chunk) break;
      
      await this.uploadChunk(chunk);
    }
  }

  /**
   * 上传单个分块
   */
  async uploadChunk(chunk) {
    const maxRetries = this.retryTimes;
    let retryCount = 0;
    
    while (retryCount <= maxRetries && !this.isCancelled) {
      try {
        await this.uploadChunkToServer(chunk);
        this.uploadedChunks.add(chunk.index);
        this.updateProgress();
        return;
        
      } catch (error) {
        retryCount++;
        console.warn(`分块 ${chunk.index} 上传失败，重试 ${retryCount}/${maxRetries}:`, error);
        
        if (retryCount > maxRetries) {
          this.failedChunks.add(chunk.index);
          this.onError(new Error(`分块 ${chunk.index} 上传失败，已达到最大重试次数`));
          return;
        }
        
        // 等待一段时间后重试
        await this.delay(1000 * retryCount);
      }
    }
  }

  /**
   * 上传分块到服务器
   */
  async uploadChunkToServer(chunk) {
    const formData = new FormData();
    
    // 创建分块信息
    const chunkInfo = {
      fileId: this.fileId,
      fileName: this.file.name,
      chunkNumber: chunk.index,
      totalChunks: this.chunks.length + this.uploadedChunks.size + this.failedChunks.size,
      chunkSize: chunk.size,
      totalFileSize: this.file.size,
      uploaderId: this.getUserId()
    };
    
    formData.append('chunk', JSON.stringify(chunkInfo));
    formData.append('file', chunk.data);
    
    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传失败: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || '上传失败');
    }
  }

  /**
   * 合并文件分块
   */
  async mergeChunks() {
    try {
      const requestBody = {
        fileId: this.fileId,
        fileName: this.file.name,
        uploaderId: this.getUserId()
      };
      
      console.log('发送合并请求:', requestBody);
      
      const response = await fetch(this.mergeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('合并响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('合并失败响应:', errorText);
        
        // 尝试解析错误响应
        let errorMessage = `合并失败: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // 如果无法解析JSON，使用原始错误文本
          if (errorText) {
            errorMessage = `合并失败: ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('合并成功响应:', result);
      
      if (result.status === 'success') {
        this.onSuccess(result);
      } else {
        throw new Error(result.message || '合并失败');
      }
      
    } catch (error) {
      console.error('合并分块时发生错误:', error);
      this.onError(error);
    }
  }

  /**
   * 更新上传进度
   */
  updateProgress() {
    const totalChunks = this.chunks.length + this.uploadedChunks.size + this.failedChunks.size;
    const completedChunks = this.uploadedChunks.size;
    const percentage = Math.round((completedChunks / totalChunks) * 100);
    
    this.onProgress({
      completed: completedChunks,
      total: totalChunks,
      percentage: percentage
    });
  }

  /**
   * 暂停上传
   */
  pause() {
    this.isPaused = true;
    console.log('上传已暂停，已上传分块数量:', this.uploadedChunks.size);
  }

  /**
   * 恢复上传
   */
  resume() {
    if (!this.isPaused) {
      console.log('上传未处于暂停状态');
      return;
    }
    
    console.log('恢复上传，剩余分块数量:', this.chunks.length);
    this.isPaused = false;
    
    // 重新开始上传工作线程
    this.startUpload();
  }

  /**
   * 取消上传
   */
  cancel() {
    this.isCancelled = true;
    this.isPaused = false;
    
    // 清理状态
    this.chunks = [];
    this.uploadedChunks.clear();
    this.failedChunks.clear();
    
    console.log('上传已取消，所有状态已清理');
  }

  /**
   * 获取上传状态信息
   */
  getStatus() {
    return {
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      totalChunks: this.chunks.length + this.uploadedChunks.size + this.failedChunks.size,
      uploadedChunks: this.uploadedChunks.size,
      remainingChunks: this.chunks.length,
      failedChunks: this.failedChunks.size
    };
  }

  /**
   * 获取用户ID（从localStorage或store中获取）
   */
  getUserId() {
    try {
      // 优先使用传入的userId
      if (this.userId) {
        console.log('使用传入的userId:', this.userId);
        return this.userId;
      }

      // 优先从localStorage获取user_key（主要方式）
      const userKey = localStorage.getItem('user_key');
      if (userKey) {
        console.log('从localStorage获取到userKey:', userKey);
        return userKey;
      }

      // 尝试从localStorage获取user_id（兼容旧版本）
      const userId = localStorage.getItem('user_id');
      if (userId) {
        console.log('从localStorage获取到userId:', userId);
        return userId;
      }
      
      // 尝试从sessionStorage获取
      const sessionUserKey = sessionStorage.getItem('user_key');
      if (sessionUserKey) {
        console.log('从sessionStorage获取到userKey:', sessionUserKey);
        return sessionUserKey;
      }
      
      // 尝试从Pinia store获取（主要方式）
      if (window.__PINIA__ && window.__PINIA__.state && window.__PINIA__.state.user) {
        const storeUserKey = window.__PINIA__.state.user.userKey;
        if (storeUserKey) {
          console.log('从Pinia store获取到userKey:', storeUserKey);
          return storeUserKey.toString();
        }
      }
      
      // 尝试从Vuex store获取（兼容旧版本）
      if (window.store && window.store.state && window.store.state.user) {
        const storeUserKey = window.store.state.user.userKey;
        if (storeUserKey) {
          console.log('从Vuex store获取到userKey:', storeUserKey);
          return storeUserKey.toString();
        }
      }
      
      // 尝试从全局变量获取
      if (window.currentUser && window.currentUser.userKey) {
        console.log('从全局变量获取到userKey:', window.currentUser.userKey);
        return window.currentUser.userKey.toString();
      }
      
      // 如果都获取不到，使用默认值并记录警告
      console.warn('无法获取用户ID，使用默认值: A0001');
      return 'A0001';
      
    } catch (error) {
      console.error('获取用户ID时发生错误:', error);
      return 'A0001';
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建分块上传器实例
 */
export function createChunkUploader(options = {}) {
  return new ChunkUploader(options);
}

export default ChunkUploader; 