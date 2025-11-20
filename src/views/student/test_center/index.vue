<template>
  <StudentLayout>
    <div class="test-center-container">
      <div class="header">
        <h2>测验中心</h2>
        <p class="subtitle">请选择要参加的考试</p>
      </div>

      <div v-loading="loading" class="exam-paper-list">
        <el-empty v-if="!loading && examPapers.length === 0" description="暂无可用试卷" />

        <el-card
          v-for="paper in examPapers"
          :key="paper.id"
          class="exam-paper-card"
          shadow="hover"
        >
          <div class="card-content">
            <div class="paper-info">
              <h3 class="paper-title">{{ paper.paperName || paper.title }}</h3>
              <div class="paper-details">
                <div class="detail-row">
                  <span class="detail-label">科目：</span>
                  <span class="detail-value">{{ paper.subject || '未设置' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">难度：</span>
                  <span class="detail-value">{{ getDifficultyText(paper.difficulty) }}</span>
                  <span class="detail-label" style="margin-left: 16px;">总分：</span>
                  <span class="detail-value">{{ paper.totalScore || 0 }} 分</span>
                  <span class="detail-label" style="margin-left: 16px;">限时：</span>
                  <span class="detail-value">{{ paper.timeLimit || 0 }} 分钟</span>
                </div>
                <div class="paper-meta">
                  <el-tag v-if="paper.distributeTime" type="info" size="small">
                    <el-icon><Clock /></el-icon>
                    下发时间：{{ formatDateTime(paper.distributeTime) }}
                  </el-tag>
                  <el-tag v-if="paper.deadline" type="warning" size="small" style="margin-left: 8px;">
                    <el-icon><Timer /></el-icon>
                    截止时间：{{ formatDateTime(paper.deadline) }}
                  </el-tag>
                </div>
                <div v-if="paper.remark" class="paper-remark">
                  <span class="remark-label">备注：</span>
                  <span class="remark-content">{{ paper.remark }}</span>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <el-button
                type="primary"
                @click="startExam(paper)"
                :disabled="isExpired(paper.deadline) || paper.completed"
              >
                {{
                  isExpired(paper.deadline)
                    ? '已过期'
                    : paper.completed
                      ? '已完成'
                      : '开始答题'
                }}
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, Timer } from '@element-plus/icons-vue'
import StudentLayout from '../StudentLayout.vue'
import { useUserStore } from '@/store/user'
import { testCenterApi } from '@/api/student/test_center_api'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const examPapers = ref([])

onMounted(() => {
  loadExamPapers()
})

/**
 * 加载试卷列表
 */
async function loadExamPapers() {
  if (!userStore.userKey) {
    ElMessage.error('请先登录')
    return
  }

  loading.value = true
  try {
    const response = await testCenterApi.getExamPapersByStudentUserKey(userStore.userKey)
    if (response.success !== false && response.data) {
      // 先加载试卷列表，再查询每份试卷是否已完成
      examPapers.value = response.data.map(paper => ({
        ...paper,
        completed: false
      }))
      await loadExamCompletionStatus()
    } else {
      ElMessage.error(response.message || '加载试卷列表失败')
    }
  } catch (error) {
    console.error('加载试卷列表失败:', error)
    ElMessage.error('加载试卷列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 开始答题
 */
async function startExam(paper) {
  if (isExpired(paper.deadline)) {
    ElMessage.warning('该考试已过期，无法进入答题')
    return
  }

  if (paper.completed) {
    ElMessage.warning('该考试已完成，不能再次进入')
    return
  }

  router.push({
    name: 'StudentExamPaper',
    params: { paperId: paper.id }
  })
}

/**
 * 加载每份试卷的完成状态
 */
async function loadExamCompletionStatus() {
  const userKey = userStore.userKey
  if (!userKey || !examPapers.value.length) return

  try {
    const promises = examPapers.value.map(async (paper) => {
      try {
        const res = await testCenterApi.checkExamCompleted(userKey, paper.id)
        if (res && res.success !== false) {
          paper.completed = parseExamCompletedFlag(res.data)
        }
      } catch (e) {
        // 单个试卷状态查询失败时仅记录日志，不阻塞其它试卷
        console.error(`查询试卷 ${paper.id} 完成状态失败:`, e)
      }
    })
    await Promise.all(promises)
  } catch (error) {
    console.error('加载考试完成状态失败:', error)
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateTime) {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 判断是否已过期
 */
function isExpired(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

/**
 * 获取难度文本
 */
function getDifficultyText(difficulty) {
  if (difficulty === null || difficulty === undefined) return '未设置'
  const difficultyMap = {
    1: '简单',
    2: '中等',
    3: '困难'
  }
  return difficultyMap[difficulty] || `难度${difficulty}`
}

/**
 * 解析考试是否完成标记
 */
function parseExamCompletedFlag(value) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.includes('已完成') || value.toLowerCase() === 'completed'
  }
  if (value && typeof value === 'object' && 'completed' in value) {
    return Boolean(value.completed)
  }
  return false
}
</script>

<style scoped>
.test-center-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.exam-paper-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exam-paper-card {
  transition: all 0.3s;
}

.exam-paper-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.paper-info {
  flex: 1;
}

.paper-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.paper-details {
  margin-top: 8px;
}

.detail-row {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  color: #333;
  margin-right: 8px;
}

.paper-meta {
  margin-top: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.paper-remark {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.remark-label {
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.remark-content {
  color: #333;
}

.card-actions {
  margin-left: 24px;
}
</style>

