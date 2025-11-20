<template>
  <StudentLayout :hide-sidebar="true">
    <div class="exam-paper-container" v-loading="loading">
      <!-- 试卷头部信息 -->
      <div class="paper-header">
        <div class="header-left">
          <h2>{{ paperInfo.title }}</h2>
          <div v-if="paperInfo.description" class="paper-description">
            {{ paperInfo.description }}
          </div>
        </div>
        <div class="header-right">
          <div v-if="countdownVisible" class="timer-panel">
            <div class="timer-label">倒计时</div>
            <div :class="['timer-value', countdownDanger ? 'danger' : '']">{{ countdownText }}</div>
            <div v-if="paperInfo.deadlineTime" class="timer-deadline">
              截止：{{ formatDateTime(paperInfo.deadlineTime) }}
            </div>
          </div>
          <el-button type="primary" @click="submitExam" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交试卷' }}
          </el-button>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </div>

      <!-- 题目导航 -->
      <div class="question-nav">
        <div class="nav-title">题目导航</div>
        <div class="nav-buttons">
          <el-button
            v-for="(question, index) in questions"
            :key="question.id"
            :type="currentQuestionIndex === index ? 'primary' : (answers[question.itemKey] ? 'success' : '')"
            :circle="true"
            size="small"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
          </el-button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="questions-container">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          :ref="el => questionRefs[index] = el"
          class="question-wrapper"
          :class="{ active: currentQuestionIndex === index }"
        >
          <QuestionInput
            :item="question.itemData"
            :question-number="index + 1"
            :answer="answers[question.itemKey] || ''"
            @update:answer="(value) => handleAnswerChange(question.itemKey, value)"
            @change="(value) => handleAnswerChange(question.itemKey, value)"
          />
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-actions">
        <el-button @click="prevQuestion" :disabled="currentQuestionIndex === 0">
          上一题
        </el-button>
        <el-button type="primary" @click="saveAllAnswers">
          保存全部答案
        </el-button>
        <el-button @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1">
          下一题
        </el-button>
        <div class="progress-info">
          <span>已作答：{{ answeredCount }} / {{ questions.length }}</span>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StudentLayout from '../StudentLayout.vue'
import QuestionInput from './components/QuestionInput.vue'
import { useUserStore } from '@/store/user'
import { testCenterApi } from '@/api/student/test_center_api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const paperId = ref(Number(route.params.paperId))
const examCompleted = ref(false)
const paperInfo = ref({ title: '' })
const questions = ref([])
const answers = ref({})
const currentQuestionIndex = ref(0)
const questionRefs = ref([])
const remainingSeconds = ref(null)
const timerStatus = ref('idle')
const timerMeta = ref(null)
const autoSubmitTriggered = ref(false)
let countdownTimer = null

const answeredCount = computed(() => {
  return Object.values(answers.value).filter(answer => answer && answer.trim() !== '').length
})

const timerMetaKey = computed(() => buildTimerMetaKey(userStore.userKey, paperId.value))

const countdownVisible = computed(() => remainingSeconds.value !== null)

const countdownText = computed(() => {
  if (remainingSeconds.value === null) {
    return '未限制'
  }
  const seconds = Math.max(0, remainingSeconds.value)
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${secs}`
})

const countdownDanger = computed(() => {
  return remainingSeconds.value !== null && remainingSeconds.value <= 60
})

onMounted(async () => {
  hydrateTimerMeta()
  if (!paperId.value) {
    ElMessage.error('试卷ID无效')
    router.push('/student/test-center')
    return
  }
  const available = await ensureExamAvailable()
  if (available) {
    loadExamPaper()
  }
})

onBeforeUnmount(() => {
  cleanupTimer()
})

/**
 * 加载试卷信息
 */
async function loadExamPaper() {
  loading.value = true
  try {
    // 加载试卷题目列表
    const questionsResponse = await testCenterApi.getQuestionsByPaperId(paperId.value)
    if (questionsResponse.success === false) {
      ElMessage.error(questionsResponse.message || '加载试卷失败')
      router.push('/student/test-center')
      return
    }

    const questionList = questionsResponse.data || []
    
    // 加载每个题目的详细信息
    const questionPromises = questionList.map(async (q) => {
      try {
        const itemResponse = await testCenterApi.getItemByItemKey(q.itemKey)
        if (itemResponse.success !== false && itemResponse.data) {
          return {
            ...q,
            itemData: itemResponse.data
          }
        }
        return null
      } catch (error) {
        console.error(`加载题目 ${q.itemKey} 失败:`, error)
        return null
      }
    })

    const loadedQuestions = await Promise.all(questionPromises)
    questions.value = loadedQuestions.filter(q => q !== null).sort((a, b) => (a.sortNum || 0) - (b.sortNum || 0))

    // 加载已保存的答案
    await loadSavedAnswers()

    // 滚动到第一题
    nextTick(() => {
      scrollToQuestion(0)
    })
  } catch (error) {
    console.error('加载试卷失败:', error)
    ElMessage.error('加载试卷失败')
    router.push('/student/test-center')
  } finally {
    loading.value = false
  }
}

/**
 * 加载已保存的答案
 */
async function loadSavedAnswers() {
  if (!userStore.userKey) return

  const answerPromises = questions.value.map(async (q) => {
    try {
      const response = await testCenterApi.getAnswerByUserKeyPaperIdItemKey({
        userKey: userStore.userKey,
        paperId: paperId.value,
        itemKey: q.itemKey
      })
      if (response.success !== false && response.data && response.data.answer) {
        return {
          itemKey: q.itemKey,
          answer: response.data.answer
        }
      }
      return null
    } catch (error) {
      console.error(`加载答案 ${q.itemKey} 失败:`, error)
      return null
    }
  })

  const savedAnswers = await Promise.all(answerPromises)
  savedAnswers.forEach(result => {
    if (result) {
      answers.value[result.itemKey] = result.answer
    }
  })
}

/**
 * 处理答案变化
 */
function handleAnswerChange(itemKey, value) {
  answers.value[itemKey] = value
}

/**
 * 保存所有答案
 */
async function saveAllAnswers(showSuccessMessage = true) {
  if (!userStore.userKey) return

  try {
    const savePromises = questions.value.map((q) => {
      return testCenterApi.saveOrUpdateAnswer({
        userKey: userStore.userKey,
        paperId: paperId.value,
        itemKey: q.itemKey,
        answer: answers.value[q.itemKey] || ''
      })
    })

    await Promise.all(savePromises)
    if (showSuccessMessage) {
      ElMessage.success('所有答案已保存')
    }
  } catch (error) {
    console.error('保存所有答案失败:', error)
    ElMessage.error('保存答案失败')
    throw error
  }
}

/**
 * 提交试卷
 */
async function submitExam(options = {}) {
  const { skipConfirm = false } = options
  if (!userStore.userKey) {
    ElMessage.error('请先登录')
    return
  }

  // 检查是否所有题目都已作答
  const unansweredCount = questions.value.filter(q => {
    const answer = answers.value[q.itemKey]
    return !answer || answer.trim() === ''
  }).length

  if (!skipConfirm && unansweredCount > 0) {
    const confirmed = await ElMessageBox.confirm(
      `还有 ${unansweredCount} 道题未作答，确定要提交吗？`,
      '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false)

    if (!confirmed) return
  }

  submitting.value = true
  try {
    // 先保存所有答案
    await saveAllAnswers(false)

    // 提交试卷
    const response = await testCenterApi.completeExam(userStore.userKey, paperId.value)
    if (response.success !== false) {
      ElMessage.success('试卷提交成功')
      clearTimerMeta()
      router.push('/student/test-center')
    } else {
      ElMessage.error(response.message || '提交试卷失败')
    }
  } catch (error) {
    console.error('提交试卷失败:', error)
    ElMessage.error('提交试卷失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 跳转到指定题目
 */
function goToQuestion(index) {
  currentQuestionIndex.value = index
  scrollToQuestion(index)
}

/**
 * 滚动到指定题目
 */
function scrollToQuestion(index) {
  nextTick(() => {
    if (questionRefs.value[index]) {
      questionRefs.value[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

/**
 * 上一题
 */
function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    scrollToQuestion(currentQuestionIndex.value)
  }
}

/**
 * 下一题
 */
function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    scrollToQuestion(currentQuestionIndex.value)
  }
}

/**
 * 返回列表
 */
function goBack() {
  router.push('/student/test-center')
}

/**
 * 检查当前考试是否允许进入
 */
async function ensureExamAvailable() {
  if (!userStore.userKey) {
    ElMessage.error('请先登录')
    router.push('/student/test-center')
    return false
  }

  try {
    loading.value = true
    const response = await testCenterApi.checkExamCompleted(userStore.userKey, paperId.value)
    if (response && response.success !== false) {
      examCompleted.value = parseExamCompletedFlag(response.data)
    }

    if (examCompleted.value) {
      ElMessage.warning('该考试已完成，不能再次进入')
      router.push('/student/test-center')
      return false
    }
    return true
  } catch (error) {
    console.error('检查考试状态失败:', error)
    ElMessage.error('检查考试状态失败，请稍后重试')
    router.push('/student/test-center')
    return false
  } finally {
    loading.value = false
  }
}

/**
 * 解析考试完成标记
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

function hydrateTimerMeta() {
  const meta = readTimerMeta()
  if (!meta) {
    paperInfo.value = paperInfo.value.title ? paperInfo.value : { title: '考试试卷' }
    return
  }
  timerMeta.value = meta
  paperInfo.value = {
    ...paperInfo.value,
    title: meta.title || '考试试卷',
    timeLimitSeconds: meta.timeLimitSeconds,
    deadlineTime: meta.deadlineTime
  }
  if (!meta.startTime) {
    meta.startTime = Date.now()
    meta.lastHeartbeat = meta.startTime
    writeTimerMeta(meta)
  }
  startCountdown(meta)
}

function startCountdown(meta) {
  const firstRemaining = calculateRemainingSeconds(meta, Date.now())
  if (firstRemaining === null) {
    remainingSeconds.value = null
    timerStatus.value = 'idle'
    return
  }
  remainingSeconds.value = firstRemaining
  timerStatus.value = firstRemaining > 0 ? 'running' : 'expired'
  if (firstRemaining <= 0) {
    handleTimeUp()
    return
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  countdownTimer = window.setInterval(() => {
    const latestMeta = readTimerMeta()
    if (!latestMeta) {
      cleanupTimer()
      remainingSeconds.value = null
      timerStatus.value = 'idle'
      return
    }
    const now = Date.now()
    const remain = calculateRemainingSeconds(latestMeta, now)
    remainingSeconds.value = remain
    latestMeta.lastHeartbeat = now
    if (!latestMeta.startTime) {
      latestMeta.startTime = now
    }
    writeTimerMeta(latestMeta)
    if (remain === null) {
      timerStatus.value = 'idle'
      cleanupTimer()
    } else if (remain <= 0) {
      timerStatus.value = 'expired'
      cleanupTimer()
      handleTimeUp()
    } else {
      timerStatus.value = 'running'
    }
  }, 1000)
}

function calculateRemainingSeconds(meta, nowMs) {
  if (!meta) return null
  const startMs = meta.startTime || nowMs
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000))
  const limitSeconds = typeof meta.timeLimitSeconds === 'number' && meta.timeLimitSeconds > 0
    ? Math.max(0, Math.floor(meta.timeLimitSeconds - elapsedSeconds))
    : null
  const deadlineSeconds = meta.deadlineTime
    ? Math.max(0, Math.floor((new Date(meta.deadlineTime).getTime() - nowMs) / 1000))
    : null
  const candidates = [limitSeconds, deadlineSeconds].filter(value => value !== null)
  if (!candidates.length) {
    return null
  }
  return Math.min(...candidates)
}

function handleTimeUp() {
  if (autoSubmitTriggered.value) return
  autoSubmitTriggered.value = true
  ElMessage.warning('考试时间已到，正在自动提交试卷')
  submitExam({ skipConfirm: true }).catch(() => {
    autoSubmitTriggered.value = false
    ElMessage.error('自动提交失败，请手动提交')
  })
}

function cleanupTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function readTimerMeta() {
  if (typeof window === 'undefined') return null
  if (!timerMetaKey.value) return null
  const raw = window.localStorage.getItem(timerMetaKey.value)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('解析计时元数据失败:', error)
    return null
  }
}

function writeTimerMeta(meta) {
  if (typeof window === 'undefined' || !timerMetaKey.value || !meta) return
  window.localStorage.setItem(timerMetaKey.value, JSON.stringify(meta))
}

function clearTimerMeta() {
  if (typeof window === 'undefined' || !timerMetaKey.value) return
  window.localStorage.removeItem(timerMetaKey.value)
}

function buildTimerMetaKey(userKey, id) {
  if (!id) return null
  const key = userKey || 'guest'
  return `exam_timer_meta_${key}_${id}`
}

function formatDateTime(dateTime) {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.exam-paper-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 100px;
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.paper-description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.timer-panel {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  min-width: 160px;
  text-align: right;
}

.timer-label {
  font-size: 12px;
  color: #909399;
}

.timer-value {
  font-size: 20px;
  font-weight: 600;
  color: #67c23a;
  letter-spacing: 1px;
}

.timer-value.danger {
  color: #f56c6c;
}

.timer-deadline {
  font-size: 12px;
  color: #606266;
}

.question-nav {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.nav-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-wrapper {
  scroll-margin-top: 20px;
}

.question-wrapper.active {
  border-left: 4px solid #1890ff;
  padding-left: 16px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 24px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  z-index: 100;
}

.progress-info {
  margin-left: auto;
  color: #666;
  font-size: 14px;
}
</style>

