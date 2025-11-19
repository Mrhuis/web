import request from '@/utils/request';

/**
 * 获取班级列表（支持分页和查询条件）
 * @param {Object} params
 * @param {number} [params.pageIndex=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @param {string} [params.classKey] - 班级业务唯一标识
 * @param {string} [params.name] - 班级名称
 * @returns {Promise<Result<QueryListVo<Class>>>}
 */
export function getClassList(params) {
  return request({
    url: '/teacher/class/list',
    method: 'post',
    data: params
  });
}

/**
 * 添加班级
 * @param {Object} payload
 * @param {string} payload.classKey - 班级业务唯一标识（如C2024_01）
 * @param {string} payload.name - 班级名称（如"高一（3）班"）
 * @param {string} payload.inviteCode - 班级加入邀请码（唯一）
 * @returns {Promise<Result>}
 */
export function addClass(payload) {
  return request({
    url: '/teacher/class/add',
    method: 'post',
    data: payload
  });
}

/**
 * 更新班级
 * @param {Object} payload
 * @param {number} payload.id - 数据库自增ID
 * @param {string} payload.classKey - 班级业务唯一标识
 * @param {string} payload.name - 班级名称
 * @param {string} payload.inviteCode - 班级加入邀请码
 * @returns {Promise<Result>}
 */
export function updateClass(payload) {
  return request({
    url: '/teacher/class/update',
    method: 'post',
    data: payload
  });
}

/**
 * 删除班级
 * @param {number} id - 班级ID
 * @returns {Promise<Result>}
 */
export function deleteClass(id) {
  return request({
    url: `/teacher/class/delete/${id}`,
    method: 'post'
  });
}

/**
 * 获取班级详情
 * @param {number} id - 班级ID
 * @returns {Promise<Result<Class>>}
 */
export function getClassDetail(id) {
  return request({
    url: `/teacher/class/detail/${id}`,
    method: 'get'
  });
}

/**
 * 获取班级学生关系列表（支持分页和查询条件）
 * @param {Object} params
 * @param {number} [params.pageIndex=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @param {string} [params.classKey] - 关联班级（classes.class_key）
 * @param {string} [params.userKey] - 关联学生（users.user_key）
 * @param {string} [params.status] - 加入状态：已加入/待审核
 * @returns {Promise<Result<QueryListVo<ClassStudentEnrollment>>>}
 */
export function getClassStudentEnrollmentList(params) {
  return request({
    url: '/teacher/class-student-enrollment/list',
    method: 'post',
    data: params
  });
}

/**
 * 添加班级学生关系
 * @param {Object} payload
 * @param {string} payload.classKey - 关联班级（classes.class_key）
 * @param {string} payload.userKey - 关联学生（users.user_key）
 * @param {string} payload.status - 加入状态：已加入/待审核
 * @returns {Promise<Result>}
 */
export function addClassStudentEnrollment(payload) {
  return request({
    url: '/teacher/class-student-enrollment/add',
    method: 'post',
    data: payload
  });
}

/**
 * 更新班级学生关系
 * @param {Object} payload
 * @param {number} payload.id - 数据库自增ID
 * @param {string} payload.classKey - 关联班级
 * @param {string} payload.userKey - 关联学生
 * @param {string} payload.status - 加入状态
 * @returns {Promise<Result>}
 */
export function updateClassStudentEnrollment(payload) {
  return request({
    url: '/teacher/class-student-enrollment/update',
    method: 'post',
    data: payload
  });
}

/**
 * 删除班级学生关系
 * @param {number} id - 班级学生关系ID
 * @returns {Promise<Result>}
 */
export function deleteClassStudentEnrollment(id) {
  return request({
    url: `/teacher/class-student-enrollment/delete/${id}`,
    method: 'post'
  });
}

/**
 * 获取班级学生关系详情
 * @param {number} id - 班级学生关系ID
 * @returns {Promise<Result<ClassStudentEnrollment>>}
 */
export function getClassStudentEnrollmentDetail(id) {
  return request({
    url: `/teacher/class-student-enrollment/detail/${id}`,
    method: 'get'
  });
}

