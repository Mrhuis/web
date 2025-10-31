<template>
  <div class="blank-item-display">
    <div class="question-header">
      <div class="question-number">第{{ questionNumber }}题</div>
      <div class="question-type">填空题</div>
    </div>
    
    <div class="question-content">
      <div class="question-text" v-html="processedContent"></div>
    </div>
    
    <div class="answer-section" v-if="showAnswer">
      <div class="correct-answers">
        <div 
          v-for="(answer, index) in item.answer" 
          :key="index"
          class="correct-answer-item"
        >
          <span class="blank-label">第{{ index + 1 }}空：</span>
          <span class="answer-value">{{ answer }}</span>
        </div>
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
  name: 'BlankItemDisplay',
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
      return processImagePaths(this.item.content || '')
    },
    processedSolution() {
      return processImagePaths(this.item.solution || '')
    }
  }
}
</script>

<style scoped>
.blank-item-display {
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
  background: #f6ffed;
  color: #52c41a;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.question-content {
  margin-bottom: 20px;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.question-text :deep(span) {
  border-bottom: 2px solid #1890ff;
  padding: 2px 8px;
  margin: 0 4px;
  background: #f0f8ff;
  border-radius: 3px;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.answer-section {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  padding: 16px;
}

.correct-answers {
  margin-bottom: 12px;
}

.correct-answer-item {
  margin-bottom: 8px;
}

.blank-label {
  font-weight: bold;
  color: #52c41a;
  margin-right: 8px;
}

.answer-value {
  color: #52c41a;
  font-weight: bold;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #b7eb8f;
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
