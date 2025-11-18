import request from '@/utils/request';

/**
 * 上传消息图片
 * @param {FormData} formData - 包含图片文件的FormData
 * @returns {Promise} 上传结果，返回图片URL
 */
export function uploadMessageImage(formData) {
  return request({
    url: '/admin/message/upload-image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

