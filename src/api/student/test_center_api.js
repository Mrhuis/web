import request from '@/utils/request'

/**
 * 学生测验中心API接口
 */
export const testCenterApi = {
  /**
   * 根据学生userKey查询该学生所属班级的试卷分配信息
   * @param {string} userKey - 学生userKey
   * @returns {Promise} 试卷分配信息列表
   */
  getExamPapersByStudentUserKey(userKey) {
    return request({
      url: '/student/test-center-do/exam-papers',
      method: 'get',
      params: { userKey }
    })
  },

  /**
   * 根据试卷ID查询试卷中的所有题目
   * @param {number} paperId - 试卷ID
   * @returns {Promise} 题目列表
   */
  getQuestionsByPaperId(paperId) {
    return request({
      url: '/student/test-center-do/exam-paper-questions',
      method: 'get',
      params: { paperId }
    })
  },

  /**
   * 根据item_key查询题目数据
   * @param {string} itemKey - 习题标识
   * @returns {Promise} 题目数据
   */
  getItemByItemKey(itemKey) {
    return request({
      url: `/student/test-center-do/item/${itemKey}`,
      method: 'get'
    })
  },

  /**
   * 根据user_key、paper_id、item_key查询对应答案
   * @param {Object} params - 查询参数
   * @param {string} params.userKey - 用户标识
   * @param {number} params.paperId - 试卷ID
   * @param {string} params.itemKey - 习题标识
   * @returns {Promise} 学生答案对象
   */
  getAnswerByUserKeyPaperIdItemKey(params) {
    return request({
      url: '/student/test-center-do/answer',
      method: 'get',
      params
    })
  },

  /**
   * 保存或更新答案
   * @param {Object} data - 保存答案的数据
   * @param {string} data.userKey - 用户标识
   * @param {number} data.paperId - 试卷ID
   * @param {string} data.itemKey - 习题标识
   * @param {string} data.answer - 答案
   * @param {number} data.score - 分数（可选）
   * @returns {Promise} 保存后的学生答案对象
   */
  saveOrUpdateAnswer(data) {
    return request({
      url: '/student/test-center-do/answer',
      method: 'post',
      data
    })
  },

  /**
   * 完成考试接口，将指定用户和试卷的所有答题记录标记为已完成
   * @param {string} userKey - 用户标识
   * @param {number} paperId - 试卷ID
   * @returns {Promise} 操作结果
   */
  completeExam(userKey, paperId) {
    return request({
      url: '/student/test-center-do/complete-exam',
      method: 'post',
      params: { userKey, paperId }
    })
  },

  /**
   * 检查考试是否已完成
   * @param {string} userKey - 用户标识
   * @param {number} paperId - 试卷ID
   * @returns {Promise} 考试完成状态
   */
  checkExamCompleted(userKey, paperId) {
    return request({
      url: '/student/test-center-do/check-exam-completed',
      method: 'get',
      params: { userKey, paperId }
    })
  },

  /**
   * 检查试卷是否被回收
   * @param {string} userKey - 用户标识
   * @param {number} paperId - 试卷ID
   * @returns {Promise} 是否已回收（true-已回收，false-未回收）
   */
  checkPaperRecycled(userKey, paperId) {
    return request({
      url: '/student/test-center-do/check-paper-recycled',
      method: 'get',
      params: { userKey, paperId }
    })
  }
}

