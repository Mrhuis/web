<template>
  <div class="recommended-learning">
    <div class="page-header">
      <h2 class="page-title">推荐学习</h2>
      <el-button 
        type="primary" 
        :icon="RefreshIcon" 
        :loading="loading"
        @click="refreshRecommendations"
      >
        刷新推荐
      </el-button>
    </div>

    <div v-if="loading && recommendations.length === 0" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="recommendations.length === 0" class="empty-container">
      <el-empty description="暂无推荐内容">
        <el-button v-if="!loading" type="danger" size="large" @click="handleReuseRecommend" style="margin-left:0">当日推荐候选已消耗完，是否重复使用</el-button>
      </el-empty>
    </div>

    <div v-else class="recommendations-grid">
      <el-row :gutter="20">
        <el-col 
          v-for="(item, index) in recommendations" 
          :key="index" 
          :xs="24" 
          :sm="12" 
          :md="12" 
          :lg="8" 
          :xl="8"
        >
          <el-card 
            :class="['recommendation-card', { 'checked-card': isItemChecked(item) }]"
            shadow="hover"
            @click="openItemDialog(item, index)"
          >
            <div class="card-header">
              <div class="item-type-badge" :class="`type-${item.formKey}`">
                {{ getItemTypeName(item.formKey) }}
              </div>
              <div class="difficulty-badge" :class="`difficulty-${item.difficulty}`">
                {{ getDifficultyText(item.difficulty) }}
              </div>
            </div>
            
            <div class="card-content">
              <div class="item-title" :title="getItemTitle(item)">
                {{ getItemTitle(item) }}
              </div>
              <div class="item-meta">
                <span class="resource-key">
                  <el-icon><Key /></el-icon>
                  {{ item.resourceKey }}
                </span>
                <!-- 如果是视频卡片，显示时长 -->
                <span v-if="item.formKey === 'video' && item.duration" class="video-duration">
                  <el-icon><VideoCamera /></el-icon>
                  {{ formatDuration(item.duration) }}
                </span>
              </div>
            </div>
            
            <div class="card-footer">
              <el-button type="primary" size="small" @click.stop="openItemDialog(item, index)">
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 题目弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="getDialogTitle()"
      width="85%"
      top="3vh"
      :close-on-click-modal="false"
      destroy-on-close
      @close="handleDialogClose"
    >
      <div class="dialog-content">
        <!-- 视频弹窗顶部提示 -->
        <div v-if="currentItem && currentItem.formKey === 'video' && videoWatchedFlag" class="video-done-tip">
          本视频已看完
        </div>
        <!-- 题目展示区域 -->
        <component 
          :is="getCurrentComponent()" 
          :item="currentItem" 
          :question-number="currentIndex + 1"
          :show-answer="showAnswer"
          ref="itemDisplayRef"
        />
        
        <!-- 答题区域 - 只有非video的题目才显示 -->
        <div v-if="currentItem && currentItem.formKey !== 'video' && currentItem.formType === 'item'" class="answer-input-section">
          <div class="answer-section-title">
            检验答案
            <span v-if="hasSubmitted" :class="['answer-status', isCorrect === true ? 'correct' : (isCorrect === false ? 'incorrect' : '')]">
              （{{ isCorrect === true ? '回答正确' : (isCorrect === false ? '回答错误' : '') }}）
            </span>
          </div>
          
          <!-- 选择题 -->
          <div v-if="currentItem.formKey === 'choice'" class="choice-answer-input">
            <div class="answer-hint">请选择答案：</div>
            <div class="choice-options">
              <el-radio-group v-model="userAnswer.choice">
                <el-radio 
                  v-for="(option, key) in parsedChoiceOptions" 
                  :key="key"
                  :label="key"
                  size="large"
                  class="choice-radio"
                >
                  {{ key }}. {{ option }}
                </el-radio>
              </el-radio-group>
            </div>
          </div>
          
          <!-- 判断题 -->
          <div v-else-if="currentItem.formKey === 'judge'" class="judge-answer-input">
            <div class="answer-hint">请选择答案：</div>
            <el-radio-group v-model="userAnswer.judge" size="large">
              <el-radio :label="true">正确</el-radio>
              <el-radio :label="false">错误</el-radio>
            </el-radio-group>
          </div>
          
          <!-- 填空题 -->
          <div v-else-if="currentItem.formKey === 'blank'" class="blank-answer-input">
            <div class="answer-hint">请填写答案（每空一行）：</div>
            <el-input
              v-model="userAnswer.blank"
              type="textarea"
              :rows="4"
              placeholder="请输入答案，多个答案请换行输入"
            />
          </div>
          
          <!-- 问答题等开放题 -->
          <div v-else class="open-answer-input">
            <div class="answer-hint">请填写答案（支持粘贴图片）：</div>
            <RichTextEditor
              :value="userAnswer.open"
              @input="handleOpenAnswerInput"
              @change="handleOpenAnswerChange"
              field-name="答案"
              :height="'200px'"
              placeholder="请输入您的答案，支持粘贴图片..."
            />
          </div>
          
          <div class="answer-actions">
            <el-button type="primary" @click="submitAnswer" :disabled="!hasAnswer || hasSubmitted">检验答案</el-button>
            <el-button v-if="hasSubmitted" @click="redoAnswer" type="warning">重做</el-button>
          </div>
        </div>
        
        <!-- 非客观题查看答案后的判断按钮 -->
        <div v-if="showAnswer && currentItem && currentItem.formKey !== 'video' && isSubjectiveQuestion && hasSubmitted" class="correct-judge-section">
          <el-alert
            title="请评估您的答案是否正确"
            description="此评估将影响您接下来获得的推荐资源，请谨慎判断"
            type="warning"
            :closable="false"
            style="margin-bottom: 16px;"
          />
          <div class="judge-buttons">
            <el-button 
              type="success" 
              size="large"
              @click="markAsCorrect"
              :disabled="isCorrect !== null"
            >
              正确
            </el-button>
            <el-button 
              type="danger" 
              size="large"
              @click="markAsIncorrect"
              :disabled="isCorrect !== null"
            >
              错误
            </el-button>
          </div>
        </div>
        
        <!-- 视频观看区域 - VideoItemDisplay组件会渲染video，跟踪逻辑在initVideoTracking中处理 -->
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-button 
              :disabled="currentIndex === 0"
              @click="previousItem"
            >
              上一题
            </el-button>
            <span class="item-counter">{{ currentIndex + 1 }} / {{ recommendations.length }}</span>
            <el-button 
              :disabled="currentIndex === recommendations.length - 1"
              @click="nextItem"
            >
              下一题
            </el-button>
          </div>
          <div class="footer-right">
            <!-- 只有题目类型才显示答案按钮，视频等资源类型不显示 -->
            <el-button 
              v-if="currentItem && currentItem.formType === 'item' && hasSubmitted"
              :type="showAnswer ? 'warning' : 'success'"
              @click="toggleAnswer"
            >
              {{ showAnswer ? '隐藏答案' : '查看答案' }}
            </el-button>
            <el-button @click="closeDialog">关闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { Refresh, Key, VideoCamera } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// 导入题目展示组件
import OpenItemDisplay from './item_components/OpenItemDisplay.vue';
import ChoiceItemDisplay from './item_components/ChoiceItemDisplay.vue';
import JudgeItemDisplay from './item_components/JudgeItemDisplay.vue';
import BlankItemDisplay from './item_components/BlankItemDisplay.vue';
import VideoItemDisplay from './item_components/VideoItemDisplay.vue';
import RichTextEditor from './item_components/RichTextEditor.vue';
import CodeItemDisplay from './item_components/CodeItemDisplay.vue';
import DrawingItemDisplay from './item_components/DrawingItemDisplay.vue';

// 导入API
import { recodeUserBehavior, reuseRecommend, recodeClick } from '@/api/student/learning_center/recommended_learning/recommended_learning_api.js';

// 图标
const RefreshIcon = Refresh;

// 数据
const loading = ref(false);
const recommendations = ref([]);
const dialogVisible = ref(false);
const currentItem = ref(null);
const currentIndex = ref(0);
const showAnswer = ref(false);

// 用户答案
const userAnswer = ref({
  choice: null,    // 选择题答案
  judge: null,      // 判断题答案
  blank: '',        // 填空题答案
  open: ''          // 开放题答案
});

// 答题状态
const hasSubmitted = ref(false);
const isCorrect = ref(null);  // null表示未判断，true/false表示判断结果
const itemDisplayRef = ref(null);
const videoContainerRef = ref(null);

// 视频观看记录
const videoStats = ref({
  watchRate: 0,        // 观看进度（0-1）
  isPause: false,       // 是否暂停过
  isReplay: false,      // 是否重复观看
  lastTime: 0,          // 上次观看的时间点
  maxTime: 0,           // 最大观看时间点
  retryCount: 0         // 重试计数器
});

// 用户行为记录
const behaviorRecord = ref(null);
const interactionStartTime = ref(null);
const isSubmittingRecord = ref(false);  // 标记是否正在提交记录
const isRecordSubmitted = ref(false);   // 标记记录是否已提交（防止重复提交）

// 新增
const videoWatchedFlag = ref(false);

// 获取题目类型名称
const getItemTypeName = (formKey) => {
  const typeMap = {
    'qa': '问答题',
    'choice': '选择题',
    'judge': '判断题',
    'blank': '填空题',
    'video': '视频',
    'code': '编程题',
    'drawing': '画图题',
    'document': '文档'
  };
  return typeMap[formKey] || '未知类型';
};

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    1: '简单',
    2: '中等',
    3: '较难',
    4: '困难',
    5: '极难'
  };
  return difficultyMap[difficulty] || '未知';
};

// 获取卡片标题
const getItemTitle = (item) => {
  if (item.formType === 'item') {
    // 题目类型，显示题目内容的前50个字符
    const content = item.content || '无内容';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  } else if (item.formType === 'media' || item.formKey === 'video') {
    // 视频类型，显示视频名称
    return item.fileName || '视频资源';
  } else if (item.formType === 'document') {
    // 文档类型，显示文档名称
    return item.fileName || '文档资源';
  }
  return '资源';
};

// 格式化视频时长（秒转换为 HH:MM:SS 或 MM:SS）
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 获取弹窗标题
const getDialogTitle = () => {
  if (!currentItem.value) return '';
  const typeName = getItemTypeName(currentItem.value.formKey);
  return `${typeName} - ${currentItem.value.resourceKey}`;
};

// 获取当前组件
const getCurrentComponent = () => {
  if (!currentItem.value) return null;
  
  const componentMap = {
    'qa': OpenItemDisplay,
    'choice': ChoiceItemDisplay,
    'judge': JudgeItemDisplay,
    'blank': BlankItemDisplay,
    'video': VideoItemDisplay,
    'code': CodeItemDisplay,
    'drawing': DrawingItemDisplay
  };
  
  return componentMap[currentItem.value.formKey] || null;
};

// 判断是否为客观题
const isSubjectiveQuestion = computed(() => {
  if (!currentItem.value) return false;
  const subjectiveTypes = ['qa', 'code', 'drawing'];
  return subjectiveTypes.includes(currentItem.value.formKey);
});

// 处理开放题答案输入
const handleOpenAnswerInput = (value) => {
  if (typeof value === 'string') {
    userAnswer.value.open = value;
  }
};

// 处理开放题答案变化
const handleOpenAnswerChange = (value) => {
  if (typeof value === 'string') {
    userAnswer.value.open = value;
  }
};

// 判断是否有答案
const hasAnswer = computed(() => {
  if (!currentItem.value) return false;
  const formKey = currentItem.value.formKey;
  
  if (formKey === 'choice') {
    return userAnswer.value.choice !== null;
  } else if (formKey === 'judge') {
    return userAnswer.value.judge !== null;
  } else if (formKey === 'blank') {
    return userAnswer.value.blank.trim() !== '';
  } else {
    // 对于开放题，检查内容是否非空
    const content = userAnswer.value.open || '';
    // 移除HTML标签和空白字符后检查
    const textContent = content
      .replace(/<[^>]+>/g, '')  // 移除HTML标签
      .replace(/&nbsp;/g, ' ')   // 替换&nbsp;
      .replace(/\s+/g, ' ')      // 合并空白字符
      .trim();
    return textContent !== '';
  }
});

// 解析选择题选项（用于显示）
const parsedChoiceOptions = computed(() => {
  if (!currentItem.value || !currentItem.value.options) return {};
  try {
    if (typeof currentItem.value.options === 'string') {
      return JSON.parse(currentItem.value.options);
    }
    return currentItem.value.options || {};
  } catch (error) {
    console.error('解析选择题选项失败:', error);
    return {};
  }
});

const RECORDS_KEY = 'recommended_learning_records';
const loadRecords = () => {
  const records = localStorage.getItem(RECORDS_KEY);
  return records ? JSON.parse(records) : {};
};
const saveRecords = (records) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};
const getRecordKey = (formKey, resourceKey) => `${formKey}_${resourceKey}`;
const isSubjective = (formKey) => ['qa', 'code', 'drawing'].includes(formKey);
// 检查卡片是否已完成（视频为watchRate=1也算）
const isItemChecked = (item) => {
  const records = loadRecords();
  const key = getRecordKey(item.formKey, item.resourceKey);
  const saved = records[key];
  if (item.formKey !== 'video') return !!saved;
  return saved && saved.formKey === 'video' && saved.watchRate === 1;
};

const openItemDialog = (item, index) => {
  // 记录卡片点击事件
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || '';
  if (userKey && item.formKey) {
    recodeClick(userKey, item.formKey).catch(error => {
      console.error('记录卡片点击失败:', error);
    });
  }
  
  currentItem.value = item;
  currentIndex.value = index;
  showAnswer.value = false;
  hasSubmitted.value = false;
  isCorrect.value = null;
  isRecordSubmitted.value = false;
  // 先默认空
  userAnswer.value = { choice: null, judge: null, blank: '', open: '' };
  // 回显历史记录（只有已经检验过答案的才恢复状态）
  const records = loadRecords();
  const key = getRecordKey(item.formKey, item.resourceKey);
  const saved = records[key];
  videoWatchedFlag.value = false;
  // 只有当本地缓存中有hasRecoded标记（已提交过/recode），才认为是真正检验过答案的
  // 或者对于视频，如果watchRate=1才认为是完成
  if (saved && saved.formKey === item.formKey) {
    // 恢复答案内容（无论是否检验过都恢复，方便用户查看）
    if (item.formKey === 'choice') userAnswer.value.choice = saved.userAnswer?.choice ?? null;
    if (item.formKey === 'judge') userAnswer.value.judge = saved.userAnswer?.judge ?? null;
    if (item.formKey === 'blank') userAnswer.value.blank = (saved.userAnswer?.blankLines || []).join('\n');
    if (isSubjective(item.formKey)) userAnswer.value.open = saved.userAnswer?.open || '';
    
    // 只有真正检验过答案的（hasRecoded为true），才恢复已检验状态
    if (saved.hasRecoded) {
      hasSubmitted.value = true;
      isCorrect.value = typeof saved.isCorrect === 'boolean' ? saved.isCorrect : null;
    }
    
    // 视频特殊处理
    if (item.formKey === 'video') {
      if (saved.watchRate === 1) {
        videoWatchedFlag.value = true;
      }
      // 对于视频，如果有hasRecoded标记，也可以恢复状态
      if (saved.hasRecoded) {
        hasSubmitted.value = true;
      }
    }
  }
  if (item.formKey === 'video' && saved && typeof saved.watchRate === 'number') {
    // 可根据需在弹窗展示剩余状态等
  }
  if (item.formKey === 'video') {
    cleanupVideoTracking();
    videoStats.value = { watchRate: 0, isPause: false, isReplay: false, lastTime: 0, maxTime: 0, retryCount: 0 };
  }
  interactionStartTime.value = new Date();
  dialogVisible.value = true;
  nextTick(() => {
    if (item.formKey === 'video') initVideoTracking();
  });
};

// 视频事件处理函数
let timeUpdateHandler = null;
let pauseHandler = null;
let playHandler = null;

// 初始化视频观看跟踪
const initVideoTracking = () => {
  nextTick(() => {
    // 在dialog中查找video元素
    const dialogElement = document.querySelector('.el-dialog__body');
    if (!dialogElement) {
      setTimeout(initVideoTracking, 200);
      return;
    }
    
    const videoElement = dialogElement.querySelector('video');
    if (!videoElement) {
      // 如果找不到video元素，延迟重试（最多重试10次）
      const retryCount = videoStats.value.retryCount || 0;
      if (retryCount < 10) {
        videoStats.value.retryCount = retryCount + 1;
        setTimeout(initVideoTracking, 200);
      }
      return;
    }
    
    // 定义事件处理函数
    timeUpdateHandler = () => {
      if (videoElement.duration && videoElement.duration > 0) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        videoStats.value.watchRate = currentTime / duration;
        videoStats.value.maxTime = Math.max(videoStats.value.maxTime, currentTime);
        
        // 检测是否重复观看（回到之前的时间点超过2秒）
        if (currentTime < videoStats.value.lastTime - 2) {
          videoStats.value.isReplay = true;
        }
        videoStats.value.lastTime = currentTime;
      }
    };
    
    pauseHandler = () => {
      videoStats.value.isPause = true;
    };
    
    playHandler = () => {
      // 如果从非0位置播放，且之前已经观看过，可能是重复观看
      if (videoElement.currentTime > 0.1 && videoStats.value.maxTime > 0.1) {
        videoStats.value.isReplay = true;
      }
    };
    
    // 添加事件监听器
    videoElement.addEventListener('timeupdate', timeUpdateHandler);
    videoElement.addEventListener('pause', pauseHandler);
    videoElement.addEventListener('play', playHandler);
  });
};

// 清除视频事件监听器
const cleanupVideoTracking = () => {
  const dialogElement = document.querySelector('.el-dialog__body');
  if (dialogElement) {
    const videoElement = dialogElement.querySelector('video');
    if (videoElement && timeUpdateHandler) {
      videoElement.removeEventListener('timeupdate', timeUpdateHandler);
      videoElement.removeEventListener('pause', pauseHandler);
      videoElement.removeEventListener('play', playHandler);
    }
  }
  timeUpdateHandler = null;
  pauseHandler = null;
  playHandler = null;
};

const submitAnswer = () => {
  if (!hasAnswer.value) {
    ElMessage.warning('请先填写答案');
    return;
  }
  if (hasSubmitted.value) return;
  hasSubmitted.value = true;
  if (!isSubjectiveQuestion.value) checkObjectiveAnswer();
  // 持久化作答记录
  const records = loadRecords();
  const key = getRecordKey(currentItem.value.formKey, currentItem.value.resourceKey);
  const savePayload = { formKey: currentItem.value.formKey, isCorrect: isCorrect.value ?? null, userAnswer: {} };
  if (currentItem.value.formKey === 'choice') savePayload.userAnswer.choice = userAnswer.value.choice;
  if (currentItem.value.formKey === 'judge') savePayload.userAnswer.judge = userAnswer.value.judge;
  if (currentItem.value.formKey === 'blank') savePayload.userAnswer.blankLines = userAnswer.value.blank.split('\n').map(s => s.trim()).filter(Boolean);
  if (isSubjective(currentItem.value.formKey)) savePayload.userAnswer.open = userAnswer.value.open;
  records[key] = savePayload;
  saveRecords(records);
  ElMessage.success('已检验答案');
  recommendations.value = [...recommendations.value];
};
const redoAnswer = () => {
  hasSubmitted.value = false;
  isCorrect.value = null;
  showAnswer.value = false;
  userAnswer.value = { choice: null, judge: null, blank: '', open: '' };
  const records = loadRecords();
  const key = getRecordKey(currentItem.value.formKey, currentItem.value.resourceKey);
  delete records[key];
  saveRecords(records);
  isRecordSubmitted.value = false; // 重置提交标记，允许重新提交
  ElMessage.info('已重置本题作答');
  recommendations.value = [...recommendations.value];
};

// 检查客观题答案
const checkObjectiveAnswer = () => {
  if (!currentItem.value) return;
  
  const formKey = currentItem.value.formKey;
  let userAns = null;
  let correctAns = currentItem.value.answer;
  
  if (formKey === 'choice') {
    userAns = userAnswer.value.choice;
    isCorrect.value = userAns === correctAns;
  } else if (formKey === 'judge') {
    userAns = userAnswer.value.judge;
    let normalizedCorrect = correctAns;
    if (typeof correctAns === 'string') {
      if (correctAns === '正确' || correctAns.toLowerCase() === 'true' || correctAns === '1') {
        normalizedCorrect = true;
      } else if (correctAns === '错误' || correctAns.toLowerCase() === 'false' || correctAns === '0') {
        normalizedCorrect = false;
      }
    }
    isCorrect.value = userAns === normalizedCorrect;
  } else if (formKey === 'blank') {
    userAns = userAnswer.value.blank.trim().split('\n').map(s => s.trim()).filter(s => s);
    // 处理填空题答案可能是数组或JSON字符串
    let normalizedCorrect = correctAns;
    if (typeof correctAns === 'string') {
      try {
        normalizedCorrect = JSON.parse(correctAns);
      } catch (e) {
        normalizedCorrect = [correctAns];
      }
    }
    if (!Array.isArray(normalizedCorrect)) {
      normalizedCorrect = [normalizedCorrect];
    }
    // 简单比较：答案数量相同且内容匹配（忽略大小写）
    if (userAns.length === normalizedCorrect.length) {
      const userLower = userAns.map(s => s.toLowerCase());
      const correctLower = normalizedCorrect.map(s => String(s).toLowerCase());
      isCorrect.value = userLower.every((ans, idx) => correctLower.includes(ans));
    } else {
      isCorrect.value = false;
    }
  }
  
  if (isCorrect.value) {
    ElMessage.success('答案正确！');
  } else {
    ElMessage.warning('答案错误');
  }
};

// 标记为正确（非客观题）
const markAsCorrect = () => {
  isCorrect.value = true;
  ElMessage.success('已标记为正确');
};

// 标记为错误（非客观题）
const markAsIncorrect = () => {
  isCorrect.value = false;
  ElMessage.warning('已标记为错误');
};

// 提交用户行为记录（独立函数）
const submitBehaviorRecord = async () => {
  // 防止重复提交
  if (isSubmittingRecord.value || !currentItem.value || isRecordSubmitted.value) {
    return;
  }
  // 检查本地缓存中是否已经提交过/recode请求
  const records = loadRecords();
  const key = getRecordKey(currentItem.value.formKey, currentItem.value.resourceKey);
  const saved = records[key];
  // 如果已提交过/recode请求，就不再提交
  if (saved && saved.hasRecoded) {
    isRecordSubmitted.value = true;
    return;
  }
  isSubmittingRecord.value = true;
  isRecordSubmitted.value = true;  // 标记为已提交
  
  // 清除视频事件监听器
  if (currentItem.value && currentItem.value.formKey === 'video') {
    cleanupVideoTracking();
  }
  
  // 记录交互时间 - 格式化为后端可识别的格式 "yyyy-MM-dd HH:mm:ss"
  const formatDateTime = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  const interactionTime = interactionStartTime.value 
    ? formatDateTime(interactionStartTime.value)
    : formatDateTime(new Date());
  
  // 判断是否完成（提交了答案且未退出）
  const isComplete = hasSubmitted.value;
  
  // 判断是否查看解析
  const isViewAnalysis = showAnswer.value;
  
  // 获取userKey
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || '';
  
  if (!userKey) {
    console.warn('未找到用户标识，行为记录可能失败');
  }
  
  // 构建记录数据
  const recordData = {
    userKey: userKey,
    formKey: currentItem.value?.formKey || '',
    resourceKey: currentItem.value?.resourceKey || '',
    interactionTime: interactionTime
  };
  
  // 如果是非video类型
  if (currentItem.value && currentItem.value.formKey !== 'video') {
    recordData.isComplete = isComplete;
    // 确保isCorrect是Boolean类型，null时转为false
    recordData.isCorrect = typeof isCorrect.value === 'boolean' ? isCorrect.value : false;
    recordData.isViewAnalysis = isViewAnalysis;
    // 对于非video类型，不发送video相关字段
    recordData.watchRate = null;
    recordData.isPause = null;
    recordData.isReplay = null;
  } else if (currentItem.value && currentItem.value.formKey === 'video') {
    // 如果是video类型
    recordData.watchRate = videoStats.value.watchRate || 0;
    recordData.isPause = videoStats.value.isPause || false;
    recordData.isReplay = videoStats.value.isReplay || false;
    // 对于video类型，不发送题目相关字段
    recordData.isComplete = null;
    recordData.isCorrect = null;
    recordData.isViewAnalysis = null;
  }
  
  // 提交记录
  try {
    // 打印即将发送的数据，便于调试
    console.log('准备提交用户行为记录:', JSON.stringify(recordData, null, 2));
    await recodeUserBehavior(recordData);
    console.log('用户行为记录已提交成功:', recordData);
    // 提交成功后，只有在真正检验过答案（非video类型hasSubmitted为true，或video类型watchRate为1）时，才在本地缓存中标记已提交过/recode
    // 这样下次打开弹窗时才能正确恢复"已检验"状态
    const shouldMarkAsRecoded = currentItem.value?.formKey === 'video' 
      ? (videoStats.value.watchRate >= 1) 
      : hasSubmitted.value;
    
    if (shouldMarkAsRecoded) {
      const records = loadRecords();
      const key = getRecordKey(currentItem.value.formKey, currentItem.value.resourceKey);
      if (records[key]) {
        records[key].hasRecoded = true;
      } else {
        records[key] = { formKey: currentItem.value.formKey, hasRecoded: true };
      }
      saveRecords(records);
    }
  } catch (error) {
    console.error('提交用户行为记录失败:', error);
    console.error('失败时的请求数据:', recordData);
    // 如果提交失败，重置提交标记，允许重试
    isRecordSubmitted.value = false;
    // 显示错误消息给用户
    if (error.response) {
      ElMessage.error(`提交失败: ${error.response.data?.message || error.response.statusText || '服务器错误'}`);
    } else if (error.message) {
      ElMessage.error(`提交失败: ${error.message}`);
    } else {
      ElMessage.error('提交失败，请稍后重试');
    }
  } finally {
    isSubmittingRecord.value = false;
  }
};

// 关闭弹窗并提交行为记录
const closeDialog = async () => {
  await submitBehaviorRecord();
  dialogVisible.value = false;
};

// 切换答案显示
const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value;
};

// 上一题
const previousItem = () => {
  // 先关闭当前弹窗，保存记录
  closeDialog().then(() => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
      // 延迟打开新弹窗，确保关闭动画完成
      setTimeout(() => {
        openItemDialog(recommendations.value[currentIndex.value], currentIndex.value);
      }, 300);
  }
  });
};

// 下一题
const nextItem = () => {
  // 先关闭当前弹窗，保存记录
  closeDialog().then(() => {
  if (currentIndex.value < recommendations.value.length - 1) {
    currentIndex.value++;
      // 延迟打开新弹窗，确保关闭动画完成
      setTimeout(() => {
        openItemDialog(recommendations.value[currentIndex.value], currentIndex.value);
      }, 300);
    }
  });
};

// 处理弹窗关闭事件（当用户直接关闭弹窗时）
const handleDialogClose = async () => {
  // 如果弹窗通过其他方式关闭（如点击X按钮），也需要提交记录
  await submitBehaviorRecord();
};

// 刷新推荐
const refreshRecommendations = async () => {
  // 清空所有作答缓存
  localStorage.removeItem('recommended_learning_records');
  loading.value = true;
  try {
    // 从localStorage获取user_key
    const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || 'default_user';
    
    const response = await axios.get('/api/student/recommend/get', {
      params: {
        userKey: userKey
      }
    });
    
    if (response.data.success) {
      recommendations.value = response.data.data || [];
      
      if (recommendations.value.length === 0) {
        ElMessage.warning('暂无推荐内容');
      } else {
        ElMessage.success(`成功加载 ${recommendations.value.length} 条推荐`);
      }
    } else {
      ElMessage.error(response.data.message || '获取推荐失败');
      recommendations.value = [];
    }
  } catch (error) {
    console.error('获取推荐失败:', error);
    ElMessage.error('获取推荐失败，请稍后重试');
    recommendations.value = [];
  } finally {
    loading.value = false;
  }
};

// 重新观看视频
const redoVideoWatch = () => {
  const records = loadRecords();
  const key = getRecordKey(currentItem.value.formKey, currentItem.value.resourceKey);
  delete records[key];
  saveRecords(records);
  videoWatchedFlag.value = false;
  recommendations.value = [...recommendations.value];
  ElMessage.info('已重新置为未观看');
};

// 处理重复使用推荐
const handleReuseRecommend = async () => {
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || 'default_user';
  try {
    const res = await reuseRecommend(userKey);
    // 打印真实响应结构
    console.log('reuse res:', res);
    // 向下递归找到success属性的那一层
    let data = res;
    for (let i = 0; i < 3; i++) {
      if (data && typeof data === 'object' && !Array.isArray(data) && data.success === undefined && data.data) data = data.data;
    }
    if (data && data.success) {
      ElMessage.success((data.message || '已重新启用今日推荐，正在刷新列表'));
      setTimeout(() => {
        refreshRecommendations();
      }, 2000);
    } else {
      ElMessage.error((data && data.message) || '操作失败');
    }
  } catch (e) {
    console.error('reuse error', e);
    ElMessage.error(e.message || '操作失败，请稍后重试');
  }
}

// 页面加载时自动获取推荐
onMounted(() => {
  refreshRecommendations();
});

watch(
  () => videoStats.value.watchRate,
  (val) => {
    if (
      currentItem.value &&
      currentItem.value.formKey === 'video' &&
      val >= 1 &&
      !videoWatchedFlag.value
    ) {
      // 写入本地缓存
      const records = loadRecords();
      const key = getRecordKey('video', currentItem.value.resourceKey);
      records[key] = { formKey: 'video', watchRate: 1 };
      saveRecords(records);
      videoWatchedFlag.value = true;
      recommendations.value = [...recommendations.value];
    }
  }
);
</script>

<style scoped>
.recommended-learning {
  width: 100%;
  height: 100%;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.recommendations-grid {
  width: 100%;
}

.recommendation-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.checked-card {
  background: #ebf5ff !important;
  box-shadow: 0 0 0 2px #1890ff inset;
  border-color: #1890ff !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-qa {
  background: #e6f7ff;
  color: #1890ff;
}

.type-choice {
  background: #f0f5ff;
  color: #597ef7;
}

.type-judge {
  background: #fff7e6;
  color: #fa8c16;
}

.type-blank {
  background: #f6ffed;
  color: #52c41a;
}

.type-video {
  background: #fff0f6;
  color: #eb2f96;
}

.type-document {
  background: #f9f0ff;
  color: #722ed1;
}

.type-code {
  background: #e6f4ff;
  color: #166de8;
}
.type-drawing {
  background: #f8e6ff;
  color: #be29ec;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.difficulty-1 {
  background: #d4f4dd;
  color: #389e0d;
}

.difficulty-2 {
  background: #d3f1ff;
  color: #0958d9;
}

.difficulty-3 {
  background: #ffecc0;
  color: #d46b08;
}

.difficulty-4 {
  background: #ffd6e7;
  color: #c41d7f;
}

.difficulty-5 {
  background: #ffd4d4;
  color: #cf1322;
}

.card-content {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  min-height: 72px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.resource-key {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #eb2f96;
  font-weight: 500;
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.dialog-content {
  max-height: 75vh;
  overflow-y: auto;
  padding: 10px 5px;
}

/* 弹窗内容滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-counter {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 答题输入区域样式 */
.answer-input-section {
  margin-top: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.answer-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
}

.answer-hint {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.choice-answer-input,
.judge-answer-input,
.blank-answer-input,
.open-answer-input {
  margin-bottom: 16px;
}

.choice-options {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.choice-radio {
  display: block;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.choice-radio:hover {
  background-color: #f5f7fa;
}

.choice-radio:last-child {
  margin-bottom: 0;
}

.answer-actions {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

/* 非客观题判断区域 */
.correct-judge-section {
  margin-top: 24px;
  padding: 20px;
  background: #fff7e6;
  border-radius: 8px;
  border: 1px solid #ffd591;
}

.judge-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 视频跟踪容器 */
.video-tracking-container {
  position: relative;
}

.answer-status { margin-left: 15px; font-size: 16px; font-weight: bold; }
.correct { color: #18b566; }
.incorrect { color: #e01e1e; }

.video-done-tip {
  padding: 12px 18px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 6px;
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
}
</style>
