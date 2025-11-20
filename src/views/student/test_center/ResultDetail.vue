<template>
  <StudentLayout>
    <div class="detail-container">
      <div class="detail-header">
        <div>
          <h2>{{ summary.paperName || '试卷详情' }}</h2>
          <p class="subtitle">
            完成时间：{{ formatDateTime(summary.completeTime) }}
            <el-tag size="small" :type="summary.graded ? 'success' : 'warning'" style="margin-left: 12px;">
              {{ summary.graded ? '已评分' : '待评分' }}
            </el-tag>
          </p>
        </div>
        <div class="header-actions">
          <el-button @click="goBack">返回结果列表</el-button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">总分</div>
          <div class="value">{{ summary.totalScore ?? '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="label">我的得分</div>
          <div class="value primary">{{ formatScore(summary.obtainedScore ?? calculatedScore) }}</div>
        </div>
        <div class="stat-card">
          <div class="label">题目数量</div>
          <div class="value">{{ summary.questionCount ?? questionDetails.length }}</div>
        </div>
        <div class="stat-card">
          <div class="label">考试时长</div>
          <div class="value">{{ summary.timeLimit ? summary.timeLimit + ' 分钟' : '-' }}</div>
        </div>
      </div>

      <el-card class="question-card" v-loading="questionLoading">
        <template #default>
          <el-empty
            v-if="!questionLoading && questionDetails.length === 0"
            description="暂无题目信息"
          />
          <div v-else>
            <div
              v-for="(question, index) in questionDetails"
              :key="question.id || index"
              class="question-detail"
            >
              <div class="question-head">
                <div class="title">
                  第{{ index + 1 }}题 · {{ getQuestionTypeName(question.itemData?.formKey) }}
                </div>
                <div class="scores">
                  <span>分值：{{ question.actualScore ?? '-' }}</span>
                  <span>得分：{{ formatScore(question.studentAnswer?.score) }}</span>
                </div>
              </div>
              <div class="question-body" v-html="renderRichText(question.itemData?.content)"></div>
              <div class="answer-block">
                <div class="answer-title">标准答案</div>
                <div class="answer-content" v-html="renderRichText(question.itemData?.answer)"></div>
              </div>
              <div class="answer-block">
                <div class="answer-title">我的作答</div>
                <div class="answer-content" v-html="renderRichText(question.studentAnswer?.answer)"></div>
              </div>
            </div>
          </div>
        </template>
      </el-card>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import StudentLayout from '../StudentLayout.vue'
import { useUserStore } from '@/store/user'
import { testCenterResultApi } from '@/api/student/test_center_result_api'
import { processImagePaths } from '@/utils/imageUtils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const summary = ref({
  paperName: route.query.paperName || '',
  totalScore: route.query.totalScore ? Number(route.query.totalScore) : null,
  obtainedScore: route.query.obtainedScore ? Number(route.query.obtainedScore) : null,
  completeTime: route.query.completeTime || '',
  graded: route.query.graded === 'true' || route.query.graded === true,
  subject: route.query.subject || '',
  difficulty: route.query.difficulty ? Number(route.query.difficulty) : null,
  questionCount: null,
  timeLimit: null
})

const questionDetails = ref([])
const questionLoading = ref(false)

const paperId = computed(() => Number(route.params.paperId))

const calculatedScore = computed(() => {
  return questionDetails.value.reduce((sum, question) => {
    const score = Number(question.studentAnswer?.score || 0)
    return sum + (Number.isNaN(score) ? 0 : score)
  }, 0)
})

onMounted(() => {
  loadSummary()
  loadQuestionDetails()
})

watch(
  () => route.params.paperId,
  () => {
    loadSummary()
    loadQuestionDetails()
  }
)

async function loadSummary() {
  if (!userStore.userKey || !paperId.value) return
  try {
    const res = await testCenterResultApi.getCompletedPaperSummary({
      userKey: userStore.userKey,
      paperId: paperId.value
    })
    if (res.success && res.data) {
      summary.value = res.data
    }
  } catch (error) {
    console.error('加载试卷汇总信息失败', error)
  }
}

async function loadQuestionDetails() {
  if (!userStore.userKey) {
    ElMessage.error('请先登录')
    return
  }
  if (!paperId.value) {
    ElMessage.error('试卷信息无效')
    return
  }

  questionLoading.value = true
  try {
    const questionRes = await testCenterResultApi.getQuestionsByPaperId(paperId.value)
    if (!questionRes.success) {
      ElMessage.error(questionRes.message || '获取题目失败')
      questionLoading.value = false
      return
    }

    const sortedQuestions = (questionRes.data || []).sort(
      (a, b) => (a.sortNum || 0) - (b.sortNum || 0)
    )

    const details = await Promise.all(
      sortedQuestions.map(async (question) => {
        const [itemRes, answerRes] = await Promise.allSettled([
          testCenterResultApi.getItemByItemKey(question.itemKey),
          testCenterResultApi.getAnswerDetail({
            userKey: userStore.userKey,
            paperId: paperId.value,
            itemKey: question.itemKey
          })
        ])

        const itemData =
          itemRes.status === 'fulfilled' && itemRes.value?.data ? itemRes.value.data : null
        const studentAnswer =
          answerRes.status === 'fulfilled' && answerRes.value?.data ? answerRes.value.data : null

        return {
          ...question,
          itemData,
          studentAnswer
        }
      })
    )

    questionDetails.value = details
  } catch (error) {
    console.error('加载题目详情失败', error)
    ElMessage.error('加载题目详情失败')
  } finally {
    questionLoading.value = false
  }
}

function renderRichText(content) {
  if (!content) {
    return '<span class="empty-text">暂无内容</span>'
  }
  const processed = processImagePaths(content)
  if (isMarkdown(processed)) {
    return marked.parse(processed)
  }
  return escapeHtml(processed).replace(/\n/g, '<br>')
}

function isMarkdown(text) {
  if (!text) return false
  const patterns = [
    /^#{1,6}\s+/m,
    /\*\*([^*]+)\*\*/,
    /```[\s\S]*?```/,
    /\[([^\]]+)\]\(([^)]+)\)/,
    /!\[([^\]]*)\]\(([^)]+)\)/,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /^>\s+/m
  ]
  return patterns.some((pattern) => pattern.test(text))
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function getQuestionTypeName(formKey) {
  const map = {
    choice: '选择题',
    blank: '填空题',
    code: '编程题',
    judge: '判断题',
    qa: '问答题',
    drawing: '画图题'
  }
  return map[formKey] || '题目'
}

function formatScore(score) {
  if (score === null || score === undefined) return '-'
  const num = Number(score)
  if (Number.isNaN(num)) return '-'
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goBack() {
  router.push('/student/test-center/results')
}
</script>

<style scoped>
.detail-container {
  max-width: 1100px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.subtitle {
  color: #666;
  margin-top: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.stat-card .label {
  color: #909399;
  margin-bottom: 6px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-card .value.primary {
  color: #409eff;
}

.question-card {
  padding: 0 0 12px 0;
}

.question-detail {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 16px;
}

.question-detail:last-child {
  border-bottom: none;
}

.question-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-head .title {
  font-weight: 600;
  color: #303133;
}

.question-head .scores span {
  margin-left: 16px;
  color: #606266;
}

.question-body {
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 16px;
}

.answer-block {
  background: #f9fbff;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.answer-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #409eff;
}

.answer-content {
  color: #303133;
  line-height: 1.7;
  word-break: break-word;
}

.answer-content :deep(img),
.question-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.empty-text {
  color: #909399;
}
</style>

