<template>
  <div class="code-item-display">
    <div class="question-header">
      <div class="question-number">第{{ questionNumber }}题</div>
      <div class="question-type">编程题</div>
    </div>

    <div class="question-content">
      <div class="question-text" v-html="processedContent"></div>
    </div>

    <div class="answer-section" v-if="showAnswer">
      <div class="reference-answer">
        <span class="answer-label">参考答案：</span>
        <pre v-if="isCodeAnswer" class="code-answer">{{ item.answer }}</pre>
        <div v-else v-html="processedAnswer"></div>
      </div>
      <div class="explanation" v-if="item.solution">
        <span class="explanation-label">解析：</span>
        <div class="explanation-content" v-html="processedSolution"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { processImagePaths } from '@/utils/imageUtils'
import { marked } from 'marked'
export default {
  name: 'CodeItemDisplay',
  props: {
    item: {
      type: Object,
      required: true
    },
    questionNumber: {
      type: Number,
      default: 1
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    processedContent() {
      const content = this.item.content || ''
      const processed = processImagePaths(content)
      if (this.isMarkdownFormat(content)) {
        return marked.parse(processed)
      }
      return this.escapeHtml(processed).replace(/\n/g, '<br>')
    },
    processedAnswer() {
      const answer = this.item.answer || ''
      const processed = processImagePaths(answer)
      if (this.isMarkdownFormat(answer)) {
        return marked.parse(processed)
      }
      return this.escapeHtml(processed).replace(/\n/g, '<br>')
    },
    processedSolution() {
      const solution = this.item.solution || ''
      const processed = processImagePaths(solution)
      if (this.isMarkdownFormat(solution)) {
        return marked.parse(processed)
      }
      return this.escapeHtml(processed).replace(/\n/g, '<br>')
    },
    isCodeAnswer() {
      const answer = this.item.answer || ''
      // 若内容包含多于5个换行符，或包含常见C/Java/Python函数声明，判为代码
      return answer.split('\n').length > 5 || /void |int |float |String |def |public |private |#include/.test(answer)
    }
  },
  methods: {
    processImagePaths,
    escapeHtml(text) {
      if (!text) return ''
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },
    isMarkdownFormat(content) {
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
  }
}
</script>

<style scoped>
.code-item-display {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #fff;
}
.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.question-number {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-right: 15px;
}
.question-type {
  background-color: #f4fff4;
  color: #3eaf7c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}
.question-content {
  margin-bottom: 20px;
}
.question-text {
  line-height: 1.8;
  color: #333;
  font-size: 15px;
  word-wrap: break-word;
  word-break: break-word;
}
.answer-section {
  background-color: #f5f5ff;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #3eaf7c;
}
.reference-answer {
  margin-bottom: 15px;
}
.answer-label {
  font-weight: bold;
  color: #3eaf7c;
  margin-right: 8px;
}
.code-answer {
  background-color: #282c34;
  color: #fff;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Fira Mono', 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
  white-space: pre-wrap;
  margin-bottom: 10px;
}
.explanation {
  margin-top: 10px;
}
.explanation-label {
  font-weight: bold;
  color: #1480d6;
  margin-right: 8px;
}
.explanation-content {
  margin-top: 8px;
  color: #333;
  line-height: 1.8;
}
</style>
