import request from '@/utils/request';

export function getTeacherProfile(userKey) {
  return request({
    url: '/admin/user/detail-by-key',
    method: 'get',
    params: { userKey }
  });
}

export function updateTeacherProfile(data) {
  return request({
    url: '/admin/user/update',
    method: 'post',
    data
  });
}


