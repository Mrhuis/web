<template>
  <div class="choice-item-display">
    <div class="question-header">
      <div class="question-number">第{{ questionNumber }}题</div>
      <div class="question-type">选择题</div>
    </div>
    
    <div class="question-content">
      <div class="question-text" v-html="processedContent"></div>
    </div>
    
    <div class="options-container">
      <div 
        v-for="(option, key) in parsedOptions" 
        :key="key"
        class="option-item"
        :class="{ 'correct-option': isCorrectOption(key) }"
      >
        <div class="option-label">{{ key }}.</div>
        <div class="option-content" v-html="processImagePaths(option)"></div>
      </div>
    </div>
    
    <div class="answer-section" v-if="showAnswer">
      <div class="correct-answer">
        <span class="answer-label">正确答案：</span>
        <span class="answer-value">{{ item.answer }}</span>
      </div>
      <div class="explanation" v-if="item.solution">
        <span class="explanation-label">解析：</span>
        <span class="explanation-content" v-html="processedSolution"></span>
      </div>
    </div>
  </div>
</template>

<script>
import { processImagePaths } from '@/utils/imageUtils'

export default {
  name: 'ChoiceItemDisplay',
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
    parsedOptions() {
      if (!this.item.options) return {}
      
      try {
        // 如果 options 是字符串，解析为对象
        if (typeof this.item.options === 'string') {
          return JSON.parse(this.item.options)
        }
        // 如果已经是对象，直接返回
        return this.item.options
      } catch (error) {
        console.error('解析选择题选项失败:', error)
        return {}
      }
    },
    processedContent() {
      return processImagePaths(this.item.content || '')
    },
    processedSolution() {
      return processImagePaths(this.item.solution || '')
    }
  },
  methods: {
    isCorrectOption(optionKey) {
      if (!this.showAnswer || !this.item.answer) return false
      return this.item.answer === optionKey
    },
    processImagePaths
  }
}
</script>

<style scoped>
.choice-item-display {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
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

.question-content {
  margin-bottom: 20px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.options-container {
  margin-bottom: 20px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
}

.option-item.correct-option {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.option-label {
  font-weight: bold;
  color: #1890ff;
  margin-right: 12px;
  min-width: 30px;
}

.option-content {
  flex: 1;
  line-height: 1.5;
  color: #333;
}

.answer-section {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  padding: 16px;
}

.correct-answer {
  margin-bottom: 12px;
}

.answer-label {
  font-weight: bold;
  color: #52c41a;
  margin-right: 8px;
}

.answer-value {
  color: #52c41a;
  font-weight: bold;
}

.explanation {
  border-top: 1px solid #d9f7be;
  padding-top: 12px;
}

.explanation-label {
  font-weight: bold;
  color: #52c41a;
  margin-right: 8px;
}

.explanation-content {
  color: #333;
  line-height: 1.6;
}
</style>
