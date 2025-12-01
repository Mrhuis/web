<template>
  <AdminLayout>
    <div class="message-center-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">消息中心</h1>
          <p class="page-subtitle">与学生或其他用户建立单聊会话，实时交换消息</p>
        </div>
        <div class="header-actions">
          <el-button
            type="default"
            :loading="loadingMessages"
            @click="fetchMessages"
            circle
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="sidebar">
          <el-card class="target-card" shadow="never">
            <div class="card-title">选择聊天对象</div>
            <p class="card-subtitle">数据来自后台用户列表，可按用户名 / Key / 昵称搜索</p>
            <el-form :model="targetForm" label-position="top" @submit.prevent>
              <el-form-item label="从系统用户列表中选择">
                <el-select
                  v-model="targetForm.receiverKey"
                  placeholder="请输入关键词进行搜索"
                  filterable
                  reserve-keyword
                  :filter-method="handleUserFilter"
                  :loading="loadingUsers"
                  clearable
                  class="user-select"
                >
                  <el-option
                    v-for="user in selectableUsers"
                    :key="user.userKey"
                    :label="formatUserLabel(user)"
                    :value="user.userKey"
                  >
                    <div class="user-option">
                      <div class="user-option-name">
                        {{ user.nickname || user.username || user.userKey }}
                      </div>
                      <div class="user-option-meta">
                        <span v-if="user.username">账号 {{ user.username }}</span>
                        <span>UserKey {{ user.userKey }}</span>
                        <span>UID {{ user.id }}</span>
                      </div>
                    </div>
                  </el-option>
                  <template #empty>
                    <div class="user-option-empty">
                      {{ loadingUsers ? '正在加载用户...' : '未找到匹配的用户' }}
                    </div>
                  </template>
                </el-select>
              </el-form-item>
              <div class="target-actions">
                <el-button type="primary" class="full-width" @click="handleSetTarget">
                  开始聊天
                </el-button>
                <el-button
                  text
                  type="primary"
                  size="small"
                  :loading="loadingUsers"
                  @click="fetchSimpleUsers"
                >
                  刷新用户列表
                </el-button>
              </div>
            </el-form>
          </el-card>

          <el-card class="contact-card" shadow="never">
            <div class="card-title with-action">
              <span>最近联系人</span>
              <el-tag type="info" size="small">{{ contacts.length }}</el-tag>
            </div>
            <el-input
              v-model="contactSearch"
              placeholder="搜索用户Key"
              size="small"
              clearable
              class="contact-search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="contact-list">
              <el-empty
                v-if="!contacts.length"
                description="暂无联系人"
                :image-size="100"
              />
              <div
                v-else
                v-for="contact in contacts"
                :key="contact.key"
                class="contact-item"
                :class="{ active: chatTargetKey === contact.key }"
                @click="handleSelectContact(contact.key)"
              >
                <div class="contact-item-header">
                  <span class="contact-id">{{ getUserDisplayName(contact.key) }}</span>
                  <div class="contact-status">
                    <span class="contact-time">{{ formatTime(contact.lastTime) }}</span>
                    <span
                      v-if="contact.unreadCount"
                      class="contact-unread"
                    >
                      {{ formatUnreadCount(contact.unreadCount) }}条未读
                    </span>
                  </div>
                </div>
                <div
                  class="contact-preview"
                  :class="{ unread: contact.unreadCount }"
                >
                  {{ contact.lastMessage || '暂无消息' }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="chat-panel">
          <el-empty
          v-if="!chatTargetKey"
          description="请选择或输入用户Key开始聊天"
            :image-size="180"
          />
          <template v-else>
            <div class="chat-header">
              <div>
              <div class="chat-title">与{{ getUserDisplayName(chatTargetKey) }}的对话</div>
                <div class="chat-meta">
                  共 {{ filteredMessages.length }} 条消息
                  <span v-if="activeConvId"> · 会话 ID {{ activeConvId }}</span>
                </div>
              </div>
              <el-button
                type="primary"
                text
                size="small"
                :loading="loadingMessages"
                @click="fetchMessages"
              >
                刷新
              </el-button>
            </div>

            <div
              class="chat-body"
              ref="chatScrollRef"
              v-loading="loadingMessages"
              element-loading-text="加载消息中..."
            >
              <template v-if="filteredMessages.length">
                <div
                  v-for="message in filteredMessages"
                  :key="message.id ?? message.tempId"
                  class="message-row"
                  :class="{ mine: message.senderKey === currentUserKey }"
                >
                  <div class="message-meta">
                    <span>{{ message.senderKey === currentUserKey ? '我' : getUserDisplayName(message.senderKey) }}</span>
                    <span>{{ formatTime(message.sendTime) }}</span>
                  </div>
                  <div class="message-bubble" :class="{ revoked: message.isRevoked === 1 }">
                    <template v-if="message.isRevoked === 1">
                      <span class="revoked-text">该消息已撤回</span>
                    </template>
                    <template v-else>
                      <p v-if="message.content" class="message-content">{{ message.content }}</p>
                      <!-- 图片消息 -->
                      <div v-if="message.msgType === 2 && message.attachUrl" class="message-image-container">
                        <img
                          :src="getImageUrl(message.attachUrl)"
                          :alt="message.content || '图片'"
                          class="message-image"
                          @click="previewImage(message.attachUrl)"
                        />
                      </div>
                      <!-- 其他附件 -->
                      <a
                        v-else-if="message.attachUrl && message.msgType !== 2"
                        class="message-attachment"
                        :href="getImageUrl(message.attachUrl)"
                        target="_blank"
                        rel="noopener"
                      >
                        查看附件
                      </a>
                    </template>
                  </div>
                  <div v-if="canRevokeMessage(message)" class="message-actions">
                    <el-button
                      type="text"
                      size="small"
                      :loading="revokingMessageId === message.id"
                      @click="handleRevokeMessage(message)"
                    >
                      撤回
                    </el-button>
                  </div>
                </div>
              </template>
              <el-empty v-else description="暂无历史消息" />
            </div>

            <div
              v-if="!isSystemConversation"
              class="chat-input"
            >
              <el-input
                v-model="messageInput"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="输入消息内容，按 Ctrl + Enter 发送，支持粘贴图片"
                @keydown="handleInputKeydown"
                @paste="handlePaste"
              />
              <div class="input-actions">
                <div class="input-left">
                  <input
                    ref="imageInputRef"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleImageSelect"
                  />
                  <el-button
                    type="default"
                    :loading="uploadingImage"
                    @click="triggerImageSelect"
                    title="选择图片"
                  >
                    <el-icon><Picture /></el-icon>
                    图片
                  </el-button>
                  <span class="input-tip">当前发送者：教师（Key {{ currentUserKey || '-' }}）</span>
                </div>
                <div class="input-buttons">
                  <el-button
                    type="primary"
                    :disabled="!messageInput.trim() && !pendingImageUrl"
                    :loading="sending"
                    @click="handleSendMessage"
                  >
                    发送
                  </el-button>
                </div>
              </div>
              <!-- 图片预览 -->
              <div v-if="pendingImageUrl" class="image-preview">
                <img :src="getImageUrl(pendingImageUrl)" alt="预览" class="preview-image" />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  class="remove-image-btn"
                  @click="removePendingImage"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <div
              v-else
              class="system-chat-tip"
            >
              <el-icon class="tip-icon"><InfoFilled /></el-icon>
              <div class="tip-content">
                <div class="tip-title">系统通知只读</div>
                <div class="tip-text">系统通知仅支持查看，无法回复或发送新消息。</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, Picture, Close, InfoFilled } from '@element-plus/icons-vue';
import AdminLayout from '@/views/admin/AdminLayout.vue';
import { useUserStore } from '@/store/user';
import {
  getTeacherMessageList,
  sendTeacherMessage,
  revokeTeacherMessage,
  markTeacherMessagesAsRead
} from '@/api/teacher/teacher_message_center_api';
import { getAdminSimpleUserList, getUserBasicInfo } from '@/api/admin/admin_user_manage_api';
import { uploadMessageImage } from '@/api/admin/admin_message_center_api';
import { convertImagePaths } from '@/utils/imageUtils';

const userStore = useUserStore();
const SYSTEM_USER_KEY = 'system';
const normalizeUserKey = (value) => (value === null || value === undefined ? '' : String(value).trim());

const loadingMessages = ref(false);
const sending = ref(false);
const messages = ref([]);
const convIdRawMap = ref(new Map());
const chatTargetKey = ref('');
const contactSearch = ref('');
const messageInput = ref('');
const chatScrollRef = ref(null);
const revokingMessageId = ref(null);
const loadingUsers = ref(false);
const simpleUsers = ref([]);
const userSelectKeyword = ref('');
let messagePollingTimer = null;
const systemUserInfo = {
  username: 'system',
  nickname: '系统通知'
};
const userInfoCache = ref(new Map([[SYSTEM_USER_KEY, systemUserInfo]])); // 缓存用户信息 userKey -> {username, nickname}
const uploadingImage = ref(false);
const imageInputRef = ref(null);
const pendingImageUrl = ref(null); // 待发送的图片URL
const markingRead = ref(false);

const targetForm = reactive({
  receiverKey: ''
});

const currentUserKey = computed(() => {
  if (!userStore.userKey) return null;
  return String(userStore.userKey);
});

const contactUnreadMap = computed(() => {
  const map = new Map();
  if (!currentUserKey.value) return map;

  messages.value.forEach((msg) => {
    if (
      msg.receiverKey === currentUserKey.value &&
      msg.isRead === 0 &&
      msg.senderKey
    ) {
      const key = String(msg.senderKey);
      map.set(key, (map.get(key) || 0) + 1);
    }
  });

  return map;
});

const contacts = computed(() => {
  if (!currentUserKey.value) return [];
  const contactMap = new Map();

  messages.value.forEach((msg) => {
    if (msg.senderKey !== currentUserKey.value && msg.receiverKey !== currentUserKey.value) {
      return;
    }

    const otherKey = msg.senderKey === currentUserKey.value ? msg.receiverKey : msg.senderKey;
    if (!otherKey) return;

    const mapKey = String(otherKey);
    let previewText = '';
    if (msg.isRevoked === 1) {
      previewText = '该消息已撤回';
    } else if (msg.msgType === 2 && msg.attachUrl) {
      previewText = '[图片]' + (msg.content && msg.content !== '图片' ? ' ' + msg.content : '');
    } else {
      previewText = msg.content || '';
    }

    const unreadCount = contactUnreadMap.value.get(mapKey) || 0;

    const cardData = {
      key: mapKey,
      lastMessage: previewText,
      lastTime: msg.sendTime,
      unreadCount
    };

    if (!contactMap.has(mapKey)) {
      contactMap.set(mapKey, cardData);
    } else {
      const existing = contactMap.get(mapKey);
      if (dayjs(msg.sendTime).isAfter(dayjs(existing.lastTime))) {
        contactMap.set(mapKey, cardData);
      } else {
        contactMap.set(mapKey, {
          ...existing,
          unreadCount
        });
      }
    }
  });

  let list = Array.from(contactMap.values()).map((item) => ({
    ...item,
    unreadCount: contactUnreadMap.value.get(item.key) || 0
  }));

  list = list.sort(
    (a, b) => dayjs(b.lastTime).valueOf() - dayjs(a.lastTime).valueOf()
  );

  if (contactSearch.value) {
    const keyword = contactSearch.value.trim();
    list = list.filter((item) => item.key.includes(keyword));
  }

  return list;
});

const selectableUsers = computed(() => {
  if (!userSelectKeyword.value) {
    return simpleUsers.value.slice(0, 50);
  }

  const keyword = userSelectKeyword.value.trim().toLowerCase();
  return simpleUsers.value
    .filter((user) => {
      return ['username', 'userKey', 'nickname'].some((field) => {
        const value = user[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(keyword);
      });
    })
    .slice(0, 50);
});

const filteredMessages = computed(() => {
  if (!chatTargetKey.value || !currentUserKey.value) return [];

  return messages.value
    .filter(
      (msg) =>
        (msg.senderKey === currentUserKey.value && msg.receiverKey === chatTargetKey.value) ||
        (msg.receiverKey === currentUserKey.value && msg.senderKey === chatTargetKey.value)
    )
    .sort((a, b) => dayjs(a.sendTime).valueOf() - dayjs(b.sendTime).valueOf());
});

const isSystemConversation = computed(() => {
  if (isSystemUser(chatTargetKey.value)) {
    return true;
  }
  return filteredMessages.value.some(
    (msg) => isSystemUser(msg.senderKey) || isSystemUser(msg.receiverKey)
  );
});

const activeConvId = computed(() => {
  const existing = filteredMessages.value.find((msg) => msg.convId);
  return existing?.convId ?? null;
});

const scrollToBottom = () => {
  if (!chatScrollRef.value) return;
  requestAnimationFrame(() => {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
  });
};

watch(filteredMessages, () => {
  nextTick(scrollToBottom);
});

watch(
  () => ({
    convId: activeConvId.value,
    unreadFlag: activeConvId.value ? hasUnreadMessages(activeConvId.value) : false
  }),
  ({ convId, unreadFlag }) => {
    if (convId && unreadFlag) {
      markConversationAsRead(convId);
    }
  }
);

const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const normalizeConvId = (value) => {
  if (!value && value !== 0) return null;
  try {
    return String(value);
  } catch {
    return null;
  }
};

const getConvIdForApi = (value) => {
  if (!value && value !== 0) return null;
  const normalized = normalizeConvId(value);
  if (!normalized) return null;
  if (convIdRawMap.value.has(normalized)) {
    return convIdRawMap.value.get(normalized);
  }
  return normalized;
};

const hasUnreadMessages = (convId) => {
  if (!convId || !currentUserKey.value) return false;
  const normalizedConvId = normalizeConvId(convId);
  return messages.value.some(
    (msg) =>
      msg.convId === normalizedConvId &&
      msg.receiverKey === currentUserKey.value &&
      msg.isRead === 0
  );
};

const markConversationAsRead = async (convId) => {
  if (!convId || markingRead.value) return;
  if (!currentUserKey.value) return;
  if (!hasUnreadMessages(convId)) return;

  const convIdForApi = getConvIdForApi(convId);
  if (convIdForApi === null || convIdForApi === undefined) {
    console.warn('无法解析 convId，跳过已读标记', convId);
    return;
  }

  try {
    markingRead.value = true;
    const response = await markTeacherMessagesAsRead({
      convId: convIdForApi,
      userKey: currentUserKey.value
    });
    if (response.success) {
      const normalizedConvId = normalizeConvId(convId);
      messages.value = messages.value.map((msg) => {
        if (
          msg.convId === normalizedConvId &&
          msg.receiverKey === currentUserKey.value &&
          msg.isRead === 0
        ) {
          return {
            ...msg,
            isRead: 1
          };
        }
        return msg;
      });
    } else {
      ElMessage.error(response.message || '标记消息已读失败');
    }
  } catch (error) {
    console.error('标记消息已读失败', error);
    ElMessage.error('标记消息已读失败');
  } finally {
    markingRead.value = false;
  }
};

const formatUserLabel = (user) => {
  if (!user) return '';
  const display = user.nickname || user.username || '-';
  return `${display}（${user.userKey || '未知Key'}）`;
};

// 获取用户显示名称（优先昵称，其次用户名，最后userKey）
const isSystemUser = (userKey) => {
  const normalized = normalizeUserKey(userKey);
  return normalized && normalized.toLowerCase() === SYSTEM_USER_KEY;
};

const getUserDisplayName = (userKey) => {
  if (!userKey) return '';
  if (isSystemUser(userKey)) {
    return '系统通知';
  }
  const info = userInfoCache.value.get(String(userKey));
  if (info) {
    return info.nickname || info.username || `用户 #${userKey}`;
  }
  return `用户 #${userKey}`;
};

// 获取用户信息并缓存
const fetchUserInfo = async (userKey) => {
  const normalizedKey = normalizeUserKey(userKey);
  if (!normalizedKey) return;
  if (isSystemUser(normalizedKey)) {
    userInfoCache.value.set(SYSTEM_USER_KEY, systemUserInfo);
    return;
  }
  const key = normalizedKey;
  if (userInfoCache.value.has(key)) {
    return; // 已缓存，无需重复请求
  }
  
  try {
    const response = await getUserBasicInfo(key);
    if (response.success && response.data) {
      userInfoCache.value.set(key, {
        username: response.data.username || '',
        nickname: response.data.nickname || ''
      });
    }
  } catch (error) {
    if (isSystemUser(key)) {
      return;
    }
    console.error(`获取用户信息失败 (userKey: ${key})`, error);
  }
};

// 批量获取用户信息
const fetchUserInfos = async (userKeys) => {
  if (!userKeys || !Array.isArray(userKeys)) return;
  const keysToFetch = userKeys
    .map((k) => normalizeUserKey(k))
    .filter((k) => k && !isSystemUser(k) && !userInfoCache.value.has(k));
  
  if (keysToFetch.length === 0) return;
  
  // 并发请求，但限制并发数
  const batchSize = 5;
  for (let i = 0; i < keysToFetch.length; i += batchSize) {
    const batch = keysToFetch.slice(i, i + batchSize);
    await Promise.all(batch.map(key => fetchUserInfo(key)));
  }
};

const fetchMessages = async (options = { silent: false }) => {
  if (!currentUserKey.value) {
    ElMessage.warning('当前未登录教师账号，无法获取消息');
    return;
  }

  if (!options.silent) {
    loadingMessages.value = true;
  }

  try {
    const response = await getTeacherMessageList({
      userKey: currentUserKey.value,
      page_index: 1,
      page_size: 500
    });

    if (response.success) {
      const nextConvIdMap = new Map();
      messages.value = (response.data?.records || []).map((item) => {
        const normalizedConvId =
          item.convId === undefined || item.convId === null ? null : String(item.convId);
        if (normalizedConvId) {
          nextConvIdMap.set(normalizedConvId, item.convId);
        }
        return {
          ...item,
          convId: normalizedConvId
        };
      });
      convIdRawMap.value = nextConvIdMap;
      
      // 获取消息中涉及的所有用户信息
      const userKeys = new Set();
      messages.value.forEach(msg => {
        if (msg.senderKey && msg.senderKey !== currentUserKey.value) {
          userKeys.add(String(msg.senderKey));
        }
        if (msg.receiverKey && msg.receiverKey !== currentUserKey.value) {
          userKeys.add(String(msg.receiverKey));
        }
      });
      if (userKeys.size > 0) {
        await fetchUserInfos(Array.from(userKeys));
      }
    } else {
      ElMessage.error(response.message || '获取消息列表失败');
    }
  } catch (error) {
    console.error('获取消息列表失败', error);
    ElMessage.error('获取消息列表失败');
  } finally {
    if (!options.silent) {
      loadingMessages.value = false;
    }
  }
};

const clearMessagePolling = () => {
  if (messagePollingTimer) {
    clearInterval(messagePollingTimer);
    messagePollingTimer = null;
  }
};

const startMessagePolling = () => {
  clearMessagePolling();
  if (!currentUserKey.value) return;
  messagePollingTimer = setInterval(() => {
    fetchMessages({ silent: true });
  }, 5000);
};

const fetchSimpleUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await getAdminSimpleUserList();
    if (response.success) {
      simpleUsers.value = Array.isArray(response.data) ? response.data : [];
    } else {
      ElMessage.error(response.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取简化用户列表失败', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loadingUsers.value = false;
  }
};

const handleUserFilter = (query) => {
  userSelectKeyword.value = query;
};

const handleSetTarget = () => {
  const receiverKey = targetForm.receiverKey?.trim();
  if (!receiverKey) {
    ElMessage.warning('请选择接收者用户');
    return;
  }

  if (receiverKey === currentUserKey.value) {
    ElMessage.warning('不能给自己发送消息');
    return;
  }

  chatTargetKey.value = receiverKey;
  // 获取目标用户信息
  fetchUserInfo(receiverKey);
};

const handleSelectContact = (contactKey) => {
  chatTargetKey.value = contactKey;
  targetForm.receiverKey = contactKey;
  // 获取联系人信息
  fetchUserInfo(contactKey);
};

const formatUnreadCount = (count) => {
  if (!count) return '';
  return count > 99 ? '99+' : String(count);
};

const handleInputKeydown = (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSendMessage();
  }
};

// 触发图片选择
const triggerImageSelect = () => {
  if (imageInputRef.value) {
    imageInputRef.value.click();
  }
};

// 处理图片选择
const handleImageSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }

  // 检查文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过10MB');
    return;
  }

  await uploadImageFile(file);
  
  // 清空input，以便可以重复选择同一文件
  if (imageInputRef.value) {
    imageInputRef.value.value = '';
  }
};

// 处理粘贴事件
const handlePaste = async (event) => {
  const clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        await uploadImageFile(file);
      }
      break;
    }
  }
};

// 上传图片文件
const uploadImageFile = async (file) => {
  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await uploadMessageImage(formData);
    if (response.success) {
      pendingImageUrl.value = response.data;
      ElMessage.success('图片上传成功，点击发送按钮发送消息');
    } else {
      ElMessage.error(response.message || '图片上传失败');
    }
  } catch (error) {
    console.error('图片上传失败', error);
    ElMessage.error('图片上传失败');
  } finally {
    uploadingImage.value = false;
  }
};

// 移除待发送的图片
const removePendingImage = () => {
  pendingImageUrl.value = null;
};

// 获取图片完整URL
const getImageUrl = (url) => {
  if (!url) return '';
  // 如果是相对路径，添加后端地址
  if (url.startsWith('/')) {
    const isDev = typeof location !== 'undefined' && (location.port === '5137' || location.hostname === 'localhost');
    const staticHost = isDev ? 'http://localhost:8080' : '';
    return staticHost + url;
  }
  return url;
};

// 预览图片
const previewImage = (url) => {
  const imageUrl = getImageUrl(url);
  // 使用Element Plus的图片预览功能
  window.open(imageUrl, '_blank');
};

const handleSendMessage = async () => {
  if (!currentUserKey.value) {
    ElMessage.warning('当前未登录，无法发送消息');
    return;
  }

  if (!chatTargetKey.value) {
    ElMessage.warning('请先选择聊天对象');
    return;
  }

  if (chatTargetKey.value === currentUserKey.value) {
    ElMessage.warning('不能给自己发送消息');
    return;
  }

  if (isSystemConversation.value) {
    ElMessage.warning('系统通知只读，无法发送消息');
    return;
  }

  const content = messageInput.value.trim();
  const hasImage = !!pendingImageUrl.value;
  
  if (!content && !hasImage) {
    ElMessage.warning('请输入消息内容或选择图片');
    return;
  }

  const payload = {
    convId: getConvIdForApi(activeConvId.value),
    senderKey: currentUserKey.value,
    receiverKey: chatTargetKey.value,
    content: content || (hasImage ? '图片' : ''),
    attachUrl: pendingImageUrl.value || null,
    msgType: hasImage ? 2 : 1, // 2表示图片消息
    sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };

  sending.value = true;
  try {
    const response = await sendTeacherMessage(payload);
    if (response.success) {
      ElMessage.success('消息发送成功');
      messageInput.value = '';
      pendingImageUrl.value = null; // 清空待发送的图片
      await fetchMessages({ silent: true });
      nextTick(scrollToBottom);
    } else {
      ElMessage.error(response.message || '消息发送失败');
    }
  } catch (error) {
    console.error('消息发送失败', error);
    ElMessage.error('消息发送失败');
  } finally {
    sending.value = false;
  }
};

const canRevokeMessage = (message) => {
  if (!message || !currentUserKey.value) return false;
  if (!message.id || message.isRevoked === 1) return false;
  if (message.senderKey !== currentUserKey.value) return false;

  const sendTime = dayjs(message.sendTime);
  if (!sendTime.isValid()) return false;

  const diffMillis = dayjs().valueOf() - sendTime.valueOf();
  return diffMillis <= 2 * 60 * 1000;
};

const handleRevokeMessage = async (message) => {
  if (revokingMessageId.value) return;
  if (!canRevokeMessage(message)) {
    ElMessage.warning('该消息暂无法撤回');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确认撤回该条消息？撤回后双方都将无法查看内容。',
      '撤回消息',
      {
        confirmButtonText: '撤回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
  } catch {
    return;
  }

  revokingMessageId.value = message.id;
  try {
    const response = await revokeTeacherMessage({
      id: message.id,
      userKey: currentUserKey.value
    });

    if (response.success) {
      ElMessage.success('消息已撤回');
      await fetchMessages({ silent: true });
    } else {
      ElMessage.error(response.message || '撤回失败');
    }
  } catch (error) {
    console.error('撤回消息失败', error);
    ElMessage.error('撤回消息失败');
  } finally {
    revokingMessageId.value = null;
  }
};

onMounted(() => {
  fetchMessages();
  fetchSimpleUsers();
  startMessagePolling();
});

onUnmounted(() => {
  clearMessagePolling();
});

watch(
  () => currentUserKey.value,
  (newKey) => {
    if (!newKey) {
      clearMessagePolling();
    } else {
      startMessagePolling();
    }
  }
);

// 监听联系人列表变化，自动获取用户信息
watch(
  () => contacts.value,
  (newContacts) => {
    if (newContacts && newContacts.length > 0) {
      const userKeys = newContacts.map(c => c.key).filter(k => k);
      if (userKeys.length > 0) {
        fetchUserInfos(userKeys);
      }
    }
  },
  { immediate: true }
);

// 监听当前聊天目标变化，获取用户信息
watch(
  () => chatTargetKey.value,
  (newKey) => {
    if (newKey) {
      fetchUserInfo(newKey);
    }
  }
);
</script>

<style scoped>
.message-center-container {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  height: calc(100vh - 40px);
  min-height: 600px;
  max-height: 1000px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.card-subtitle {
  margin: -4px 0 12px;
  font-size: 12px;
  color: #6b7280;
}

.card-title.with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.full-width {
  width: 100%;
}

.target-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.user-select {
  width: 100%;
}

.user-option {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.user-option-name {
  font-weight: 600;
  color: #111827;
}

.user-option-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.user-option-empty {
  padding: 12px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.contact-search {
  margin-bottom: 12px;
}

.contact-list {
  max-height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.contact-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.contact-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #1f2937;
  margin-bottom: 6px;
}

.contact-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-preview {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-preview.unread {
  color: #1f2937;
  font-weight: 600;
}

.contact-time {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 8px;
}

.contact-unread {
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.chat-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.chat-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.chat-meta {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px;
  background: #f8fafc;
  border-radius: 8px;
  min-height: 0;
  max-height: 100%;
}

.message-row {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  margin-bottom: 16px;
}

.message-row.mine {
  margin-left: auto;
  align-items: flex-end;
}

.message-meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.message-bubble {
  display: inline-flex;
  flex-direction: column;
  width: fit-content;
  max-width: 100%;
  background: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  word-break: break-word;
}

.message-row.mine .message-bubble {
  background: #2563eb;
  color: #fff;
  border-color: #1d4ed8;
}

.message-row.mine .message-bubble.revoked {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #d1d5db;
}

.message-row.mine .message-content {
  color: #fff;
}

.message-bubble.revoked {
  background: #f3f4f6;
  color: #9ca3af;
  border-style: dashed;
}

.message-actions {
  margin-top: 4px;
  text-align: right;
}

.revoked-text {
  font-size: 13px;
  color: inherit;
}

.message-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.message-attachment {
  font-size: 13px;
  color: #93c5fd;
  display: inline-block;
  margin-top: 4px;
}

.chat-input {
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
}

.input-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-tip {
  color: #9ca3af;
}

.image-preview {
  position: relative;
  margin-top: 8px;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f56565 !important;
  border: 1px solid #f56565 !important;
  color: #fff !important;
}

.remove-image-btn:hover {
  background: #e53e3e !important;
  border-color: #e53e3e !important;
}

.system-chat-tip {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  color: #374151;
}

.tip-icon {
  font-size: 24px;
  color: #2563eb;
}

.tip-title {
  font-weight: 600;
  color: #111827;
}

.tip-text {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.message-image-container {
  margin-top: 8px;
  max-width: 100%;
}

.message-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: contain;
  display: block;
}

.message-image:hover {
  opacity: 0.9;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
  }

  .target-card,
  .contact-card {
    flex: 1;
  }
}
</style>

