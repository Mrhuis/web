<template>
  <TeacherLayout>
    <div class="chart-box" id="classRadar"></div>
    <el-table :data="warningList" style="width:100%;margin-bottom:24px;">
      <el-table-column prop="class" label="班级" width="180" />
      <el-table-column prop="warning" label="预警学生数" width="180" />
    </el-table>
    <div style="font-size:18px;font-weight:bold;margin-bottom:8px;">学生列表</div>
    <el-card v-for="stu in studentList" :key="stu.id" class="student-card" @click="showInsight(stu)">
      <div>{{ stu.name }}</div>
      <div>掌握度：{{ stu.mastery }}%</div>
    </el-card>
    <el-dialog v-model="insightVisible" title="学生洞察" width="800px" class="insight-modal">
      <div class="chart-box" id="insightRadar"></div>
      <div class="chart-box" id="insightLine"></div>
    </el-dialog>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import TeacherLayout from '../layout/TeacherLayout.vue';

const warningList = ref([
  { class: 'A班', warning: 2 },
  { class: 'B班', warning: 1 }
]);
const studentList = ref([
  { id: 1, name: '学生A', mastery: 80 },
  { id: 2, name: '学生B', mastery: 60 }
]);
const insightVisible = ref(false);

function showInsight(stu) {
  insightVisible.value = true;
  nextTick(() => {
    const radar = echarts.init(document.getElementById('insightRadar'));
    radar.setOption({
      title: { text: '能力雷达图' },
      radar: { indicator: [
        { name: '队列', max: 100 }, { name: '栈', max: 100 }, { name: '树', max: 100 },
        { name: '图', max: 100 }, { name: '查找', max: 100 }
      ] },
      series: [{ type: 'radar', data: [{ value: [60, 80, 70, 50, 90], name: '掌握度' }] }]
    });
    const line = echarts.init(document.getElementById('insightLine'));
    line.setOption({
      title: { text: '学习时长（分钟）' },
      xAxis: { type: 'category', data: ['7/1','7/2','7/3','7/4','7/5','7/6','7/7'] },
      yAxis: { type: 'value' },
      series: [{ data: [30, 40, 20, 50, 60, 35, 45], type: 'line' }]
    });
  });
}

onMounted(() => {
  const radar = echarts.init(document.getElementById('classRadar'));
  radar.setOption({
    title: { text: '班级平均掌握度' },
    radar: { indicator: [
      { name: 'A班', max: 100 }, { name: 'B班', max: 100 }
    ] },
    series: [{ type: 'radar', data: [{ value: [80, 60], name: '平均掌握度' }] }]
  });
});
</script>

<style scoped>
.student-card { display:inline-block; width:180px; margin:8px; vertical-align:top; }
.insight-modal { width: 800px; }
.chart-box { width:100%; height:320px; margin-bottom:24px; }
</style>
