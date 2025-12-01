import request from '@/utils/request';

/**
 * 获取试卷列表（支持分页和查询条件）
 * @param {Object} queryParams - 查询参数对象
 * @param {number} queryParams.pageIndex - 页码
 * @param {number} queryParams.pageSize - 每页数量
 * @param {string} queryParams.paperName - 试卷名称（模糊查询）
 * @param {string} queryParams.subject - 科目
 * @param {number} queryParams.difficulty - 难度等级
 * @param {number} queryParams.isEnabled - 是否启用
 * @param {string} queryParams.creatorKey - 创建者标识（创建试卷的教师user_key）
 * @returns {Promise} 试卷列表数据
 */
export function getExamPaperList(queryParams = {}) {
  return request({
    url: '/teacher/test/paper/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 添加试卷
 * @param {Object} paperData - 试卷信息
 * @param {string} paperData.paperName - 试卷名称
 * @param {string} paperData.subject - 科目
 * @param {number} paperData.difficulty - 难度等级（1-简单，2-中等，3-困难）
 * @param {number} paperData.totalScore - 试卷总分
 * @param {number} paperData.timeLimit - 考试时长（分钟）
 * @param {string} paperData.creatorKey - 创建者标识（创建试卷的教师user_key）
 * @returns {Promise} 添加结果
 */
export function addExamPaper(paperData) {
  return request({
    url: '/teacher/test/paper/add',
    method: 'post',
    data: paperData
  });
}

/**
 * 更新试卷
 * @param {Object} paperData - 试卷信息
 * @param {number} paperData.id - 试卷ID
 * @param {string} paperData.paperName - 试卷名称
 * @param {string} paperData.subject - 科目
 * @param {number} paperData.difficulty - 难度等级
 * @param {number} paperData.totalScore - 试卷总分
 * @param {number} paperData.timeLimit - 考试时长（分钟）
 * @param {number} paperData.isEnabled - 是否启用（1-启用，0-禁用）
 * @returns {Promise} 更新结果
 */
export function updateExamPaper(paperData) {
  return request({
    url: '/teacher/test/paper/update',
    method: 'post',
    data: paperData
  });
}

/**
 * 删除试卷
 * @param {number|string} id - 试卷ID
 * @returns {Promise} 删除结果
 */
export function deleteExamPaper(id) {
  return request({
    url: `/teacher/test/paper/delete/${id}`,
    method: 'get'
  });
}

/**
 * 获取试卷详情
 * @param {number|string} id - 试卷ID
 * @returns {Promise} 试卷详情
 */
export function getExamPaperDetail(id) {
  return request({
    url: `/teacher/test/paper/detail/${id}`,
    method: 'get'
  });
}

/**
 * 获取试卷题目列表（支持分页和查询条件）
 * @param {Object} queryParams - 查询参数对象
 * @param {number} queryParams.pageIndex - 页码
 * @param {number} queryParams.pageSize - 每页数量
 * @param {number} queryParams.paperId - 试卷ID
 * @param {string} queryParams.itemKey - 题目标识
 * @returns {Promise} 题目列表数据
 */
export function getExamPaperQuestionList(queryParams = {}) {
  return request({
    url: '/teacher/test/question/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 添加试卷题目
 * @param {Object} questionData - 题目信息
 * @param {number} questionData.paperId - 试卷ID
 * @param {string} questionData.itemKey - 题目标识
 * @param {number} questionData.sortNum - 题目顺序
 * @param {number} questionData.actualScore - 实际分值
 * @returns {Promise} 添加结果
 */
export function addExamPaperQuestion(questionData) {
  return request({
    url: '/teacher/test/question/add',
    method: 'post',
    data: questionData
  });
}

/**
 * 更新试卷题目
 * @param {Object} questionData - 题目信息
 * @param {number} questionData.id - 关联ID
 * @param {number} questionData.paperId - 试卷ID
 * @param {string} questionData.itemKey - 题目标识
 * @param {number} questionData.sortNum - 题目顺序
 * @param {number} questionData.actualScore - 实际分值
 * @returns {Promise} 更新结果
 */
export function updateExamPaperQuestion(questionData) {
  return request({
    url: '/teacher/test/question/update',
    method: 'post',
    data: questionData
  });
}

/**
 * 删除试卷题目
 * @param {number|string} id - 关联ID
 * @returns {Promise} 删除结果
 */
export function deleteExamPaperQuestion(id) {
  return request({
    url: `/teacher/test/question/delete/${id}`,
    method: 'get'
  });
}

/**
 * 获取试卷题目详情
 * @param {number|string} id - 关联ID
 * @returns {Promise} 题目详情
 */
export function getExamPaperQuestionDetail(id) {
  return request({
    url: `/teacher/test/question/detail/${id}`,
    method: 'get'
  });
}

/**
 * 获取试卷下发（发布）列表
 * @param {Object} queryParams
 * @returns {Promise}
 */
export function getExamPaperDistributionList(queryParams = {}) {
  return request({
    url: '/teacher/test/distribution/list',
    method: 'post',
    data: queryParams
  });
}

/**
 * 添加试卷下发（发布）
 * @param {Object} payload
 * @returns {Promise}
 */
export function addExamPaperDistribution(payload) {
  return request({
    url: '/teacher/test/distribution/add',
    method: 'post',
    data: payload
  });
}

/**
 * 更新试卷下发（发布）
 * @param {Object} payload
 * @returns {Promise}
 */
export function updateExamPaperDistribution(payload) {
  return request({
    url: '/teacher/test/distribution/update',
    method: 'post',
    data: payload
  });
}

/**
 * 删除试卷下发记录
 * @param {number|string} id
 * @returns {Promise}
 */
export function deleteExamPaperDistribution(id) {
  return request({
    url: `/teacher/test/distribution/delete/${id}`,
    method: 'post'
  });
}

/**
 * 获取试卷下发详情
 * @param {number|string} id
 * @returns {Promise}
 */
export function getExamPaperDistributionDetail(id) {
  return request({
    url: `/teacher/test/distribution/detail/${id}`,
    method: 'get'
  });
}

/**
 * 回收试卷下发
 * @param {Object} payload
 * @returns {Promise}
 */
export function recycleExamPaperDistribution(payload) {
  return request({
    url: '/teacher/test/distribution/recycle',
    method: 'post',
    data: payload
  });
}

/**
 * 获取题目列表（用于选择题目）
 * @param {Object} queryParams - 查询参数对象
 * @param {number} queryParams.pageIndex - 页码
 * @param {number} queryParams.pageSize - 每页数量
 * @param {string} queryParams.itemKey - 题目标识（模糊查询）
 * @param {string} queryParams.formKey - 题目类型
 * @param {number} queryParams.difficulty - 难度
 * @param {string} queryParams.content - 题干内容（模糊查询）
 * @param {string} queryParams.status - 状态
 * @returns {Promise} 题目列表数据
 */
export function getItemList(queryParams = {}) {
  return request({
    url: '/admin/laitem/list',
    method: 'post',
    data: queryParams
  });
}

