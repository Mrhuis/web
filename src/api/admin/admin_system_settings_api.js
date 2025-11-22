import request from '@/utils/request';
import axios from 'axios';
import JSONBig from 'json-bigint';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

const jsonBig = JSONBig({
  storeAsString: true,
  strict: true
});

// 创建专门用于流水线执行的axios实例，设置更长的超时时间（40分钟）
const pipelineRequest = axios.create({
  baseURL: '/api',
  timeout: 40 * 60 * 1000, // 40分钟超时，足够等待流水线任务完成
  transformResponse: [
    (data) => {
      if (!data) {
        return data;
      }
      try {
        return jsonBig.parse(data);
      } catch (error) {
        return data;
      }
    }
  ]
});

// 添加请求拦截器
pipelineRequest.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    if (userStore.id) {
      // 可以在这里添加认证信息等
    }
    return config;
  },
  error => {
    console.log(error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
pipelineRequest.interceptors.response.use(
  response => {
    const res = response.data;
    
    if (res.success === false) {
      // 对于业务逻辑错误（如409冲突），不在这里显示错误消息
      // 让调用方自己处理，以便显示更友好的提示
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res;
    }
  },
  error => {
    console.log('err' + error);
    
    // 尝试从响应中提取错误消息
    let errorMessage = error.message || '未知错误';
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.message) {
            errorMessage = parsed.message;
          }
        } catch (e) {
          // 如果解析失败，使用原始消息
        }
      }
    }
    
    // 对于HTTP错误，不在这里显示消息，让调用方处理
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * 获取系统配置
 * @returns {Promise} 配置项数据
 */
export function getSystemConfig() {
  return request({
    url: '/admin/system/config',
    method: 'get'
  });
}

/**
 * 更新系统配置
 * @param {Object} updateConfig - 待更新的配置项
 * @returns {Promise} 更新结果
 */
export function updateSystemConfig(updateConfig) {
  return request({
    url: '/admin/system/config',
    method: 'put',
    data: updateConfig
  });
}

/**
 * 导出系统配置
 * @returns {Promise} 导出的配置项
 */
export function exportSystemConfig() {
  return request({
    url: '/admin/system/config/export',
    method: 'get'
  });
}

/**
 * 导入系统配置
 * @param {Object} importConfig - 待导入的配置项
 * @returns {Promise} 导入结果
 */
export function importSystemConfig(importConfig) {
  return request({
    url: '/admin/system/config/import',
    method: 'post',
    data: importConfig
  });
}

/**
 * 获取模型文件列表
 * @returns {Promise} 模型文件列表
 */
export function getModelList() {
  return request({
    url: '/admin/system/config/models',
    method: 'get'
  });
}

/**
 * 立即执行推荐系统流水线任务
 * 使用专门的请求实例，设置40分钟超时时间
 * @returns {Promise} 执行结果
 */
export function runPipeline() {
  return pipelineRequest({
    url: '/admin/system/config/run-pipeline',
    method: 'post'
  });
}

