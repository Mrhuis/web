<template>
  <AdminLayout>
    <el-row :gutter="16">
      <el-col :span="6"><el-card class="stat-card"><div>用户数</div><div style="font-size:32px;">{{ stats.users }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div>课程数</div><div style="font-size:32px;">{{ stats.courses }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div>在线人数</div><div style="font-size:32px;">{{ stats.online }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div>预警统计</div><div style="font-size:32px;">{{ stats.warning }}</div></el-card></el-col>
    </el-row>
    <div class="chart-box" id="trend"></div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import AdminLayout from './AdminLayout.vue';

const stats = ref({ users: 1200, courses: 30, online: 56, warning: 8 });

onMounted(() => {
  const chart = echarts.init(document.getElementById('trend'));
  chart.setOption({
    title: { text: '近7天活跃趋势' },
    xAxis: { type: 'category', data: ['7/1','7/2','7/3','7/4','7/5','7/6','7/7'] },
    yAxis: { type: 'value' },
    series: [
      { name: '活跃用户', type: 'line', data: [100,120,130,110,150,160,140] },
      { name: '预警数', type: 'bar', data: [2,3,1,4,2,5,3] }
    ]
  });
});
</script>

<style scoped>
.stat-card { display:inline-block; width:200px; margin:8px; vertical-align:top; }
.chart-box { width:100%; height:320px; margin-bottom:24px; }
</style>
