<template>
  <div class="open-item-display">
    <div class="question-header">
      <div class="question-number">第{{ questionNumber }}题</div>
      <div class="question-type">{{ getQuestionType() }}</div>
      <div class="markdown-indicator" v-if="hasMarkdownContent">
        <span class="markdown-badge">Markdown</span>
      </div>
    </div>
    
    <div class="question-content">
      <div class="question-text" v-html="processedContent"></div>
    </div>
    
    <div class="answer-section" v-if="showAnswer">
      <div class="reference-answer">
        <span class="answer-label">参考答案：</span>
        <div class="answer-content">
          <pre v-if="isCodeAnswer" class="code-answer">{{ item.answer }}</pre>
          <div v-else v-html="processedAnswer"></div>
        </div>
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
  name: 'OpenItemDisplay',
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
      
      // 如果包含Markdown格式，使用marked渲染
      if (this.isMarkdownFormat(content)) {
        return marked.parse(processed)
      }
      
      return processed
    },
    processedAnswer() {
      const answer = this.item.answer || ''
      const processed = processImagePaths(answer)
      
      // 如果包含Markdown格式，使用marked渲染
      if (this.isMarkdownFormat(answer)) {
        return marked.parse(processed)
      }
      
      return processed
    },
    processedSolution() {
      const solution = this.item.solution || ''
      const processed = processImagePaths(solution)
      
      // 如果包含Markdown格式，使用marked渲染
      if (this.isMarkdownFormat(solution)) {
        return marked.parse(processed)
      }
      
      return processed
    },
    hasMarkdownContent() {
      const content = this.item.content || ''
      const answer = this.item.answer || ''
      const solution = this.item.solution || ''
      return this.isMarkdownFormat(content) || this.isMarkdownFormat(answer) || this.isMarkdownFormat(solution)
    },
    isCodeAnswer() {
      const answer = this.item.answer || ''
      return answer.includes('```') || answer.includes('`')
    }
  },
  methods: {
    getQuestionType() {
      return '简答题'
    },
    processImagePaths,
    /**
     * 检测内容是否包含markdown格式
     * @param {string} content - 要检测的内容
     * @returns {boolean} - 是否包含markdown格式
     */
    isMarkdownFormat(content) {
      if (!content) return false
      
      // 检测常见的markdown语法
      const markdownPatterns = [
        /^#{1,6}\s+/m,           // 标题 # ## ###
        /\*\*([^*]+)\*\*/g,      // 粗体 **text**
        /\*([^*]+)\*/g,          // 斜体 *text*
        /`([^`]+)`/g,            // 行内代码 `code`
        /```[\s\S]*?```/g,       // 代码块 ```code```
        /^\s*[-*+]\s+/m,         // 无序列表 - * +
        /^\s*\d+\.\s+/m,         // 有序列表 1. 2.
        /\[([^\]]+)\]\(([^)]+)\)/g, // 链接 [text](url)
        /!\[([^\]]*)\]\(([^)]+)\)/g, // 图片 ![alt](url)
        /^\s*>\s+/m,             // 引用 >
        /^\s*\|.*\|.*\|/m,       // 表格 |
        /^---+$/m,               // 分隔线 ---
        /~~([^~]+)~~/g           // 删除线 ~~text~~
      ]
      
      return markdownPatterns.some(pattern => pattern.test(content))
    }
  }
}
</script>

<style scoped>
.open-item-display {
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
  background-color: #f0f8ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.markdown-indicator {
  margin-left: auto;
}

.markdown-badge {
  background-color: #52c41a;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.question-content {
  margin-bottom: 20px;
}

.question-text {
  line-height: 1.6;
  color: #333;
}

.answer-section {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.reference-answer {
  margin-bottom: 15px;
}

.answer-label {
  font-weight: bold;
  color: #1890ff;
  margin-right: 8px;
}

.answer-content {
  margin-top: 8px;
  line-height: 1.6;
}

.explanation {
  margin-top: 15px;
}

.explanation-label {
  font-weight: bold;
  color: #52c41a;
  margin-right: 8px;
}

.explanation-content {
  margin-top: 8px;
  line-height: 1.6;
}

.code-answer {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* 图片自适应样式 */
.question-text :deep(img),
.answer-content :deep(img),
.explanation-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 参考答案区域的图片更小一些 */
.answer-content :deep(img) {
  max-width: 80%;
  max-height: 300px;
}

/* 解析区域的图片 */
.explanation-content :deep(img) {
  max-width: 90%;
  max-height: 400px;
}

/* 题目内容区域的图片 */
.question-text :deep(img) {
  max-width: 95%;
  max-height: 500px;
}
</style>
