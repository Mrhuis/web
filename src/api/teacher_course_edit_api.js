import request from '@/utils/request'; // 假设这里会使用axios的request实例

// 如果有fetch的request辅助函数，可以放在这里
const API_BASE_URL = 'http://localhost:8080/api/teacher';

/**
 * 统一处理API请求的函数 (如果使用fetch)
 * @param {string} url - 请求的URL路径
 * @param {object} options - fetch的配置选项
 * @returns {Promise<any>} 解析后的JSON数据
 */
async function fetchRequest(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    // DELETE请求成功时，状态码为204 No Content，没有响应体
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

/**
 * 上传教学资源ZIP包
 * @param {File} file - ZIP文件
 * @param {string} uploaderId - 上传者ID（用户业务唯一标识）
 * @param {Function} onProgress - 进度回调函数 (可选)
 * @returns {Promise<any>}
 */
export async function uploadResourceZip(file, uploaderId, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);

    const url = `${API_BASE_URL}/course-management/upload-zip`;
    
    // 使用XMLHttpRequest来支持进度监控
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 设置超时时间 (5分钟)
        xhr.timeout = 300000;
        
        // 进度监控
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete, event.loaded, event.total);
                }
            });
        }
        
        // 请求完成
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    // 尝试解析JSON响应
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    // 如果不是JSON，返回原始文本
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    // 尝试解析错误响应
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject(new Error(errorResponse.message || `HTTP error! status: ${xhr.status}`));
                } catch (e) {
                    reject(new Error(`HTTP error! status: ${xhr.status}, body: ${xhr.responseText}`));
                }
            }
        });
        
        // 请求错误
        xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred during upload'));
        });
        
        // 请求超时
        xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timeout - the request took too long to complete'));
        });
        
        // 发送请求
        xhr.open('POST', url);
        xhr.send(formData);
    });
}
