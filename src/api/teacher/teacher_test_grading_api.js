import request from '@/utils/request'

/**
 * 教师端测验批阅相关接口
 */
export function getGradingClasses(paperId) {
  return request({
    url: '/teacher/test-grading/classes',
    method: 'get',
    params: { paperId }
  })
}

export function getGradingStudents(classKey) {
  return request({
    url: '/teacher/test-grading/students',
    method: 'get',
    params: { classKey }
  })
}

export function getGradingQuestions(paperId) {
  return request({
    url: '/teacher/test-grading/exam-paper-questions',
    method: 'get',
    params: { paperId }
  })
}

export function getStudentAnswerDetail(params) {
  return request({
    url: '/teacher/test-grading/answer',
    method: 'get',
    params
  })
}

export function setStudentAnswerScore(data) {
  return request({
    url: '/teacher/test-grading/set-score',
    method: 'post',
    params: data
  })
}

