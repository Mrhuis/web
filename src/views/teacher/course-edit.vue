<template>
  <TeacherLayout>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="章节结构" name="chapters">
        <el-tree
          :data="chapterTree"
          draggable
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          @node-drop="onDrop"
          style="width:100%;margin-bottom:16px;"
        ></el-tree>
        <el-button type="primary" @m-click="exportChapters">导出 chapters.json</el-button>
      </el-tab-pane>
      <el-tab-pane label="知识点管理" name="knowledge">
        <el-table :data="knowledgeList" style="width:100%;">
          <el-table-column prop="name" label="知识点" width="180" />
          <el-table-column prop="prerequisite" label="前置知识点" width="180">
            <template #default="scope">
              <el-select v-model="scope.row.prerequisite" multiple placeholder="选择前置">
                <el-option v-for="k in knowledgeList" :key="k.id" :label="k.name" :value="k.name" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="difficulty" label="难度" width="100">
            <template #default="scope">
              <el-rate v-model="scope.row.difficulty" :max="3" show-score></el-rate>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="教学资源" name="resources">
        <el-upload
          class="zip-uploader"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeResourceUpload"
          :show-file-list="true"
          ref="uploadRef"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将 ZIP 文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 .zip 格式的教学资源包，大小不超过 3GB。
            </div>
          </template>
        </el-upload>
        
        <!-- 上传进度条 -->
        <div v-if="isUploading" style="margin-top: 20px;">
          <el-progress 
            :percentage="uploadProgress" 
            :format="(percentage) => `${percentage}%`"
            status="success"
          />
          <div style="margin-top: 10px; color: #666; font-size: 14px;">
            正在上传文件，请勿关闭页面...
          </div>
        </div>
        
        <el-button
          type="primary"
          @click="submitResourceForReview"
          :disabled="!selectedFile || isUploading"
          :loading="isUploading"
          style="margin-top: 20px;"
        >
          {{ isUploading ? '上传中...' : '提交管理员审核' }}
        </el-button>
      </el-tab-pane>
    </el-tabs>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import TeacherLayout from '@/views/teacher/TeacherLayout.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { uploadResourceZip } from '@/api/teacher_course_edit_api';
import { useUserStore } from '@/store/user';

const activeTab = ref('chapters');
const userStore = useUserStore();

const chapterTree = ref([
  { id: 1, label: '第一章 绪论', children: [
    { id: 2, label: '1.1 数据结构概述' },
    { id: 3, label: '1.2 算法与复杂度' }
  ]},
  { id: 4, label: '第二章 线性表', children: [] }
]);
function onDrop() { /* 拖拽后可保存结构 */ }
function exportChapters() {
  const data = JSON.stringify(chapterTree.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chapters.json';
  a.click();
  URL.revokeObjectURL(url);
}
const knowledgeList = ref([
  { id: 1, name: '队列', prerequisite: [], difficulty: 2 },
  { id: 2, name: '栈', prerequisite: [], difficulty: 1 }
]);

// --- 教学资源上传逻辑 ---
const uploadRef = ref(null); // el-upload 组件的引用
const selectedFile = ref(null); // 存储选中的文件
const uploadProgress = ref(0); // 上传进度
const isUploading = ref(false); // 是否正在上传

const handleFileChange = (file) => {
  selectedFile.value = file.raw; // 存储原始文件对象
};

const submitResourceForReview = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的教学资源包。');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确定要提交此教学资源包进行审核吗？提交后将进入审核流程。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    isUploading.value = true;
    uploadProgress.value = 0;

    // 显示上传中的提示
    const loading = ElMessage({
      message: '正在提交资源包，请稍候...',
      type: 'info',
      duration: 0,
    });
    
    // 进度回调函数
    const onProgress = (percent, loaded, total) => {
      uploadProgress.value = Math.round(percent);
      const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
      const totalMB = (total / (1024 * 1024)).toFixed(1);
      loading.message = `正在上传... ${uploadProgress.value}% (${loadedMB}MB / ${totalMB}MB)`;
    };
    
    const result = await uploadResourceZip(selectedFile.value, userStore.userKey, onProgress); // 调用API并传入全局的用户ID
    
    loading.close(); // 关闭加载提示
    
    // 处理响应结果
    if (typeof result === 'string') {
    ElMessage.success('教学资源包已成功提交审核！');
    } else if (result && result.success) {
      ElMessage.success(result.message || '教学资源包已成功提交审核！');
    } else {
      ElMessage.error(result.message || '上传失败，请重试');
    }
    
    selectedFile.value = null; // 清空已选文件
    uploadRef.value.clearFiles(); // 清空 el-upload 的文件列表
    uploadProgress.value = 0;

  } catch (error) {
    if (error !== 'cancel') { // 避免用户取消操作时报错
      console.error('资源包提交失败:', error);
      let errorMessage = '资源包提交失败，请检查文件或网络后重试。';
      
      // 根据错误类型提供更具体的错误信息
      if (error.message.includes('timeout')) {
        errorMessage = '上传超时，文件可能过大或网络连接不稳定，请重试。';
      } else if (error.message.includes('Network error')) {
        errorMessage = '网络连接错误，请检查网络连接后重试。';
      } else if (error.message.includes('413')) {
        errorMessage = '文件过大，请压缩文件后重试。';
      }
      
      ElMessage.error(errorMessage);
    }
  } finally {
    isUploading.value = false;
  }
};

const beforeResourceUpload = (file) => {
  const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
  const isLt3G = file.size / 1024 / 1024 / 1024 < 3; // 3GB限制

  if (!isZip) {
    ElMessage.error('只能上传 .zip 格式的压缩包!');
  }
  if (!isLt3G) {
    ElMessage.error('上传文件大小不能超过 3GB!');
  }
  return isZip && isLt3G;
};
</script>

<style>
/* Styles can be added here if needed */
</style>

