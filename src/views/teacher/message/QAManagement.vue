<template>
  <TeacherLayout>
    <el-card class="qa-list">
      <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">待答复问题</div>
      <el-table :data="qaList" style="width:100%;">
        <el-table-column prop="title" label="问题" width="300" />
        <el-table-column prop="student" label="提问学生" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status==='open'" type="warning">未答复</el-tag>
            <el-tag v-else type="success">已解决</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button size="small" @click="reply(scope.$index)">回复</el-button>
            <el-button size="small" @click="top(scope.$index)">置顶</el-button>
            <el-button size="small" @click="resolve(scope.$index)">标记已解决</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="showReply" title="批量回复" width="400px">
      <el-input type="textarea" v-model="replyContent" rows="4" placeholder="输入回复内容"></el-input>
      <template #footer>
        <el-button @click="showReply=false">取消</el-button>
        <el-button type="primary" @click="submitReply">提交</el-button>
      </template>
    </el-dialog>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import TeacherLayout from '../layout/TeacherLayout.vue';

const qaList = ref([
  { title: '队列的出队复杂度？', student: '学生A', status: 'open' },
  { title: '栈的定义？', student: '学生B', status: 'solved' }
]);
const showReply = ref(false);
const replyContent = ref('');
function reply(idx) { showReply.value = true; }
function top(idx) { qaList.value.unshift(qaList.value.splice(idx,1)[0]); }
function resolve(idx) { qaList.value[idx].status = 'solved'; }
function submitReply() { showReply.value = false; replyContent.value = ''; }
</script>

<style scoped>
.qa-list { margin-bottom: 32px; }
.reply-box { margin-top: 8px; }
.highlight { background: #fffbe6; }
</style>
