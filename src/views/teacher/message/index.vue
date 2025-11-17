<template>
  <TeacherLayout>
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
            <el-form :model="targetForm" label-position="top" @submit.prevent>
              <el-form-item label="接收者用户ID">
                <el-input
                  v-model="targetForm.receiverId"
                  placeholder="请输入用户ID"
                  maxlength="20"
                  inputmode="numeric"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-button type="primary" class="full-width" @click="handleSetTarget">
                开始聊天
              </el-button>
            </el-form>
          </el-card>

          <el-card class="contact-card" shadow="never">
            <div class="card-title with-action">
              <span>最近联系人</span>
              <el-tag type="info" size="small">{{ contacts.length }}</el-tag>
            </div>
            <el-input
              v-model="contactSearch"
              placeholder="搜索用户ID"
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
                :key="contact.id"
                class="contact-item"
                :class="{ active: chatTargetId === String(contact.id) }"
                @click="handleSelectContact(contact.id)"
              >
                <div class="contact-item-header">
                  <span class="contact-id">用户 #{{ contact.id }}</span>
                  <span class="contact-time">{{ formatTime(contact.lastTime) }}</span>
                </div>
                <div class="contact-preview">
                  {{ contact.lastMessage || '暂无消息' }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="chat-panel">
          <el-empty
            v-if="!chatTargetId"
            description="请选择或输入用户ID开始聊天"
            :image-size="180"
          />
          <template v-else>
            <div class="chat-header">
              <div>
                <div class="chat-title">与用户 #{{ chatTargetId }} 的对话</div>
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
                  :class="{ mine: message.senderId === currentUserId }"
                >
                  <div class="message-meta">
                    <span>{{ message.senderId === currentUserId ? '我' : `用户 #${message.senderId}` }}</span>
                    <span>{{ formatTime(message.sendTime) }}</span>
                  </div>
                  <div class="message-bubble" :class="{ revoked: message.isRevoked === 1 }">
                    <template v-if="message.isRevoked === 1">
                      <span class="revoked-text">该消息已撤回</span>
                    </template>
                    <template v-else>
                      <p class="message-content">{{ message.content }}</p>
                      <a
                        v-if="message.attachUrl"
                        class="message-attachment"
                        :href="message.attachUrl"
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

            <div class="chat-input">
              <el-input
                v-model="messageInput"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="输入消息内容，按 Ctrl + Enter 发送"
                @keydown="handleInputKeydown"
              />
              <div class="input-actions">
                <span class="input-tip">当前发送者：教师（ID {{ currentUserId || '-' }}）</span>
                <div class="input-buttons">
                  <el-button
                    type="primary"
                    :disabled="!messageInput.trim()"
                    :loading="sending"
                    @click="handleSendMessage"
                  >
                    发送
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, User } from '@element-plus/icons-vue';
import TeacherLayout from '../layout/TeacherLayout.vue';
import { useUserStore } from '@/store/user';
import {
  getTeacherMessageList,
  sendTeacherMessage,
  revokeTeacherMessage
} from '@/api/teacher/teacher_message_center_api';

const userStore = useUserStore();

const loadingMessages = ref(false);
const sending = ref(false);
const messages = ref([]);
const chatTargetId = ref('');
const contactSearch = ref('');
const messageInput = ref('');
const chatScrollRef = ref(null);
const revokingMessageId = ref(null);

const targetForm = reactive({
  receiverId: ''
});

const currentUserId = computed(() => {
  const parsed = Number(userStore.id);
  return Number.isFinite(parsed) ? parsed : null;
});

const contacts = computed(() => {
  if (!currentUserId.value) return [];
  const contactMap = new Map();

  messages.value.forEach((msg) => {
    if (msg.senderId !== currentUserId.value && msg.receiverId !== currentUserId.value) {
      return;
    }

    const otherId = msg.senderId === currentUserId.value ? msg.receiverId : msg.senderId;
    if (!otherId) return;

    const key = String(otherId);
    const previewText = msg.isRevoked === 1 ? '该消息已撤回' : (msg.content || '');

    if (!contactMap.has(key)) {
      contactMap.set(key, {
        id: otherId,
        lastMessage: previewText,
        lastTime: msg.sendTime
      });
    } else {
      const existing = contactMap.get(key);
      if (dayjs(msg.sendTime).isAfter(dayjs(existing.lastTime))) {
        contactMap.set(key, {
          id: otherId,
          lastMessage: previewText,
          lastTime: msg.sendTime
        });
      }
    }
  });

  let list = Array.from(contactMap.values()).sort(
    (a, b) => dayjs(b.lastTime).valueOf() - dayjs(a.lastTime).valueOf()
  );

  if (contactSearch.value) {
    const keyword = contactSearch.value.trim();
    list = list.filter((item) => String(item.id).includes(keyword));
  }

  return list;
});

const filteredMessages = computed(() => {
  if (!chatTargetId.value || !currentUserId.value) return [];
  const targetId = Number(chatTargetId.value);
  if (!targetId) return [];

  return messages.value
    .filter(
      (msg) =>
        (msg.senderId === currentUserId.value && msg.receiverId === targetId) ||
        (msg.receiverId === currentUserId.value && msg.senderId === targetId)
    )
    .sort((a, b) => dayjs(a.sendTime).valueOf() - dayjs(b.sendTime).valueOf());
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

const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const fetchMessages = async (options = { silent: false }) => {
  if (!currentUserId.value) {
    ElMessage.warning('当前未登录教师账号，无法获取消息');
    return;
  }

  if (!options.silent) {
    loadingMessages.value = true;
  }

  try {
    const response = await getTeacherMessageList({
      userId: currentUserId.value,
      page_index: 1,
      page_size: 500
    });

    if (response.success) {
      messages.value = (response.data?.records || []).map((item) => ({
        ...item
      }));
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

const handleSetTarget = () => {
  const receiverId = targetForm.receiverId?.trim();
  if (!receiverId) {
    ElMessage.warning('请输入接收者用户ID');
    return;
  }

  if (Number(receiverId) === currentUserId.value) {
    ElMessage.warning('不能给自己发送消息');
    return;
  }

  chatTargetId.value = receiverId;
};

const handleSelectContact = (contactId) => {
  chatTargetId.value = String(contactId);
  targetForm.receiverId = String(contactId);
};

const handleInputKeydown = (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSendMessage();
  }
};

const handleSendMessage = async () => {
  if (!currentUserId.value) {
    ElMessage.warning('当前未登录，无法发送消息');
    return;
  }

  if (!chatTargetId.value) {
    ElMessage.warning('请先选择聊天对象');
    return;
  }

  const content = messageInput.value.trim();
  if (!content) {
    ElMessage.warning('请输入消息内容');
    return;
  }

  const targetId = Number(chatTargetId.value);
  if (!targetId) {
    ElMessage.warning('请检查用户ID是否正确');
    return;
  }

  const payload = {
    convId: activeConvId.value,
    senderId: currentUserId.value,
    receiverId: targetId,
    content,
    attachUrl: null,
    msgType: 1,
    sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };

  sending.value = true;
  try {
    const response = await sendTeacherMessage(payload);
    if (response.success) {
      ElMessage.success('消息发送成功');
      messageInput.value = '';
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
  if (!message || !currentUserId.value) return false;
  if (!message.id || message.isRevoked === 1) return false;
  if (message.senderId !== currentUserId.value) return false;

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
      userId: currentUserId.value
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
});
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
  min-height: 520px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.card-title.with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.full-width {
  width: 100%;
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

.contact-preview {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-time {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 8px;
}

.chat-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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
  padding: 12px 8px;
  background: #f8fafc;
  border-radius: 8px;
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
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
}

.input-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-tip {
  color: #9ca3af;
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