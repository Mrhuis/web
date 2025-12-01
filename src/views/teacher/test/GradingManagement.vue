<template>
  <div class="grading-management">
    <div class="section-card">
      <div class="section-header">
        <div>
          <h2>试卷列表</h2>
          <p>选择需要批阅的试卷，支持搜索与分页</p>
        </div>
        <div class="header-actions">
          <el-input
            v-model="paperSearchKeyword"
            placeholder="输入试卷名称搜索"
            clearable
            @clear="handlePaperSearch"
            @keyup.enter="handlePaperSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="handlePaperSearch">搜索</el-button>
        </div>
      </div>
      <el-table
        :data="paperList"
        :row-class-name="paperRowClass"
        highlight-current-row
        v-loading="paperLoading"
        @row-click="handlePaperSelect"
      >
        <el-table-column prop="paperName" label="试卷名称" min-width="220" />
        <el-table-column prop="subject" label="科目" width="140">
          <template #default="{ row }">
            {{ row.subject || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="100">
          <template #default="{ row }">
            {{ row.totalScore ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              plain
              @click.stop="handlePaperSelect(row)"
            >
              进入批阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="paperPagination.current"
        v-model:page-size="paperPagination.size"
        :total="paperPagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50]"
        background
        small
        @current-change="handlePaperPageChange"
        @size-change="handlePaperSizeChange"
      />
    </div>

    <div class="section-card selection-section">
      <div class="section-header">
        <h2>班级与学生</h2>
        <p>按顺序选择班级与学生后开始批阅</p>
      </div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="never" class="selection-card" v-loading="classLoading">
            <template #header>
              <div class="card-header">
                <span>已发布班级</span>
                <el-tag v-if="selectedPaper" size="small" type="info">
                  {{ selectedPaper.paperName }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!selectedPaper" description="请选择试卷后查看班级" />
            <el-empty
              v-else-if="!classList.length"
              description="当前试卷暂无发布班级"
            />
            <el-scrollbar v-else class="list-scroll">
              <div
                v-for="clazz in classList"
                :key="clazz.classKey"
                class="list-row"
                :class="{ active: clazz.classKey === selectedClassKey }"
                @click="handleClassSelect(clazz)"
              >
                <div class="row-title">{{ clazz.name || clazz.classKey }}</div>
                <div class="row-subtitle">班级Key：{{ clazz.classKey }}</div>
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="selection-card" v-loading="studentLoading">
            <template #header>
              <div class="card-header">
                <span>班级学生</span>
                <el-tag v-if="selectedClassKey" size="small" type="success">
                  {{ selectedClassLabel }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!selectedClassKey" description="请选择班级后查看学生" />
            <el-empty
              v-else-if="!studentList.length"
              description="该班级暂无学生"
            />
            <el-scrollbar v-else class="list-scroll">
              <div
                v-for="student in studentList"
                :key="student.userKey"
                class="list-row"
                :class="{ active: student.userKey === selectedStudentKey }"
                @click="handleStudentSelect(student)"
              >
                <div class="row-title">{{ student.nickname || student.userKey }}</div>
                <div class="row-subtitle">角色：{{ student.role || '学生' }}</div>
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="section-card grading-section">
      <div class="section-header">
        <div>
          <h2>批阅工作台</h2>
          <p>查看题目与作答，直接输入得分并保存</p>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            :disabled="!canCompleteGrading"
            @click="handleCompleteGrading"
          >
            完成批阅
          </el-button>
        </div>
      </div>

      <el-empty
        v-if="!selectedStudentKey"
        description="请选择学生后开始批阅"
      />
      <el-empty
        v-else-if="!questionDetails.length && !questionLoading"
        description="该试卷暂未配置题目"
      />
      <div v-else class="grading-content" v-loading="questionLoading">
        <div
          v-for="(question, index) in questionDetails"
          :key="question.itemKey"
          class="question-card"
        >
          <div class="question-card__header">
            <div>
              <div class="question-title">
                第{{ index + 1 }}题 · {{ getQuestionType(question.itemData?.formKey) }}
                <el-tag size="small" type="info">
                  分值：{{ question.actualScore ?? '-' }}
                </el-tag>
              </div>
              <div class="question-item-key">题目标识：{{ question.itemKey }}</div>
            </div>
            <div class="score-box">
              <el-input-number
                v-model="question.scoreInput"
                :precision="1"
                :min="0"
                :max="Number(question.actualScore) || 100"
                :step="0.5"
                :disabled="!question.studentAnswer"
              />
              <el-button
                type="primary"
                size="small"
                plain
                :disabled="!question.studentAnswer"
                @click="handleSaveScore(question)"
              >
                保存评分
              </el-button>
            </div>
          </div>
          <div class="question-card__body">
            <div class="content-block">
              <div class="block-title">题目内容</div>
              <div class="block-content" v-html="renderRichText(question.itemData?.content)"></div>
            </div>
            <div class="content-block">
              <div class="block-title">标准答案</div>
              <div class="block-content" v-html="renderRichText(question.itemData?.answer)"></div>
            </div>
            <div class="content-block">
              <div class="block-title">学生答案</div>
              <div
                v-if="question.studentAnswer?.answer"
                class="block-content"
                v-html="renderRichText(question.studentAnswer.answer)"
              ></div>
              <el-empty v-else description="暂无作答" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { processImagePaths } from '@/utils/imageUtils'
import {
  getExamPaperList
} from '@/api/teacher/teacher_test_manage/teacher_test_manage_api'
import {
  getGradingClasses,
  getGradingStudents,
  getGradingQuestions,
  getStudentAnswerDetail,
  setStudentAnswerScore
} from '@/api/teacher/teacher_test_grading_api'
import { testCenterApi } from '@/api/student/test_center_api'

const paperLoading = ref(false)
const classLoading = ref(false)
const studentLoading = ref(false)
const questionLoading = ref(false)

const paperSearchKeyword = ref('')
const paperList = ref([])
const paperPagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const selectedPaperId = ref(null)
const selectedClassKey = ref('')
const selectedStudentKey = ref('')

const selectedPaper = ref(null)
const classList = ref([])
const studentList = ref([])
const questionDetails = ref([])

onMounted(() => {
  fetchPaperList()
})

watch(
  () => selectedPaperId.value,
  (paperId) => {
    selectedClassKey.value = ''
    selectedStudentKey.value = ''
    classList.value = []
    studentList.value = []
    questionDetails.value = []
    if (paperId) {
      fetchClassList(paperId)
    }
  }
)

watch(
  () => selectedClassKey.value,
  (classKey) => {
    selectedStudentKey.value = ''
    studentList.value = []
    questionDetails.value = []
    if (classKey) {
      fetchStudentList(classKey)
    }
  }
)

watch(
  () => [selectedPaperId.value, selectedStudentKey.value],
  ([paperId, userKey]) => {
    questionDetails.value = []
    if (paperId && userKey) {
      fetchQuestionDetails(paperId, userKey)
    }
  }
)

const canCompleteGrading = computed(() => {
  return Boolean(selectedStudentKey.value && questionDetails.value.length)
})

const selectedClassLabel = computed(() => {
  if (!selectedClassKey.value) return ''
  const clazz = classList.value.find(
    (item) => item.classKey === selectedClassKey.value
  )
  return clazz?.name || clazz?.classKey || selectedClassKey.value
})

async function fetchPaperList() {
  paperLoading.value = true
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key')
    
    const response = await getExamPaperList({
      pageIndex: paperPagination.current,
      pageSize: paperPagination.size,
      paperName: paperSearchKeyword.value || undefined,
      creatorKey: userKey || '' // 只查询当前教师创建的试卷
    })
    if (response.success) {
      paperList.value = response.data?.records || []
      paperPagination.total = response.data?.total || 0
    } else {
      ElMessage.error(response.message || '获取试卷失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取试卷失败')
  } finally {
    paperLoading.value = false
  }
}

async function fetchClassList(paperId) {
  classLoading.value = true
  try {
    const res = await getGradingClasses(paperId)
    if (res.success) {
      classList.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取班级失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取班级失败')
  } finally {
    classLoading.value = false
  }
}

async function fetchStudentList(classKey) {
  studentLoading.value = true
  try {
    const res = await getGradingStudents(classKey)
    if (res.success) {
      studentList.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取学生失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取学生失败')
  } finally {
    studentLoading.value = false
  }
}

async function fetchQuestionDetails(paperId, userKey) {
  questionLoading.value = true
  try {
    const questionRes = await getGradingQuestions(paperId)
    if (!questionRes.success) {
      ElMessage.error(questionRes.message || '获取题目失败')
      questionLoading.value = false
      return
    }

    const baseList = (questionRes.data || []).sort(
      (a, b) => (a.sortNum || 0) - (b.sortNum || 0)
    )

    const detailPromises = baseList.map(async (question) => {
      const [itemRes, answerRes] = await Promise.allSettled([
        testCenterApi.getItemByItemKey(question.itemKey),
        getStudentAnswerDetail({
          userKey,
          paperId,
          itemKey: question.itemKey
        })
      ])

      const itemData =
        itemRes.status === 'fulfilled' && itemRes.value?.data
          ? itemRes.value.data
          : null
      const studentAnswer =
        answerRes.status === 'fulfilled' && answerRes.value?.data
          ? answerRes.value.data
          : null

      let normalizedScore = null
      if (
        studentAnswer &&
        studentAnswer.score !== undefined &&
        studentAnswer.score !== null
      ) {
        normalizedScore = Number(studentAnswer.score)
      } else if (studentAnswer) {
        normalizedScore = 0
      }

      return {
        ...question,
        itemData,
        studentAnswer,
        scoreInput: normalizedScore
      }
    })

    questionDetails.value = await Promise.all(detailPromises)
  } catch (error) {
    console.error(error)
    ElMessage.error('加载批阅数据失败')
  } finally {
    questionLoading.value = false
  }
}

function handlePaperSelect(row) {
  selectedPaperId.value = row.id
  selectedPaper.value = row
}

function handleClassSelect(clazz) {
  selectedClassKey.value = clazz.classKey
}

function handleStudentSelect(student) {
  selectedStudentKey.value = student.userKey
}

function handlePaperSearch() {
  paperPagination.current = 1
  fetchPaperList()
}

function handlePaperPageChange(page) {
  paperPagination.current = page
  fetchPaperList()
}

function handlePaperSizeChange(size) {
  paperPagination.size = size
  paperPagination.current = 1
  fetchPaperList()
}

function paperRowClass({ row }) {
  return row.id === selectedPaperId.value ? 'is-active-row' : ''
}

function getQuestionType(formKey) {
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

function isMarkdownFormat(content) {
  if (!content) return false
  const markdownPatterns = [
    /^#{1,6}\s+/m,
    /\*\*([^*]+)\*\*/g,
    /\*([^*]+)\*/g,
    /`([^`]+)`/g,
    /```[\s\S]*?```/g,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /\[([^\]]+)\]\(([^)]+)\)/g,
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    /^\s*>\s+/m,
    /^\s*\|.*\|.*\|/m,
    /^---+$/m,
    /~~([^~]+)~~/g
  ]
  return markdownPatterns.some((pattern) => pattern.test(content))
}

function renderRichText(content) {
  if (!content) {
    return '<span class="text-muted">暂无内容</span>'
  }
  const processed = processImagePaths(content)
  if (isMarkdownFormat(content)) {
    return marked.parse(processed)
  }
  return processed.replace(/\n/g, '<br>')
}

async function handleSaveScore(question, showMessage = true) {
  if (!question.studentAnswer) {
    ElMessage.warning('该题暂无作答，无法评分')
    return
  }
  if (question.scoreInput === null || question.scoreInput === undefined) {
    ElMessage.warning('请输入得分')
    return
  }
  try {
    const res = await setStudentAnswerScore({
      userKey: selectedStudentKey.value,
      paperId: selectedPaperId.value,
      itemKey: question.itemKey,
      score: question.scoreInput
    })
    if (res.success) {
      question.studentAnswer = question.studentAnswer || {}
      question.studentAnswer.score = question.scoreInput
      if (showMessage) {
        ElMessage.success('评分已保存')
      }
    } else {
      ElMessage.error(res.message || '保存评分失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('保存评分失败')
  }
}

async function handleCompleteGrading() {
  if (!canCompleteGrading.value) return

  const unanswered = questionDetails.value.filter(
    (q) => !q.studentAnswer || !q.studentAnswer.answer
  )
  const unsaved = questionDetails.value.filter((q) => {
    const current = q.scoreInput
    const hasSavedScore =
      q.studentAnswer &&
      q.studentAnswer.score !== undefined &&
      q.studentAnswer.score !== null
    const saved = hasSavedScore ? Number(q.studentAnswer.score) : null
    return current !== null && current !== undefined && current !== saved
  })

  if (unsaved.length > 0) {
    const confirmed = await ElMessageBox.confirm(
      `仍有 ${unsaved.length} 道题未保存得分，是否立即保存？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '保存并完成',
        cancelButtonText: '取消'
      }
    ).catch(() => false)
    if (!confirmed) {
      return
    }
    for (const question of unsaved) {
      await handleSaveScore(question, false)
    }
  }

  const message =
    unanswered.length > 0
      ? `批阅完成，${unanswered.length} 道题学生暂无作答，默认记为0分`
      : '批阅完成'
  ElMessage.success(message)
}
</script>

<style scoped>
.grading-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.section-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.selection-section .selection-card {
  height: 360px;
}

.list-scroll {
  max-height: 280px;
}

.list-row {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.list-row.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}

.row-title {
  font-weight: 600;
  color: #0f172a;
}

.row-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.question-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
}

.question-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-item-key {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.score-box {
  display: flex;
  gap: 8px;
  align-items: center;
}

.question-card__body {
  display: grid;
  gap: 16px;
}

.content-block {
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}

.block-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.block-content {
  color: #1f2937;
  line-height: 1.7;
  word-break: break-word;
}

.block-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 8px 0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.text-muted {
  color: #94a3b8;
  font-size: 13px;
}

.grading-section {
  position: relative;
}

.grading-content {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 8px;
}

.is-active-row {
  --el-table-tr-bg-color: rgba(59, 130, 246, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

