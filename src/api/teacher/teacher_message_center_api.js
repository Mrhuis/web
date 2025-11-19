import request from '@/utils/request';

/**
 * 获取当前教师相关的消息列表
 * @param {Object} params
 * @param {string} params.userKey - 当前教师的用户Key
 * @param {number} [params.page_index=1]
 * @param {number} [params.page_size=200]
 * @returns {Promise<Result<QueryListVo<Message>>>}
 */
export function getTeacherMessageList(params) {
  return request({
    url: '/teacher/message/list',
    method: 'post',
    data: params
  });
}

/**
 * 发送消息
 * @param {Object} payload
 * @param {number|null} payload.convId
 * @param {string} payload.senderKey
 * @param {string} payload.receiverKey
 * @param {string} payload.content
 * @param {string|null} payload.attachUrl
 * @param {number} payload.msgType
 * @param {string} payload.sendTime
 * @returns {Promise<Result>}
 */
export function sendTeacherMessage(payload) {
  return request({
    url: '/teacher/message/add',
    method: 'post',
    data: payload
  });
}

/**
 * 撤回消息
 * @param {{ id: number, userKey: string }} payload
 */
export function revokeTeacherMessage(payload) {
  return request({
    url: '/teacher/message/revoke',
    method: 'post',
    data: payload
  });
}

/**
 * 删除消息
 * @param {{ id: number, userKey: string }} payload
 */
export function deleteTeacherMessage(payload) {
  return request({
    url: '/teacher/message/delete',
    method: 'post',
    data: payload
  });
}

/**
 * 标记会话消息为已读
 * @param {{ convId: number, userKey: string }} payload
 */
export function markTeacherMessagesAsRead(payload) {
  return request({
    url: '/teacher/message/mark-as-read',
    method: 'post',
    data: payload
  });
}

