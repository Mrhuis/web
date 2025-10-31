import request from '@/utils/request';

/**
 * 记录用户学习行为
 * @param {Object} data - 用户行为数据
 * @param {String} data.userKey - 用户标识
 * @param {String} data.formKey - 资源类型键
 * @param {String} data.resourceKey - 资源标识
 * @param {Boolean} data.isComplete - 是否完成
 * @param {Boolean} data.isCorrect - 是否正确
 * @param {Boolean} data.isViewAnalysis - 是否查看解析
 * @param {Number} data.watchRate - 视频观看率（0-1）
 * @param {Boolean} data.isPause - 是否暂停
 * @param {Boolean} data.isReplay - 是否重复观看
 * @param {String} data.interactionTime - 交互时间（格式：yyyy-MM-dd HH:mm:ss）
 * @returns {Promise}
 */
export function recodeUserBehavior(data) {
  return request({
    url: '/student/recommend/recode',
    method: 'post',
    data
  });
}

/**
 * 允许重复使用今日推荐资源
 * @param {String} userKey - 用户标识
 * @returns {Promise}
 */
export function reuseRecommend(userKey) {
  return request({
    url: '/student/recommend/reuse',
    method: 'post',
    params: { userKey }
  });
}

/**
 * 记录卡片点击事件
 * @param {String} userKey - 用户标识
 * @param {String} formKey - 资源类型键
 * @returns {Promise}
 */
export function recodeClick(userKey, formKey) {
  return request({
    url: '/student/recommend/recodeclick',
    method: 'post',
    params: { userKey, formKey }
  });
}
