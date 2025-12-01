import request from '@/utils/request';

// ==================== 知识点管理 ====================
export function getTeacherKnowledgeList(params = {}) {
  return request({
    url: '/teacher/ksknowledge/list',
    method: 'post',
    data: params
  });
}

export function createTeacherKnowledge(data) {
  return request({
    url: '/teacher/ksknowledge/add',
    method: 'post',
    data
  });
}

export function deleteTeacherKnowledge(id) {
  return request({
    url: `/teacher/ksknowledge/delete/${id}`,
    method: 'get'
  });
}

// ==================== 章节管理 ====================
export function getTeacherChapterList(params = {}) {
  return request({
    url: '/teacher/kschapter/list',
    method: 'post',
    data: params
  });
}

export function createTeacherChapter(data) {
  return request({
    url: '/teacher/kschapter/add',
    method: 'post',
    data
  });
}

export function deleteTeacherChapter(id) {
  return request({
    url: `/teacher/kschapter/delete/${id}`,
    method: 'get'
  });
}

// ==================== 标签管理 ====================
export function getTeacherTagList(params = {}) {
  return request({
    url: '/teacher/kstag/list',
    method: 'post',
    data: params
  });
}

export function createTeacherTag(data) {
  return request({
    url: '/teacher/kstag/add',
    method: 'post',
    data
  });
}

export function deleteTeacherTag(id) {
  return request({
    url: `/teacher/kstag/delete/${id}`,
    method: 'get'
  });
}

// ==================== 资源形式管理 ====================
export function getTeacherResourceFormList(params = {}) {
  return request({
    url: '/teacher/ksresourceform/list',
    method: 'post',
    data: params
  });
}

export function createTeacherResourceForm(data) {
  return request({
    url: '/teacher/ksresourceform/add',
    method: 'post',
    data
  });
}

export function deleteTeacherResourceForm(id) {
  return request({
    url: `/teacher/ksresourceform/delete/${id}`,
    method: 'get'
  });
}

// ==================== 学习活动 - 习题管理 ====================
export function getTeacherItemList(params = {}) {
  return request({
    url: '/teacher/laitem/list',
    method: 'post',
    data: params
  });
}

export function createTeacherItem(data) {
  return request({
    url: '/teacher/laitem/add',
    method: 'post',
    data
  });
}

export function deleteTeacherItem(id) {
  return request({
    url: `/teacher/laitem/delete/${id}`,
    method: 'get',
    suppressErrorToast: true
  });
}

// ==================== 学习活动 - 媒体管理 ====================
export function getTeacherMediaList(params = {}) {
  return request({
    url: '/teacher/lamedia/list',
    method: 'post',
    data: params
  });
}

export function createTeacherMedia(data) {
  const formData = new FormData();
  if (data.videoFile) {
    formData.append('videoFile', data.videoFile);
  }
  if (data.videoUrl) {
    formData.append('videoUrl', data.videoUrl);
  }
  formData.append('mediaKey', data.mediaKey || '');
  formData.append('fileName', data.fileName || '');
  formData.append('uploadedBy', data.uploadedBy || '');
  
  // 添加章节关联
  if (data.chapterKey && Array.isArray(data.chapterKey) && data.chapterKey.length > 0) {
    data.chapterKey.forEach(key => {
      formData.append('chapter_key', key);
    });
  }
  
  // 添加知识点关联
  if (data.knowledgeKey && Array.isArray(data.knowledgeKey) && data.knowledgeKey.length > 0) {
    data.knowledgeKey.forEach(key => {
      formData.append('knowledge_key', key);
    });
  }
  
  // 添加标签关联
  if (data.tagId && Array.isArray(data.tagId) && data.tagId.length > 0) {
    data.tagId.forEach(id => {
      formData.append('tagId', id);
    });
  }

  return request({
    url: '/teacher/lamedia/add',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function deleteTeacherMedia(id) {
  return request({
    url: `/teacher/lamedia/delete/${id}`,
    method: 'get'
  });
}

