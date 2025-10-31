<template>
  <StudentLayout>
    <el-button type="primary" size="small" @click="exportPDF" style="float: right; margin-bottom: 16px;">导出PDF报告</el-button>
    <div class="charts-row">
      <div class="chart-box" ref="radarRef"></div>
      <div class="chart-box" ref="lineRef"></div>
    </div>
    <el-table :data="wrongList" class="wrong-table" style="width:100%;">
      <el-table-column prop="title" label="错题" width="300" />
      <el-table-column prop="lastTime" label="最近作答时间" width="180" />
      <el-table-column prop="count" label="错误次数" width="120" />
    </el-table>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import jsPDF from 'jspdf'
import StudentLayout from './StudentLayout.vue'

const wrongList = ref([
  { title: '队列基本操作', lastTime: '2024-07-01', count: 2 },
  { title: '栈与递归', lastTime: '2024-07-10', count: 1 }
])
const radarRef = ref(null)
const lineRef = ref(null)

onMounted(() => {
  const radar = echarts.init(radarRef.value)
  radar.setOption({
    title: { text: '能力雷达图' },
    radar: { indicator: [
      { name: '队列', max: 100 }, { name: '栈', max: 100 }, { name: '树', max: 100 },
      { name: '图', max: 100 }, { name: '查找', max: 100 }
    ] },
    series: [{ type: 'radar', data: [{ value: [60, 80, 70, 50, 90], name: '掌握度' }] }]
  })
  const line = echarts.init(lineRef.value)
  line.setOption({
    title: { text: '学习时长（分钟）' },
    xAxis: { type: 'category', data: ['7/1','7/2','7/3','7/4','7/5','7/6','7/7'] },
    yAxis: { type: 'value' },
    series: [{ data: [30, 40, 20, 50, 60, 35, 45], type: 'line' }]
  })
})

function exportPDF() {
  const doc = new jsPDF()
  doc.text('个人学习报告', 10, 10)
  doc.text('（此处可扩展为截图或详细内容）', 10, 20)
  doc.save('insight.pdf')
}
</script>

<style scoped>
.charts-row { display: flex; gap: 24px; margin-bottom: 32px; }
.chart-box { flex: 1; height: 320px; background: #fff; border: 1px solid #eee; }
.wrong-table { margin-bottom: 32px; }
</style>