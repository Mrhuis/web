<template>
  <StudentLayout>
    <el-card class="qa-list">
      <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">提问列表</div>
      <el-timeline>
        <el-timeline-item v-for="q in qaList" :key="q.id" :timestamp="q.time" placement="top">
          <div style="font-weight:bold;">{{ q.title }}</div>
          <div v-html="q.content"></div>
          <div style="color:#409eff;">@{{ q.mention }}</div>
          <div class="reply-list">
            <!-- Note: ElComment is not a standard Element Plus component -->
            <div v-for="r in q.replies" :key="r.id">
              <strong>{{ r.author }}:</strong> {{ r.content }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    <el-card>
      <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">我要提问</div>
      <el-input v-model="newTitle" placeholder="标题" style="margin-bottom:8px;"></el-input>
      <el-input type="textarea" v-model="newContent" :rows="4" placeholder="内容，可@教师"></el-input>
      <el-button type="primary" style="margin-top:8px;" @click="submitQA">提交</el-button>
    </el-card>
  </StudentLayout>
</template>

<script setup>
import { ref } from 'vue'
import StudentLayout from './StudentLayout.vue'

const qaList = ref([
  { id: 1, title: '队列的出队复杂度？', content: '请问@张老师，队列的出队操作复杂度是多少？', mention: '张老师', time: '2024-07-21', replies: [
    { id: 1, author: '张老师', content: 'O(1)，因为只需移动指针。' }
  ]}
])
const newTitle = ref('')
const newContent = ref('')

function submitQA() {
  const mention = (newContent.value.match(/@([\u4e00-\u9fa5\w]+)/) || [])[1] || ''
  qaList.value.unshift({
    id: Date.now(),
    title: newTitle.value,
    content: newContent.value,
    mention,
    time: new Date().toLocaleDateString(),
    replies: []
  })
  newTitle.value = ''
  newContent.value = ''
}
</script>

<style scoped>
.qa-list { margin-bottom: 32px; }
.reply-list { margin-left: 32px; margin-top: 8px; }
</style>