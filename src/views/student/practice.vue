<template>
  <StudentLayout>
    <div class="content-wrapper">
      <div class="desc-panel">
        <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">{{ item.title }}</div>
        <div v-html="itemHtml"></div>
      </div>
      <div class="editor-panel">
        <div v-if="item.type==='code'">
          <div ref="editorRef" id="editor"></div>
        </div>
        <div v-else-if="item.type==='choice'">
          <el-radio-group v-model="userAnswer">
            <el-radio v-for="(opt, idx) in item.options" :key="idx" :label="opt">{{ opt }}</el-radio>
          </el-radio-group>
        </div>
        <div v-else-if="item.type==='blank'">
          <el-input v-model="userAnswer" placeholder="请输入答案"></el-input>
        </div>
        <div class="bottom-bar">
          <el-button type="primary" @click="submit">提交</el-button>
          <el-button @click="showAnim">动画讲解</el-button>
          <el-button @click="next">下一题推荐</el-button>
        </div>
        <el-alert v-if="judgeResult!==null" :title="judgeResult ? '回答正确' : '回答错误'" :type="judgeResult ? 'success' : 'error'" show-icon style="margin-top:16px;" />
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as monaco from 'monaco-editor'
import { marked } from 'marked'
import { useRouter } from 'vue-router'
import StudentLayout from './StudentLayout.vue'

const router = useRouter()
const item = ref({
  title: '实现队列的基本操作',
  type: 'code',
  content: '```python\nclass Queue:\n    def __init__(self):\n        self.data = []\n    def enqueue(self, x):\n        self.data.append(x)\n    def dequeue(self):\n        return self.data.pop(0)\n```',
  options: ['A. 先进先出', 'B. 后进先出', 'C. 随机访问'],
  answer: 'A. 先进先出'
})
const userAnswer = ref('')
const judgeResult = ref(null)
const itemHtml = computed(() => marked.parse(item.value.content || ''))
const editorRef = ref(null)
let editor

onMounted(() => {
  if(item.value.type==='code' && editorRef.value) {
    editor = monaco.editor.create(editorRef.value, {
      value: '# 在此编写代码',
      language: 'python',
      theme: 'vs',
      automaticLayout: true
    })
  }
})

function submit() {
  let answer = userAnswer.value
  if(item.value.type==='code' && editor) answer = editor.getValue()
  judgeResult.value = answer && answer.includes('self.data')
  // Mock submission
}

function showAnim() {
  router.push('/student/anim?knowledgeId=K005')
}

function next() {
  window.location.reload()
}
</script>

<style scoped>
.content-wrapper { display: flex; width: 100%; }
.desc-panel { width: 40%; padding-right: 24px; }
.editor-panel { width: 60%; }
.bottom-bar { margin-top: 24px; text-align: right; }
#editor { height: 320px; border: 1px solid #eee; }
</style>