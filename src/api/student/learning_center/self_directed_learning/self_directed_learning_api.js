import request from '@/utils/request';

/**
 * 获取自主学习习题列表
 * @param {Object} data - 查询参数
 * @param {Number} data.pageIndex - 当前页数
 * @param {Number} data.pageSize - 每页数量
 * @param {String} data.itemKey - 习题标识（可选）
 * @param {String} data.formKey - 习题类型（可选）
 * @param {Number} data.difficulty - 难度（可选）
 * @param {String} data.content - 题干内容（可选，用于搜索）
 * @param {String} data.status - 状态（可选）
 * @param {String} data.mediaKey - 媒体标识（可选）
 * @param {String} data.fileName - 文件名（可选，用于搜索）
 * @param {Array<String>} data.chapterKey - 章节筛选（可选）
 * @param {Array<String>} data.knowledgeKey - 知识点筛选（可选）
 * @param {Array<Number>} data.tagId - 标签筛选（可选）
 * @returns {Promise}
 */
export function getItemsList(data) {
  return request({
    url: '/student/autoAomous/itemsList',
    method: 'post',
    data
  });
}

/**
 * 获取自主学习视频列表
 * @param {Object} data - 查询参数
 * @param {Number} data.pageIndex - 当前页数
 * @param {Number} data.pageSize - 每页数量
 * @param {String} data.itemKey - 习题标识（可选）
 * @param {String} data.formKey - 习题类型（可选）
 * @param {Number} data.difficulty - 难度（可选）
 * @param {String} data.content - 题干内容（可选，用于搜索）
 * @param {String} data.status - 状态（可选）
 * @param {String} data.mediaKey - 媒体标识（可选）
 * @param {String} data.fileName - 文件名（可选，用于搜索）
 * @param {Array<String>} data.chapterKey - 章节筛选（可选）
 * @param {Array<String>} data.knowledgeKey - 知识点筛选（可选）
 * @param {Array<Number>} data.tagId - 标签筛选（可选）
 * @returns {Promise}
 */
export function getVideosList(data) {
  return request({
    url: '/student/autoAomous/videosList',
    method: 'post',
    data
  });
}

/**
 * 记录用户学习行为（自主学习）
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
    url: '/student/autoAomous/recode',
    method: 'post',
    data
  });
}

/**
 * 记录卡片点击事件（自主学习）
 * @param {String} userKey - 用户标识
 * @param {String} formKey - 资源类型键
 * @returns {Promise}
 */
export function recodeClick(userKey, formKey) {
  return request({
    url: '/student/autoAomous/recodeclick',
    method: 'post',
    params: { userKey, formKey }
  });
}
