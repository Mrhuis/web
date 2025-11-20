<template>
  <div class="question-input">
    <div class="question-header">
      <div class="question-number">第{{ questionNumber }}题</div>
      <div class="question-type">{{ getQuestionTypeName(item.formKey) }}</div>
      <div v-if="item.actualScore" class="question-score">分值：{{ item.actualScore }}分</div>
    </div>

    <div class="question-content">
      <div class="question-text" v-html="processedContent"></div>
    </div>

    <!-- 选择题 -->
    <div v-if="item.formKey === 'choice'" class="answer-input">
      <el-radio-group v-model="localAnswer" @change="handleAnswerChange">
        <el-radio
          v-for="(option, key) in parsedOptions"
          :key="key"
          :label="key"
          class="option-radio"
        >
          <span class="option-label">{{ key }}.</span>
          <span class="option-text" v-html="processOptionText(option)"></span>
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 填空题 -->
    <div v-else-if="item.formKey === 'blank'" class="answer-input">
      <MarkdownAnswerEditor
        v-model="localAnswer"
        field-name="blank-answer"
        height="160px"
        placeholder="请输入答案，支持 Markdown 图片..."
      />
    </div>

    <!-- 代码题 -->
    <div v-else-if="item.formKey === 'code'" class="answer-input">
      <div ref="editorRef" class="code-editor"></div>
    </div>

    <!-- 判断题 -->
    <div v-else-if="item.formKey === 'judge'" class="answer-input">
      <el-radio-group v-model="localAnswer" @change="handleAnswerChange">
        <el-radio label="正确">正确</el-radio>
        <el-radio label="错误">错误</el-radio>
      </el-radio-group>
    </div>

    <!-- 问答题 -->
    <div v-else-if="item.formKey === 'qa'" class="answer-input">
      <MarkdownAnswerEditor
        v-model="localAnswer"
        field-name="qa-answer"
        height="220px"
        placeholder="请输入答案，支持 Markdown 图片..."
      />
    </div>

    <!-- 其他类型 -->
    <div v-else class="answer-input">
      <MarkdownAnswerEditor
        v-model="localAnswer"
        field-name="generic-answer"
        height="180px"
        placeholder="请输入答案，支持 Markdown 图片..."
      />
    </div>

    <div class="answer-status">
      <el-tag v-if="hasAnswer" type="success" size="small">
        <el-icon><Check /></el-icon>
        已作答
      </el-tag>
      <el-tag v-else type="info" size="small">
        未作答
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Check } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import { marked } from 'marked'
import { processImagePaths } from '@/utils/imageUtils'
import MarkdownAnswerEditor from './MarkdownAnswerEditor.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  questionNumber: {
    type: Number,
    default: 1
  },
  answer: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:answer', 'change'])

const localAnswer = ref(props.answer || '')
const editorRef = ref(null)
let editor = null

// 监听外部answer变化
watch(() => props.answer, (newVal) => {
  if (newVal !== localAnswer.value) {
    localAnswer.value = newVal || ''
    if (editor && props.item.formKey === 'code') {
      editor.setValue(localAnswer.value)
    }
  }
}, { immediate: true })

// 监听本地答案变化
watch(localAnswer, (newVal) => {
  emit('update:answer', newVal)
  emit('change', newVal)
})

const hasAnswer = computed(() => {
  return localAnswer.value && localAnswer.value.trim() !== ''
})

const parsedOptions = computed(() => {
  if (!props.item.options) return {}
  try {
    if (typeof props.item.options === 'string') {
      return JSON.parse(props.item.options)
    }
    return props.item.options
  } catch (error) {
    console.error('解析选择题选项失败:', error)
    return {}
  }
})

const processedContent = computed(() => {
  const content = props.item.content || ''
  const processed = processImagePaths(content)
  if (isMarkdownFormat(content)) {
    return marked.parse(processed)
  }
  return escapeHtml(processed).replace(/\n/g, '<br>')
})

onMounted(() => {
  if (props.item.formKey === 'code' && editorRef.value) {
    editor = monaco.editor.create(editorRef.value, {
      value: localAnswer.value || '',
      language: 'python',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false }
    })
    
    editor.onDidChangeModelContent(() => {
      localAnswer.value = editor.getValue()
    })
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

function handleAnswerChange() {
  // 答案变化时触发
}

function getQuestionTypeName(formKey) {
  const typeMap = {
    'choice': '选择题',
    'blank': '填空题',
    'code': '编程题',
    'judge': '判断题',
    'qa': '问答题',
    'drawing': '画图题'
  }
  return typeMap[formKey] || '未知题型'
}

function processOptionText(option) {
  const processed = processImagePaths(option)
  if (isMarkdownFormat(option)) {
    return marked.parse(processed)
  }
  return escapeHtml(processed).replace(/\n/g, '<br>')
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
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
  return markdownPatterns.some(pattern => pattern.test(content))
}
</script>

<style scoped>
.question-input {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
  gap: 12px;
}

.question-number {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.question-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.question-score {
  margin-left: auto;
  color: #666;
  font-size: 14px;
}

.question-content {
  margin-bottom: 20px;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word;
  word-break: break-word;
}

.answer-input {
  margin-bottom: 16px;
}

.option-radio {
  display: block;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
}

.option-radio:hover {
  background: #f0f0f0;
}

.option-label {
  font-weight: bold;
  color: #1890ff;
  margin-right: 8px;
}

.option-text {
  line-height: 1.6;
  color: #333;
}

.code-editor {
  height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.answer-status {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* 图片自适应样式 */
.question-text :deep(img),
.option-text :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

