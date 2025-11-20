import request from '@/utils/request'

/**
 * 学生测验结果相关接口
 */
export const testCenterResultApi = {
  /**
   * 分页查询已完成试卷
   * @param {Object} params
   * @param {string} params.userKey
   * @param {number} params.page
   * @param {number} params.size
   * @returns {Promise}
   */
  getCompletedPapers(params) {
    return request({
      url: '/student/test-center-result/completed-papers/page',
      method: 'get',
      params
    })
  },

  /**
   * 查询单份试卷的汇总信息
   * @param {Object} params
   * @param {string} params.userKey
   * @param {number} params.paperId
   * @returns {Promise}
   */
  getCompletedPaperSummary(params) {
    return request({
      url: '/student/test-center-result/completed-papers/summary',
      method: 'get',
      params
    })
  },

  /**
   * 查询试卷题目列表
   * @param {number} paperId
   * @returns {Promise}
   */
  getQuestionsByPaperId(paperId) {
    return request({
      url: '/student/test-center-result/exam-paper-questions',
      method: 'get',
      params: { paperId }
    })
  },

  /**
   * 查询题目详情
   * @param {string} itemKey
   * @returns {Promise}
   */
  getItemByItemKey(itemKey) {
    return request({
      url: `/student/test-center-result/item/${itemKey}`,
      method: 'get'
    })
  },

  /**
   * 查询学生答案详情
   * @param {Object} params
   * @param {string} params.userKey
   * @param {number} params.paperId
   * @param {string} params.itemKey
   * @returns {Promise}
   */
  getAnswerDetail(params) {
    return request({
      url: '/student/test-center-result/answer',
      method: 'get',
      params
    })
  },

  /**
   * 检查试卷是否已评分
   * @param {Object} params
   * @param {string} params.userKey
   * @param {number} params.paperId
   * @returns {Promise}
   */
  checkPaperGraded(params) {
    return request({
      url: '/student/test-center-result/check-graded',
      method: 'get',
      params
    })
  }
}

