<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">消息中心</h1>
        <p class="page-subtitle">统一查看并处理系统告警、用户反馈与操作通知</p>
      </div>
      <div class="toolbar">
        <el-select v-model="filterType" placeholder="选择类型" size="small" style="width:140px;">
          <el-option label="全部类型" value="all" />
          <el-option label="系统告警" value="alert" />
          <el-option label="用户反馈" value="feedback" />
          <el-option label="操作通知" value="notification" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="选择状态" size="small" style="width:140px;">
          <el-option label="全部状态" value="all" />
          <el-option label="未读" value="unread" />
          <el-option label="已读" value="read" />
        </el-select>
        <el-button type="primary" size="small" @click="markAllRead">一键标记已读</el-button>
      </div>
    </div>

    <el-card class="message-list-card">
      <el-timeline>
        <el-timeline-item
          v-for="item in filteredMessages"
          :key="item.id"
          :timestamp="item.time"
          :type="item.type === 'alert' ? 'danger' : (item.type === 'feedback' ? 'info' : 'primary')"
        >
          <div class="message-item">
            <div class="message-title">
              <el-tag
                :type="badgeType(item.type)"
                size="small"
              >
                {{ typeLabel(item.type) }}
              </el-tag>
              <span :class="{ unread: item.status === 'unread' }">{{ item.title }}</span>
            </div>
            <p class="message-content">{{ item.content }}</p>
            <div class="message-actions">
              <span class="meta">来源：{{ item.source }}</span>
              <span class="meta">优先级：{{ priorityLabel(item.priority) }}</span>
              <div>
                <el-button text type="primary" size="small" @click="viewDetails(item)">查看详情</el-button>
                <el-button
                  text
                  type="success"
                  size="small"
                  v-if="item.status === 'unread'"
                  @click="markRead(item.id)"
                >
                  标记已读
                </el-button>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <div v-if="filteredMessages.length === 0" class="empty-state">
        <el-empty description="暂无符合条件的消息" />
      </div>
    </el-card>

    <el-drawer v-model="drawerVisible" title="消息详情" size="30%">
      <template v-if="currentMessage">
        <h3>{{ currentMessage.title }}</h3>
        <p class="drawer-meta">时间：{{ currentMessage.time }}</p>
        <p class="drawer-meta">来源：{{ currentMessage.source }}</p>
        <p class="drawer-meta">优先级：{{ priorityLabel(currentMessage.priority) }}</p>
        <el-divider />
        <p style="line-height:1.8;">{{ currentMessage.detail }}</p>
      </template>
      <template v-else>
        <el-empty description="请选择一条消息查看" />
      </template>
    </el-drawer>
  </AdminLayout>
</template>

<script setup>
import { computed, ref } from 'vue';
import AdminLayout from './AdminLayout.vue';

const filterType = ref('all');
const filterStatus = ref('all');
const drawerVisible = ref(false);
const currentMessage = ref(null);

const messages = ref([
  {
    id: 1001,
    title: 'DeepFM 训练任务完成',
    content: '最新模型训练任务已完成，请及时进行测试与发布。',
    detail: '训练任务 #20251114 使用全量数据集完成，耗时 02:13:42。校验结果已同步至算法中心。',
    type: 'notification',
    status: 'unread',
    priority: 'medium',
    time: '2025-11-17 09:40',
    source: '算法调度服务'
  },
  {
    id: 1002,
    title: '资源上传失败告警',
    content: '学生 S0022 上传资源包时发生异常，系统自动终止上传。',
    detail: '上传文件 DataStructure.zip 时 OSS 临时密钥失效，系统已阻断。本告警需要排查密钥刷新任务。',
    type: 'alert',
    status: 'unread',
    priority: 'high',
    time: '2025-11-17 08:25',
    source: '资源上传网关'
  },
  {
    id: 1003,
    title: '教师反馈：测试管理界面优化',
    content: '教师 T0003 提交 UI 体验反馈，希望增加批量导入题目功能。',
    detail: '反馈内容：测试管理界面目前仅支持单题维护，批量导入效率低。建议提供模板下载与导入能力。',
    type: 'feedback',
    status: 'read',
    priority: 'low',
    time: '2025-11-16 19:12',
    source: '教师反馈表单'
  }
]);

const filteredMessages = computed(() => {
  return messages.value.filter((item) => {
    const matchType = filterType.value === 'all' || item.type === filterType.value;
    const matchStatus = filterStatus.value === 'all' || item.status === filterStatus.value;
    return matchType && matchStatus;
  });
});

const typeLabel = (type) => {
  switch (type) {
    case 'alert': return '系统告警';
    case 'feedback': return '用户反馈';
    default: return '操作通知';
  }
};

const badgeType = (type) => {
  switch (type) {
    case 'alert': return 'danger';
    case 'feedback': return 'info';
    default: return 'success';
  }
};

const priorityLabel = (priority) => {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    default: return '低';
  }
};

const markRead = (id) => {
  const target = messages.value.find((item) => item.id === id);
  if (target) {
    target.status = 'read';
  }
};

const markAllRead = () => {
  messages.value.forEach((item) => {
    item.status = 'read';
  });
};

const viewDetails = (item) => {
  currentMessage.value = item;
  drawerVisible.value = true;
  if (item.status === 'unread') {
    markRead(item.id);
  }
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
}

.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-list-card {
  border: 1px solid #e2e8f0;
}

.message-item {
  padding: 4px 0;
}

.message-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.message-title .unread {
  position: relative;
}

.message-title .unread::after {
  content: '';
  width: 8px;
  height: 8px;
  background: #f87171;
  border-radius: 50%;
  display: inline-block;
  margin-left: 8px;
}

.message-content {
  margin: 8px 0 0;
  color: #4b5563;
}

.message-actions {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.meta {
  margin-right: 16px;
}

.empty-state {
  padding: 40px 0 0;
}

.drawer-meta {
  margin: 4px 0;
  color: #6b7280;
}
</style>

