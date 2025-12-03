import request from '@/utils/request';
import { ElMessage } from 'element-plus'; // Added ElMessage import
import axios from 'axios';

// 创建专门用于下载的axios实例，设置更长的超时时间
const downloadRequest = axios.create({
  baseURL: '/api',
  timeout: 5 * 60 * 1000, // 5分钟超时，足够等待3分钟的任务完成
});

// 添加请求拦截器
downloadRequest.interceptors.request.use(
  config => {
    // 可以在这里添加认证信息等
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
downloadRequest.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('下载请求失败:', error);
    return Promise.reject(error);
  }
);

/**
 * 获取资源（插件）列表
 * @param {string} status - 资源状态（如 'approved'）
 * @returns {Promise} 资源列表数据
 */
export function getPlugins(status) {
  return request({
    url: '/admin/plugins',
    method: 'get',
    params: { status }
  });
}

/**
 * 获取插件列表（支持分页和查询条件）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 插件列表数据
 */
export function getAllPlugins(queryParams = {}) {
  return request({
    url: '/admin/plugins/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 获取插件详情
 * @param {number|string} id - 插件ID
 * @returns {Promise} 插件详情
 */
export function getPluginById(id) {
  return request({
    url: `/admin/plugins/${id}`,
    method: 'get'
  });
}

/**
 * 根据插件KEY获取插件详情
 * @param {string} pluginKey - 插件唯一标识
 * @returns {Promise} 插件详情
 */
export function getPluginByKey(pluginKey) {
  return request({
    url: `/admin/plugins/key/${pluginKey}`,
    method: 'get'
  });
}

/**
 * 更新插件状态
 * @param {number|string} id - 插件ID
 * @param {string} status - 新状态
 * @returns {Promise} 更新结果
 */
export function updatePluginStatus(id, status) {
  return request({
    url: `/admin/plugins/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/**
 * 更新插件信息
 * @param {number|string} id - 插件ID
 * @param {Object} plugin - 插件信息
 * @returns {Promise} 更新结果
 */
export function updatePlugin(id, plugin) {
  return request({
    url: `/admin/plugins/${id}`,
    method: 'put',
    data: plugin
  });
}

/**
 * 删除插件
 * @param {number|string} id - 插件ID
 * @returns {Promise} 删除结果
 */
export function deletePlugin(id) {
  return request({
    url: `/admin/plugins/${id}`,
    method: 'delete'
  });
}

/**
 * 批量删除插件
 * @param {Array<number|string>} ids - 插件ID列表
 * @returns {Promise} 删除结果
 */
export function batchDeletePlugins(ids) {
  return request({
    url: '/admin/plugins/batch',
    method: 'delete',
    data: ids
  });
}

/**
 * 批量更新插件状态
 * @param {Array<number|string>} ids - 插件ID列表
 * @param {string} status - 新状态
 * @returns {Promise} 更新结果
 */
export function batchUpdatePluginStatus(ids, status) {
  return request({
    url: '/admin/plugins/batch/status',
    method: 'put',
    data: { ids, status }
  });
}

/**
 * 异步下载插件资源包
 * @param {string} pluginKey - 资源唯一标识
 * @returns {Promise<void>} 触发浏览器下载，无返回值
 */
export async function downloadPlugin(pluginKey) {
  try {
    console.log('开始异步下载流程...');
    
    // 第一步：启动异步下载任务
    const startResponse = await downloadRequest({
      url: '/admin/plugins/download',
      method: 'get',
      params: { pluginKey },
      responseType: 'json'
    });
    
    if (startResponse.data.status !== 'processing') {
      throw new Error('启动下载任务失败: ' + startResponse.data.message);
    }
    
    const taskId = startResponse.data.taskId;
    console.log('下载任务已启动，任务ID:', taskId);
    
    // 第二步：轮询任务状态
    let taskStatus = null;
    let retryCount = 0;
    const maxRetries = 300; // 最多等待10分钟 (300 * 2秒)
    
    while (retryCount < maxRetries) {
      try {
        const statusResponse = await downloadRequest({
          url: `/admin/plugins/download/status/${taskId}`,
          method: 'get',
          responseType: 'json'
        });
        
        taskStatus = statusResponse.data;
        console.log('任务状态:', taskStatus.status, '进度:', taskStatus.progress, '消息:', taskStatus.message);
        
        if (taskStatus.status === 'completed') {
          console.log('下载任务完成，开始下载文件...');
          break;
        } else if (taskStatus.status === 'failed') {
          throw new Error('下载任务失败: ' + (taskStatus.errorMessage || taskStatus.message));
        }
        
        // 等待2秒后再次查询
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
        
      } catch (error) {
        console.error('查询任务状态失败:', error);
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('查询任务状态超时，请稍后重试');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!taskStatus || taskStatus.status !== 'completed') {
      throw new Error('下载任务超时或失败');
    }
    
    // 第三步：下载实际文件
    const downloadResponse = await downloadRequest({
      url: '/admin/plugins/download-file',
      method: 'get',
      params: { pluginKey, taskId },
      responseType: 'blob'
    });
    
    // 处理文件下载
    const blob = downloadResponse.data;
    const contentDisposition = downloadResponse.headers['content-disposition'];
    let filename = `${pluginKey}.zip`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;\n]*?)['"]?$/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('文件下载完成:', filename);
    
  } catch (error) {
    console.error('下载失败:', error);
    // 不在这里显示错误提示，让调用方处理
    throw error;
  }
}

/**
 * 上传教学资源包（ZIP文件）
 * @param {File} file - 要上传的ZIP文件
 * @param {string} uploaderId - 上传者ID（用户业务唯一标识）
 * @returns {Promise} 上传结果
 */
export function uploadResourceZip(file, uploaderId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);
    
    return request({
    url: '/admin/plugins/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 上传文件分块
 * @param {Object} chunkInfo - 分块信息
 * @param {File} file - 分块文件
 * @returns {Promise} 上传结果
 */
export function uploadChunk(chunkInfo, file) {
  const formData = new FormData();
  formData.append('chunk', JSON.stringify(chunkInfo));
  formData.append('file', file);

  return request({
    url: '/admin/plugins/upload-chunk',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

/**
 * 合并文件分块
 * @param {string} fileId - 文件ID
 * @param {string} fileName - 文件名
 * @param {string} uploaderId - 上传者ID（用户业务唯一标识）
 * @returns {Promise} 合并结果
 */
export function mergeChunks(fileId, fileName, uploaderId) {
  return request({
    url: '/admin/plugins/merge-chunks',
    method: 'post',
    data: {
      fileId,
      fileName,
      uploaderId
    }
  });
}

/**
 * 获取上传进度
 * @param {string} fileId - 文件ID
 * @returns {Promise} 进度信息
 */
export function getUploadProgress(fileId) {
  return request({
    url: `/admin/plugins/upload-progress/${fileId}`,
    method: 'get'
  });
}

/**
 * 取消上传
 * @param {string} fileId - 文件ID
 * @returns {Promise} 取消结果
 */
export function cancelUpload(fileId) {
  return request({
    url: `/admin/plugins/upload-cancel/${fileId}`,
    method: 'delete'
  });
}

/**
 * 初始化插件
 * @param {number|string} id - 插件ID
 * @returns {Promise} 初始化结果
 */
export function initializePlugin(id) {
  return request({
    url: `/admin/plugins/${id}/initialize`,
    method: 'post'
  });
}

/**
 * 获取插件统计信息
 * @returns {Promise} 统计信息
 */
export function getPluginStatistics() {
  return request({
    url: '/admin/plugins/statistics',
    method: 'get'
  });
}

/**
 * 搜索插件
 * @param {string} keyword - 搜索关键词
 * @param {string} status - 插件状态（可选）
 * @returns {Promise} 搜索结果
 */
export function searchPlugins(keyword, status) {
  return request({
    url: '/admin/plugins/search',
    method: 'get',
    params: { keyword, status }
  });
}

/**
 * 获取当前启用的插件
 * @returns {Promise} 当前启用的插件信息
 */
export function getEnabledPlugin() {
  return request({
    url: '/admin/plugins/enabled',
    method: 'get'
  });
}

// ==================== 知识体系管理 API ====================

/**
 * 获取知识点列表（支持分页和查询条件）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 知识点列表数据
 */
export function getKnowledgeList(queryParams = {}) {
  return request({
    url: '/admin/ksknowledge/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 创建知识点
 * @param {Object} knowledge - 知识点信息
 * @returns {Promise} 创建结果
 */
export function createKnowledge(knowledge) {
  const uploadedBy = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('user_key') || '') : '';
  return request({
    url: '/admin/ksknowledge/add',
    method: 'post',
    data: { ...knowledge, uploadedBy }
  });
}

/**
 * 更新知识点
 * @param {string} knowledgeKey - 知识点标识
 * @param {Object} knowledge - 知识点信息
 * @returns {Promise} 更新结果
 */
export function updateKnowledge(knowledgeKey, knowledge) {
  return request({
    url: '/admin/ksknowledge/update',
    method: 'post',
    data: knowledge
  });
}

/**
 * 删除知识点
 * @param {string} knowledgeKey - 知识点标识
 * @returns {Promise} 删除结果
 */
export function deleteKnowledge(knowledgeKey) {
  return request({
    url: `/admin/ksknowledge/delete/${knowledgeKey}`,
    method: 'get'
  });
}

/**
 * 获取章节列表（支持分页和查询条件）
 * @param {Object} params - 查询参数
 * @returns {Promise} 章节列表
 */
export function getChapterList(params) {
  return request({
    url: '/admin/kschapter/list',
    method: 'post',
    data: params
  });
}

/**
 * 创建章节
 * @param {Object} chapter - 章节信息
 * @returns {Promise} 创建结果
 */
export function createChapter(chapter) {
  return request({
    url: '/admin/kschapter/add',
    method: 'post',
    data: chapter
  });
}

/**
 * 更新章节
 * @param {Object} chapter - 章节信息（包含id）
 * @returns {Promise} 更新结果
 */
export function updateChapter(chapter) {
  return request({
    url: '/admin/kschapter/update',
    method: 'post',
    data: chapter
  });
}

/**
 * 删除章节
 * @param {number} id - 章节ID
 * @returns {Promise} 删除结果
 */
export function deleteChapter(id) {
  return request({
    url: `/admin/kschapter/delete/${id}`,
    method: 'get'
  });
}

// ==================== 标签管理 API ====================

/**
 * 获取标签列表（支持分页和查询条件）
 * @param {Object} params - 查询参数
 * @returns {Promise} 标签列表
 */
export function getTagList(params) {
  return request({
    url: '/admin/kstag/list',
    method: 'post',
    data: params
  });
}

/**
 * 创建标签
 * @param {Object} tag - 标签信息
 * @returns {Promise} 创建结果
 */
export function createTag(tag) {
  return request({
    url: '/admin/kstag/add',
    method: 'post',
    data: tag
  });
}

/**
 * 更新标签
 * @param {Object} tag - 标签信息（包含id）
 * @returns {Promise} 更新结果
 */
export function updateTag(tag) {
  return request({
    url: '/admin/kstag/update',
    method: 'post',
    data: tag
  });
}

/**
 * 删除标签
 * @param {number} id - 标签ID
 * @returns {Promise} 删除结果
 */
export function deleteTag(id) {
  return request({
    url: `/admin/kstag/delete/${id}`,
    method: 'get'
  });
}

/**
 * 获取习题列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 习题列表
 */
export function getItemList(params = {}) {
  return request({
    url: '/admin/laitem/list',
    method: 'post',
    data: params
  });
}

/**
 * 创建习题
 * @param {Object} item - 习题信息
 * @returns {Promise} 创建结果
 */
export function createItem(item) {
  return request({
    url: '/admin/laitem/add',
    method: 'post',
    data: item
  });
}

/**
 * 更新习题
 * @param {Object} item - 习题信息
 * @returns {Promise} 更新结果
 */
export function updateItem(item) {
  return request({
    url: '/admin/laitem/update',
    method: 'post',
    data: item
  });
}

/**
 * 更新习题状态
 * @param {Object} params - 状态更新参数
 * @returns {Promise} 更新结果
 */
export function updateItemStatus(params) {
  return request({
    url: '/admin/laitem/updateStatus',
    method: 'post',
    data: params
  });
}

/**
 * 删除习题
 * @param {number} id - 习题ID
 * @returns {Promise} 删除结果
 */
export function deleteItem(id) {
  return request({
    url: `/admin/laitem/delete/${id}`,
    method: 'get'
  });
}

/**
 * 获取媒体资源列表
 * @param {string} pluginKey - 插件标识（可选）
 * @param {string} assetType - 媒体类型（可选）
 * @param {string} status - 状态（可选）
 * @returns {Promise} 媒体资源列表
 */
export function getMediaList(pluginKey, assetType, status) {
  return request({
    url: '/admin/media',
    method: 'get',
    params: { pluginKey, assetType, status }
  });
}

/**
 * 创建媒体资源
 * @param {Object} media - 媒体资源信息
 * @returns {Promise} 创建结果
 */
export function createMedia(media) {
  return request({
    url: '/admin/media',
    method: 'post',
    data: media
  });
}

/**
 * 更新媒体资源
 * @param {string} mediaKey - 媒体资源标识
 * @param {Object} media - 媒体资源信息
 * @returns {Promise} 更新结果
 */
export function updateMedia(mediaKey, media) {
  return request({
    url: `/admin/media/${mediaKey}`,
    method: 'put',
    data: media
  });
}

/**
 * 删除媒体资源
 * @param {string} mediaKey - 媒体资源标识
 * @returns {Promise} 删除结果
 */
export function deleteMedia(mediaKey) {
  return request({
    url: `/admin/media/${mediaKey}`,
    method: 'delete'
  });
}

/**
 * 上传媒体文件
 * @param {File} file - 媒体文件
 * @param {string} assetType - 媒体类型
 * @returns {Promise} 上传结果
 */
export function uploadMediaFile(file, assetType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('assetType', assetType);
  
  return request({
    url: '/admin/media/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// ==================== 学习活动管理 - 视频管理 API ====================

/**
 * 获取视频列表（支持分页和查询条件）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 视频列表数据
 */
export function getVideoList(queryParams = {}) {
  return request({
    url: '/admin/lamedia/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 创建视频
 * @param {Object} video - 视频信息
 * @returns {Promise} 创建结果
 */
export function createVideo(video) {
  return request({
    url: '/admin/lamedia/add',
    method: 'post',
    data: video,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 更新视频
 * @param {Object} video - 视频信息
 * @returns {Promise} 更新结果
 */
export function updateVideo(video) {
  return request({
    url: '/admin/lamedia/update',
    method: 'post',
    data: video,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 更新视频状态
 * @param {number} id - 视频ID
 * @param {string} status - 视频状态
 * @returns {Promise} 更新结果
 */
export function updateVideoStatus(id, status, reviewerKey) {
  const formData = new FormData();
  formData.append('id', id);
  formData.append('status', status);
  if (reviewerKey) {
    formData.append('reviewerKey', reviewerKey);
  }
  
  return request({
    url: '/admin/lamedia/updateStatus',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 删除视频
 * @param {number} id - 视频ID
 * @returns {Promise} 删除结果
 */
export function deleteVideo(id) {
  return request({
    url: `/admin/lamedia/delete/${id}`,
    method: 'get'
  });
}

/**
 * 获取章节列表（用于视频关联）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 章节列表数据
 */
export function getChapterListForVideo(queryParams = {}) {
  return request({
    url: '/admin/kschapter/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 获取知识点列表（用于视频关联）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 知识点列表数据
 */
export function getKnowledgeListForVideo(queryParams = {}) {
  return request({
    url: '/admin/ksknowledge/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 获取标签列表（用于视频关联）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Promise} 标签列表数据
 */
export function getTagListForVideo(queryParams = {}) {
  return request({
    url: '/admin/kstag/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 上传图片
 * @param {FormData} formData - 包含图片文件的FormData
 * @returns {Promise} 上传结果，返回markdown格式的图片URL
 */
export function uploadImage(formData) {
  return request({
    url: '/admin/laitem/upload-image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// ==================== 资源类型管理 API ====================

/**
 * 获取资源类型列表（支持分页和查询条件）
 * @param {Object} params - 查询参数
 * @returns {Promise} 资源类型列表
 */
export function getResourceFormList(params) {
  return request({
    url: '/admin/ksresourceform/list',
    method: 'post',
    data: params
  });
}

/**
 * 创建资源类型
 * @param {Object} resourceForm - 资源类型信息
 * @returns {Promise} 创建结果
 */
export function createResourceForm(resourceForm) {
  return request({
    url: '/admin/ksresourceform/add',
    method: 'post',
    data: resourceForm
  });
}

/**
 * 更新资源类型
 * @param {Object} resourceForm - 资源类型信息（包含id）
 * @returns {Promise} 更新结果
 */
export function updateResourceForm(resourceForm) {
  return request({
    url: '/admin/ksresourceform/update',
    method: 'post',
    data: resourceForm
  });
}

/**
 * 删除资源类型
 * @param {number} id - 资源类型ID
 * @returns {Promise} 删除结果
 */
export function deleteResourceForm(id) {
  return request({
    url: `/admin/ksresourceform/delete/${id}`,
    method: 'get'
  });
}
