<template>
  <StudentLayout>
    <div class="test-center-page">
      <div class="page-header">
        <div>
          <h2>测验中心</h2>
          <p class="subtitle">在同一个页面中完成考试安排与结果查询</p>
        </div>
      </div>

      <el-tabs
        v-model="activeTab"
        class="test-center-tabs"
        @tab-click="handleTabClick"
      >
        <el-tab-pane label="测验中心" name="list" />
        <el-tab-pane label="测验结果" name="results" />
      </el-tabs>

      <div class="tab-content">
        <router-view />
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentLayout from '../StudentLayout.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed({
  get() {
    return route.path.includes('/student/test-center/results') ? 'results' : 'list'
  },
  set(value) {
    pushByTabName(value)
  }
})

function handleTabClick(tab) {
  const tabName = tab.paneName || tab.props?.name
  pushByTabName(tabName)
}

function pushByTabName(name) {
  if (name === 'results') {
    router.push('/student/test-center/results')
  } else {
    router.push('/student/test-center/list')
  }
}
</script>

<style scoped>
.test-center-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.test-center-tabs {
  margin-bottom: 24px;
}

.tab-content {
  min-height: 400px;
}
</style>

