<template>
  <div class="result-container">
    <div class="header">
      <div>
        <h2>测验结果</h2>
        <p class="subtitle">查看已完成考试记录，可进入详情查看每道题的评分情况</p>
      </div>
    </div>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
        empty-text="暂无完成的考试记录"
      >
        <el-table-column prop="paperName" label="试卷名称" min-width="180">
          <template #default="{ row }">
            <div class="paper-name">{{ row.paperName || '-' }}</div>
            <div class="paper-meta">
              <el-tag size="small" type="info">{{ row.subject || '未设置' }}</el-tag>
              <el-tag size="small" style="margin-left: 8px;">{{ getDifficultyText(row.difficulty) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="得分 / 总分" min-width="140">
          <template #default="{ row }">
            <div class="score-text">
              {{ formatScore(row.obtainedScore) }} / {{ row.totalScore ?? '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题目数" width="100">
          <template #default="{ row }">
            {{ row.questionCount ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.completeTime) }}
          </template>
        </el-table-column>
        <el-table-column label="评分状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.graded ? 'success' : 'warning'">
              {{ row.canViewDetail === false ? '未评分' : (row.graded ? '已评分' : '待评分') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.canViewDetail !== false" 
              type="primary" 
              link 
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
            <span v-else class="disabled-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :current-page="pagination.current"
          :page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[5, 10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { testCenterResultApi } from '@/api/student/test_center_result_api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const records = ref([])
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

onMounted(() => {
  fetchCompletedPapers()
})

async function fetchCompletedPapers() {
  if (!userStore.userKey) {
    ElMessage.error('请先登录')
    return
  }

  loading.value = true
  try {
    const res = await testCenterResultApi.getCompletedPapers({
      userKey: userStore.userKey,
      page: pagination.current,
      size: pagination.size
    })
    if (res.success) {
      records.value = res.data?.records || []
      pagination.total = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '获取测验结果失败')
    }
  } catch (error) {
    console.error('获取测验结果失败', error)
    ElMessage.error('获取测验结果失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  pagination.current = page
  fetchCompletedPapers()
}

function handleSizeChange(size) {
  pagination.size = size
  pagination.current = 1
  fetchCompletedPapers()
}

function viewDetail(row) {
  if (!row.paperId) {
    ElMessage.warning('试卷信息不存在')
    return
  }
  router.push({
    name: 'StudentTestResultDetail',
    params: { paperId: row.paperId },
    query: {
      paperName: row.paperName,
      totalScore: row.totalScore,
      obtainedScore: formatScore(row.obtainedScore),
      completeTime: row.completeTime,
      graded: row.graded,
      subject: row.subject,
      difficulty: row.difficulty
    }
  })
}

function getDifficultyText(difficulty) {
  const map = {
    1: '简单',
    2: '中等',
    3: '困难'
  }
  return map[difficulty] || '未设置'
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

function formatScore(score) {
  if (score === null || score === undefined) return '0'
  const num = Number(score)
  if (Number.isNaN(num)) return '0'
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)
}
</script>

<style scoped>
.result-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px;
}

.subtitle {
  margin: 0;
  color: #666;
}

.table-card {
  padding: 0 0 16px 0;
}

.paper-name {
  font-weight: 600;
  color: #303133;
}

.paper-meta {
  margin-top: 6px;
}

.score-text {
  font-weight: 600;
  color: #409EFF;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.disabled-text {
  color: #c0c4cc;
}
</style>

