<template>
  <div class="self-directed-learning">
    <div class="page-header">
      <h2 class="page-title">自主学习</h2>
    </div>

    <!-- 分页标签 -->
    <el-tabs v-model="activeTab" class="learning-tabs">
      <el-tab-pane label="习题" name="items">
        <ItemsTab @item-click="openItemDialog" />
      </el-tab-pane>
      <el-tab-pane label="视频" name="videos">
        <VideosTab @video-click="openVideoDialog" />
      </el-tab-pane>
    </el-tabs>

    <!-- 题目/视频弹窗 -->
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
          :question-number="1"
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
      </div>
      
      <template #footer>
        <div class="dialog-footer">
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
import { ElMessage } from 'element-plus';
import ItemsTab from './components/ItemsTab.vue';
import VideosTab from './components/VideosTab.vue';

// 导入题目展示组件（复用推荐学习的组件）
import OpenItemDisplay from '../recommended_learning/item_components/OpenItemDisplay.vue';
import ChoiceItemDisplay from '../recommended_learning/item_components/ChoiceItemDisplay.vue';
import JudgeItemDisplay from '../recommended_learning/item_components/JudgeItemDisplay.vue';
import BlankItemDisplay from '../recommended_learning/item_components/BlankItemDisplay.vue';
import VideoItemDisplay from '../recommended_learning/item_components/VideoItemDisplay.vue';
import RichTextEditor from '../recommended_learning/item_components/RichTextEditor.vue';
import CodeItemDisplay from '../recommended_learning/item_components/CodeItemDisplay.vue';
import DrawingItemDisplay from '../recommended_learning/item_components/DrawingItemDisplay.vue';

// 导入API
import { recodeUserBehavior, recodeClick } from '@/api/student/learning_center/self_directed_learning/self_directed_learning_api.js';

// 数据
const activeTab = ref('items');
const dialogVisible = ref(false);
const currentItem = ref(null);
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

// 获取弹窗标题
const getDialogTitle = () => {
  if (!currentItem.value) return '';
  const typeName = getItemTypeName(currentItem.value.formKey);
  const resourceKey = currentItem.value.itemKey || currentItem.value.mediaKey || currentItem.value.media_key;
  return `${typeName} - ${resourceKey}`;
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

const RECORDS_KEY = 'self_directed_learning_records';
const loadRecords = () => {
  const records = localStorage.getItem(RECORDS_KEY);
  return records ? JSON.parse(records) : {};
};
const saveRecords = (records) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};
const getRecordKey = (formKey, resourceKey) => `${formKey}_${resourceKey}`;
const isSubjective = (formKey) => ['qa', 'code', 'drawing'].includes(formKey);

// 打开习题弹窗
const openItemDialog = (item) => {
  // 记录卡片点击事件
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || '';
  if (userKey && item.formKey) {
    recodeClick(userKey, item.formKey).catch(error => {
      console.error('记录卡片点击失败:', error);
    });
  }
  
  // 转换item格式以匹配推荐学习的格式
  currentItem.value = {
    ...item,
    formType: 'item',
    resourceKey: item.itemKey
  };
  
  showAnswer.value = false;
  hasSubmitted.value = false;
  isCorrect.value = null;
  isRecordSubmitted.value = false;
  // 先默认空
  userAnswer.value = { choice: null, judge: null, blank: '', open: '' };
  
  // 回显历史记录
  const records = loadRecords();
  const key = getRecordKey(item.formKey, item.itemKey);
  const saved = records[key];
  
  if (saved && saved.formKey === item.formKey) {
    // 恢复答案内容
    if (item.formKey === 'choice') userAnswer.value.choice = saved.userAnswer?.choice ?? null;
    if (item.formKey === 'judge') userAnswer.value.judge = saved.userAnswer?.judge ?? null;
    if (item.formKey === 'blank') userAnswer.value.blank = (saved.userAnswer?.blankLines || []).join('\n');
    if (isSubjective(item.formKey)) userAnswer.value.open = saved.userAnswer?.open || '';
    
    // 只有真正检验过答案的（hasRecoded为true），才恢复已检验状态
    if (saved.hasRecoded) {
      hasSubmitted.value = true;
      isCorrect.value = typeof saved.isCorrect === 'boolean' ? saved.isCorrect : null;
    }
  }
  
  interactionStartTime.value = new Date();
  dialogVisible.value = true;
};

// 打开视频弹窗
const openVideoDialog = (video) => {
  // 记录卡片点击事件
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || '';
  if (userKey) {
    recodeClick(userKey, 'video').catch(error => {
      console.error('记录卡片点击失败:', error);
    });
  }
  
  // 转换video格式以匹配推荐学习的格式
  currentItem.value = {
    ...video,
    formKey: 'video',
    formType: 'media',
    resourceKey: video.mediaKey || video.media_key,
    fileName: video.fileName || video.file_name,
    url: video.url
  };
  
  videoWatchedFlag.value = false;
  hasSubmitted.value = false;
  isRecordSubmitted.value = false;
  
  // 回显历史记录
  const records = loadRecords();
  const resourceKey = video.mediaKey || video.media_key;
  const key = getRecordKey('video', resourceKey);
  const saved = records[key];
  
  if (saved && saved.formKey === 'video') {
    if (saved.watchRate === 1) {
      videoWatchedFlag.value = true;
    }
    if (saved.hasRecoded) {
      hasSubmitted.value = true;
    }
  }
  
  cleanupVideoTracking();
  videoStats.value = { watchRate: 0, isPause: false, isReplay: false, lastTime: 0, maxTime: 0, retryCount: 0 };
  interactionStartTime.value = new Date();
  dialogVisible.value = true;
  nextTick(() => {
    if (currentItem.value.formKey === 'video') initVideoTracking();
  });
};

// 视频事件处理函数
let timeUpdateHandler = null;
let pauseHandler = null;
let playHandler = null;

// 初始化视频观看跟踪
const initVideoTracking = () => {
  nextTick(() => {
    const dialogElement = document.querySelector('.el-dialog__body');
    if (!dialogElement) {
      setTimeout(initVideoTracking, 200);
      return;
    }
    
    const videoElement = dialogElement.querySelector('video');
    if (!videoElement) {
      const retryCount = videoStats.value.retryCount || 0;
      if (retryCount < 10) {
        videoStats.value.retryCount = retryCount + 1;
        setTimeout(initVideoTracking, 200);
      }
      return;
    }
    
    timeUpdateHandler = () => {
      if (videoElement.duration && videoElement.duration > 0) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        videoStats.value.watchRate = currentTime / duration;
        videoStats.value.maxTime = Math.max(videoStats.value.maxTime, currentTime);
        
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
      if (videoElement.currentTime > 0.1 && videoStats.value.maxTime > 0.1) {
        videoStats.value.isReplay = true;
      }
    };
    
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
  isRecordSubmitted.value = false;
  ElMessage.info('已重置本题作答');
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

// 提交用户行为记录
const submitBehaviorRecord = async () => {
  if (isSubmittingRecord.value || !currentItem.value || isRecordSubmitted.value) {
    return;
  }
  
  // 验证必要字段
  const userKey = localStorage.getItem('user_key') || localStorage.getItem('userKey') || '';
  const formKey = currentItem.value?.formKey;
  const resourceKey = currentItem.value?.resourceKey;
  
  if (!userKey || !formKey || !resourceKey) {
    console.warn('缺少必要字段，跳过提交:', { userKey, formKey, resourceKey, currentItem: currentItem.value });
    return;
  }
  
  const records = loadRecords();
  const key = getRecordKey(formKey, resourceKey);
  const saved = records[key];
  if (saved && saved.hasRecoded) {
    isRecordSubmitted.value = true;
    return;
  }
  isSubmittingRecord.value = true;
  isRecordSubmitted.value = true;
  
  if (currentItem.value && currentItem.value.formKey === 'video') {
    cleanupVideoTracking();
  }
  
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
  
  const isComplete = hasSubmitted.value;
  const isViewAnalysis = showAnswer.value;
  
  // 构建记录数据 - 不包含null值
  const recordData = {
    userKey: userKey,
    formKey: formKey,
    resourceKey: resourceKey,
    interactionTime: interactionTime
  };
  
  if (currentItem.value && currentItem.value.formKey !== 'video') {
    // 非视频类型：只添加题目相关字段
    recordData.isComplete = isComplete;
    recordData.isCorrect = typeof isCorrect.value === 'boolean' ? isCorrect.value : false;
    recordData.isViewAnalysis = isViewAnalysis;
    // 不发送视频相关字段（不添加null值）
  } else if (currentItem.value && currentItem.value.formKey === 'video') {
    // 视频类型：只添加视频相关字段
    recordData.watchRate = videoStats.value.watchRate || 0;
    recordData.isPause = videoStats.value.isPause || false;
    recordData.isReplay = videoStats.value.isReplay || false;
    // 不发送题目相关字段（不添加null值）
  }
  
  try {
    console.log('准备提交用户行为记录:', JSON.stringify(recordData, null, 2));
    const response = await recodeUserBehavior(recordData);
    console.log('用户行为记录已提交成功:', response);
    
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
    console.error('错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    });
    isRecordSubmitted.value = false;
    
    // 更详细的错误提示
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      let errorMessage = '提交失败';
      
      if (status === 500) {
        errorMessage = '服务器内部错误，可能是资源类型配置问题，请联系管理员';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else {
        errorMessage = `服务器错误 (${status})`;
      }
      
      ElMessage.error(errorMessage);
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

// 处理弹窗关闭事件
const handleDialogClose = async () => {
  await submitBehaviorRecord();
};

// 监听视频观看进度
watch(
  () => videoStats.value.watchRate,
  (val) => {
    if (
      currentItem.value &&
      currentItem.value.formKey === 'video' &&
      val >= 1 &&
      !videoWatchedFlag.value
    ) {
      const records = loadRecords();
      const key = getRecordKey('video', currentItem.value.resourceKey);
      records[key] = { formKey: 'video', watchRate: 1 };
      saveRecords(records);
      videoWatchedFlag.value = true;
    }
  }
);
</script>

<style scoped>
.self-directed-learning {
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

.learning-tabs {
  width: 100%;
}

.dialog-content {
  max-height: 75vh;
  overflow-y: auto;
  padding: 10px 5px;
}

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
  justify-content: flex-end;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

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

.answer-status {
  margin-left: 15px;
  font-size: 16px;
  font-weight: bold;
}

.answer-status.correct {
  color: #18b566;
}

.answer-status.incorrect {
  color: #e01e1e;
}

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