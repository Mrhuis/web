import request from '@/utils/request';

/**
 * 获取学生所属班级列表
 * @param {string} userKey - 学生userKey
 * @returns {Promise}
 */
export function getStudentClasses(userKey) {
  return request({
    url: '/teacher/class-student-enrollment/list',
    method: 'post',
    data: {
      userKey: userKey,
      status: 1, // 只查询已加入的班级
      pageIndex: 1,
      pageSize: 100
    }
  });
}

/**
 * 获取班级详情
 * @param {string} classKey - 班级标识
 * @returns {Promise}
 */
export function getClassInfoByKey(classKey) {
  return request({
    url: '/teacher/class/list',
    method: 'post',
    data: {
      classKey: classKey,
      pageIndex: 1,
      pageSize: 1
    }
  });
}

/**
 * 获取班级学生列表
 * @param {string} classKey - 班级标识
 * @returns {Promise}
 */
export function getClassStudents(classKey) {
  return request({
    url: '/teacher/class-student-enrollment/list',
    method: 'post',
    data: {
      classKey: classKey,
      status: 1, // 只查询已加入的学生
      pageIndex: 1,
      pageSize: 100
    }
  });
}

/**
 * 学生通过邀请码加入班级
 * @param {string} inviteCode - 邀请码
 * @param {string} userKey - 学生userKey
 * @returns {Promise}
 */
export function joinClassByInviteCode(inviteCode, userKey) {
  return request({
    url: '/student/class/join',
    method: 'post',
    data: {
      inviteCode: inviteCode,
      userKey: userKey
    }
  });
}

/**
 * 学生退出班级
 * @param {string} classKey - 班级标识
 * @param {string} userKey - 学生userKey
 * @returns {Promise}
 */
export function leaveClass(classKey, userKey) {
  return request({
    url: '/student/class/leave',
    method: 'post',
    data: {
      classKey,
      userKey
    }
  });
}

