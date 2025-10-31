<template>
  <AdminLayout>
    <div class="chart-box" id="jvm"></div>
    <div class="chart-box" id="cpu"></div>
    <div class="chart-box" id="mem"></div>
    <el-card style="margin-bottom:16px;">
      <div style="font-size:16px;font-weight:bold;">日志实时 tail</div>
      <div class="log-box" ref="logBox">{{ logs.join('\n') }}</div>
      <el-button type="primary" style="margin-top:8px;" @click="exportLog">导出日志zip</el-button>
    </el-card>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import AdminLayout from './AdminLayout.vue';

const logs = ref(['[INFO] 系统启动', '[WARN] CPU使用率高']);
function exportLog() { alert('日志已导出为zip！'); }

onMounted(() => {
  const jvm = echarts.init(document.getElementById('jvm'));
  jvm.setOption({ title:{text:'JVM'}, xAxis:{type:'category',data:['10:00','10:05','10:10']}, yAxis:{}, series:[{data:[60,70,65],type:'line'}] });
  const cpu = echarts.init(document.getElementById('cpu'));
  cpu.setOption({ title:{text:'CPU'}, xAxis:{type:'category',data:['10:00','10:05','10:10']}, yAxis:{}, series:[{data:[40,80,55],type:'line'}] });
  const mem = echarts.init(document.getElementById('mem'));
  mem.setOption({ title:{text:'内存'}, xAxis:{type:'category',data:['10:00','10:05','10:10']}, yAxis:{}, series:[{data:[30,50,45],type:'line'}] });
  // 模拟WebSocket实时日志
  setInterval(()=>{ logs.value.push('[INFO] Heartbeat '+new Date().toLocaleTimeString()); }, 5000);
});
</script>

<style scoped>
.chart-box { width:100%; height:220px; margin-bottom:16px; }
.log-box { background:#222; color:#fff; font-family:monospace; height:180px; overflow:auto; padding:8px; }
</style>