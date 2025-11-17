import request from '@/utils/request';

// 获取用户列表（分页）
export function getUserList(params = {}) {
  return request({
    url: '/admin/user/list',
    method: 'post',
    data: params,
  });
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/admin/user/add',
    method: 'post',
    data,
  });
}

// 更新用户
export function updateUser(data) {
  return request({
    url: '/admin/user/update',
    method: 'post',
    data,
  });
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/admin/user/delete/${id}`,
    method: 'get',
  });
}

// 获取用户详情
export function getUserDetail(id) {
  return request({
    url: `/admin/user/detail/${id}`,
    method: 'get',
  });
}


