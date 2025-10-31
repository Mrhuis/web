<template>
  <div class="plugin-management">
    <div class="header-section">
      <div class="header-left">
        <el-alert
          v-if="enabledPlugin"
          :title="`当前启用: ${enabledPlugin.name}`"
          type="success"
          :closable="false"
          show-icon
          class="enabled-alert"
        />
      </div>
      <div class="header-right">
        <el-input 
          v-model="searchKeyword" 
          placeholder="请输入关键字搜索" 
          clearable 
          style="width: 240px; margin-right: 16px;" 
        />
        <el-button 
          type="primary" 
          @click="handleRefresh" 
          :loading="refreshing" 
          style="margin-right: 16px;"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
                  <el-button type="primary" @click="openResourceDialog">
            上传数据结构资源包
          </el-button>
      </div>
    </div>

    <div class="table-container">
      <!-- 状态说明 -->
      <div class="status-legend" style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
        <div style="font-weight: 500; margin-bottom: 8px; color: #606266;">资源包状态说明：</div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-tag type="danger" effect="light" size="small">未初始化</el-tag>
            <span style="color: #666; font-size: 13px;">资源包已上传但未解析，无法下载和使用</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-tag type="info" effect="light" size="small">已禁用</el-tag>
            <span style="color: #666; font-size: 13px;">资源包已初始化，可以下载但未启用推荐</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-tag type="success" effect="dark" size="small">已启用</el-tag>
            <span style="color: #666; font-size: 13px;">资源包已启用，参与资源推荐</span>
          </div>
        </div>
      </div>
      
      <!-- 查询表单 -->
      <div class="query-form-container" style="margin-bottom: 20px;">
        <el-form :model="queryForm" inline>
          <el-form-item label="插件标识">
            <el-input v-model="queryForm.plugin_key" placeholder="请输入插件标识" clearable style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="插件名称">
            <el-input v-model="queryForm.name" placeholder="请输入插件名称" clearable style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="版本">
            <el-input v-model="queryForm.version" placeholder="请输入版本" clearable style="width: 120px;"></el-input>
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="queryForm.author" placeholder="请输入作者" clearable style="width: 120px;"></el-input>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" placeholder="请选择状态" clearable style="width: 120px;">
              <el-option label="未初始化" value="uninitialized"></el-option>
              <el-option label="已启用" value="enabled"></el-option>
              <el-option label="已禁用" value="disabled"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="上传者">
            <el-input v-model="queryForm.uploaded_by" placeholder="请输入上传者" clearable style="width: 120px;"></el-input>
          </el-form-item>
          <el-form-item label="通用搜索">
            <el-input v-model="queryForm.searchValue" placeholder="在所有字段中搜索" clearable style="width: 200px;"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredPlugins" style="width: 100%; table-layout: fixed;" border fit>
        <el-table-column prop="name" label="插件名称" width="150"></el-table-column>
        <el-table-column prop="plugin_key" label="唯一标识" width="180"></el-table-column>
        <el-table-column prop="version" label="版本" width="80"></el-table-column>
        <el-table-column prop="author" label="作者" width="100"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="uploaded_by" label="上传人员ID" width="120"></el-table-column>
        <el-table-column label="上传时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="下载" width="120">
          <template #default="scope">
            <!-- 未初始化状态：禁用下载按钮 -->
            <el-button 
              v-if="scope.row.status === 'uninitialized'"
              type="info" 
              size="small" 
              disabled
              title="资源包未初始化，无法下载"
              style="opacity: 0.6; cursor: not-allowed;"
            >
              <el-icon style="margin-right: 4px;"><Warning /></el-icon>
              下载
            </el-button>
            <!-- 已初始化状态：允许下载 -->
            <el-button 
              v-else
              type="primary" 
              size="small" 
              @click="handleDownload(scope.row.plugin_key)"
              :loading="downloadingPlugins.includes(scope.row.plugin_key)"
              :disabled="downloadingPlugins.includes(scope.row.plugin_key)"
            >
              <el-icon style="margin-right: 4px;"><Download /></el-icon>
              {{ downloadingPlugins.includes(scope.row.plugin_key) ? '准备中...' : '下载' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="getStatusTagType(scope.row.status)" 
              :effect="scope.row.status === 'enabled' ? 'dark' : 'light'"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <!-- 未初始化状态：只显示初始化按钮 -->
            <el-button 
              v-if="scope.row.status === 'uninitialized'" 
              type="primary" 
              size="small" 
              @click="handleInitialize(scope.row)"
              style="margin-right: 8px;"
            >
              初始化
            </el-button>
            
            <!-- 已禁用状态：显示启用和删除按钮 -->
            <template v-else-if="scope.row.status === 'disabled'">
              <el-button 
                type="success" 
                size="small" 
                @click="handleEnable(scope.row)"
                style="margin-right: 8px;"
              >
                启用
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
            
            <!-- 已启用状态：显示禁用和删除按钮 -->
            <template v-else-if="scope.row.status === 'enabled'">
              <el-button 
                type="warning" 
                size="small" 
                @click="handleDisable(scope.row)"
                style="margin-right: 8px;"
              >
                禁用
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 上传资源对话框 -->
    <el-dialog 
      v-model="showResourceDialog" 
      title="上传资源" 
      width="600px" 
      :before-close="handleDialogClose"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :key="dialogKey"
      @close="onDialogClose"
      :destroy-on-close="true"
    >
      <div class="upload-container">
        <!-- 文件选择区域 -->
        <div v-if="!uploading" class="file-select-area">
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
                只能上传 .zip 格式的教学资源包，支持大文件分块上传。
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 上传进度区域 -->
        <div v-if="uploading" class="upload-progress-area">
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span class="file-name">{{ selectedFile?.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile?.size) }}</span>
          </div>
          
          <!-- 总体进度 -->
          <div class="progress-section">
            <div class="progress-header">
              <span>总体进度</span>
              <span class="progress-text">{{ uploadProgress.percentage }}%</span>
            </div>
            <el-progress 
              :percentage="uploadProgress.percentage" 
              :status="uploadProgress.percentage === 100 ? 'success' : ''"
              :stroke-width="8"
            />
            <div class="progress-detail">
              已上传: {{ uploadProgress.completed }}/{{ uploadProgress.total }} 个分块
            </div>
          </div>

          <!-- 上传控制按钮 -->
          <div class="upload-controls">
            <el-button 
              v-if="!uploadPaused" 
              type="warning" 
              @click="pauseUpload"
              :disabled="uploadProgress.percentage === 100"
            >
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
            <el-button 
              v-else 
              type="success" 
              @click="resumeUpload"
            >
              <el-icon><VideoPlay /></el-icon>
              继续
            </el-button>
            <el-button 
              type="danger" 
              @click="cancelUpload"
              :disabled="uploadProgress.percentage === 100"
            >
              <el-icon><Close /></el-icon>
              取消
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showResourceDialog = false" :disabled="uploading">取 消</el-button>
          <el-button 
            v-if="!uploading" 
            type="primary" 
            @click="submitResourceForReview" 
            :disabled="!selectedFile"
          >
            开始上传
          </el-button>
          <el-button 
            v-else 
            type="success" 
            @click="showResourceDialog = false"
            :disabled="uploadProgress.percentage < 100"
          >
            完成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllPlugins, deletePlugin, downloadPlugin, uploadResourceZip, updatePluginStatus, getEnabledPlugin, initializePlugin } from '@/api/admin/admin_resource_manage_api';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { UploadFilled, Refresh, Document, VideoPause, VideoPlay, Close, Warning, Download } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { ChunkUploader } from '@/utils/chunk-upload'; // 导入 ChunkUploader

const plugins = ref([]);
const refreshing = ref(false);
const enabledPlugin = ref(null);
const showResourceDialog = ref(false);
const uploadRef = ref(null);
const selectedFile = ref(null);
const searchKeyword = ref('');
const userStore = useUserStore();
const dialogKey = ref(0); // 用于强制重新渲染弹窗

// 分页和查询相关状态
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const queryForm = ref({
  plugin_key: '',
  name: '',
  version: '',
  author: '',
  description: '',
  status: '',
  uploaded_by: '',
  searchValue: ''
});

// 分块上传相关状态
const uploading = ref(false);
const uploadPaused = ref(false);
const uploadProgress = ref({
  completed: 0,
  total: 0,
  percentage: 0
});
const uploader = ref(null);

// 下载状态管理
const downloadingPlugins = ref([]);

// 获取所有插件
const fetchAllPlugins = async (queryParams = {}) => {
  try {
    // 合并查询参数和分页参数
    const params = {
      ...queryParams,
      page_index: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    };
    
    console.log('发送请求参数:', params);
    const response = await getAllPlugins(params);
    console.log('收到响应:', response);
    
    if (response.success) {
      // 处理分页结果
      const result = response.data;
      console.log('处理响应数据:', result);
      plugins.value = result.records || [];
      pagination.value.total = result.total || 0;
      pagination.value.currentPage = result.current || 1;
      pagination.value.pageSize = result.size || 10;
      console.log('设置后的插件列表:', plugins.value);
    } else {
      ElMessage.error(response.message || '获取插件列表失败');
    }
  } catch (error) {
    console.error('获取插件列表异常:', error);
    ElMessage.error('获取插件列表失败，请重试。');
  }
};

// 获取当前启用的插件
const fetchEnabledPlugin = async () => {
  try {
    console.log('开始获取启用插件...');
    const response = await getEnabledPlugin();
    console.log('启用插件响应:', response);
    
    if (response.success) {
    enabledPlugin.value = response.data;
      console.log('设置启用插件:', enabledPlugin.value);
    } else {
      console.warn('获取启用插件失败:', response.message);
      enabledPlugin.value = null;
    }
  } catch (error) {
    console.error('获取启用插件失败:', error);
    enabledPlugin.value = null;
  }
};

// 处理查询
const handleSearch = async () => {
  pagination.value.currentPage = 1; // 重置到第一页
  await fetchAllPlugins(queryForm.value);
};

// 重置查询
const resetQuery = () => {
  queryForm.value = {
    plugin_key: '',
    name: '',
    version: '',
    author: '',
    description: '',
    status: '',
    uploaded_by: '',
    searchValue: ''
  };
  pagination.value.currentPage = 1;
  fetchAllPlugins();
};

// 处理分页变化
const handlePageChange = (page) => {
  pagination.value.currentPage = page;
  fetchAllPlugins(queryForm.value);
};

// 处理每页数量变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  fetchAllPlugins(queryForm.value);
};

// 下载插件
const handleDownload = async (pluginKey) => {
  try {
    // 检查插件状态
    const plugin = plugins.value.find(p => p.plugin_key === pluginKey);
    if (plugin && plugin.status === 'uninitialized') {
      ElMessage.warning('资源包未初始化，无法下载。请先初始化资源包后再进行下载操作。');
      return;
    }
    
    // 添加到下载中列表
    downloadingPlugins.value.push(pluginKey);
    
    // 显示开始下载提示
    ElMessage.info('正在准备下载文件，请稍候...');
    
    // 调用下载API
    await downloadPlugin(pluginKey);
    
    // 下载成功提示
    ElMessage.success('下载完成！');
  } catch (error) {
    console.error('下载失败:', error);
    // 根据错误类型显示不同的提示
    if (error.message.includes('超时')) {
      ElMessage.warning('下载准备时间较长，请稍后重试');
    } else if (error.message.includes('未初始化')) {
      ElMessage.warning('资源包未初始化，无法下载。请先初始化资源包后再进行下载操作。');
    } else if (error.message.includes('失败')) {
      ElMessage.error('下载失败: ' + error.message);
    } else {
      ElMessage.error('下载过程中发生错误，请重试');
    }
  } finally {
    // 从下载中列表移除
    const index = downloadingPlugins.value.indexOf(pluginKey);
    if (index > -1) {
      downloadingPlugins.value.splice(index, 1);
    }
  }
};

// 删除插件
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该插件吗？', '提示', { type: 'warning' });
    await deletePlugin(row.id);
    ElMessage.success('删除成功');
    await Promise.all([fetchAllPlugins(), fetchEnabledPlugin()]);
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败，请重试。');
  }
};

// 启用插件
const handleEnable = async (row) => {
  try {
    await ElMessageBox.confirm('确定要启用该插件吗？启用后其他插件将被自动禁用。', '提示', { type: 'warning' });
    await updatePluginStatus(row.id, 'enabled');
    ElMessage.success('插件启用成功');
    await Promise.all([fetchAllPlugins(), fetchEnabledPlugin()]);
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('启用失败，请重试。');
  }
};

// 禁用插件
const handleDisable = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用该插件吗？', '提示', { type: 'warning' });
    await updatePluginStatus(row.id, 'disabled');
    ElMessage.success('插件禁用成功');
    await Promise.all([fetchAllPlugins(), fetchEnabledPlugin()]);
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('禁用失败，请重试。');
  }
};

// 获取状态标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case 'enabled':
      return 'success';
    case 'disabled':
      return 'info';
    case 'uninitialized':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'enabled':
      return '已启用';
    case 'disabled':
      return '已禁用';
    case 'uninitialized':
      return '未初始化';
    default:
      return status;
  }
};

// 初始化插件
const handleInitialize = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要初始化该插件吗？初始化将解析资源包内容并创建知识体系结构，初始化后插件将变为禁用状态。', 
      '提示', 
      { type: 'warning' }
    );
    
    // 调用初始化API
    await initializePlugin(row.id);
    ElMessage.success('插件初始化成功！插件已变为禁用状态。');
    
    // 刷新数据
    await Promise.all([fetchAllPlugins(), fetchEnabledPlugin()]);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('插件初始化失败:', error);
      ElMessage.error('插件初始化失败，请重试。');
    }
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

const handleFileChange = (file) => {
  selectedFile.value = file.raw;
};

const beforeResourceUpload = (file) => {
  const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
  if (!isZip) {
    ElMessage.error('只能上传 .zip 格式的压缩包!');
  }
  return isZip;
};

const submitResourceForReview = async () => {
  console.log('=== 开始上传前状态检查 ===');
  console.log('当前状态:', {
    selectedFile: selectedFile.value?.name,
    uploading: uploading.value,
    uploadPaused: uploadPaused.value,
    hasUploader: !!uploader.value,
    progress: uploadProgress.value
  });
  
  // 1. 严格检查文件选择
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的教学资源包。');
    return;
  }
  
  // 2. 检查文件是否有效
  if (!selectedFile.value.name || !selectedFile.value.size) {
    ElMessage.error('选择的文件无效，请重新选择。');
    selectedFile.value = null;
    return;
  }
  
  // 3. 检查是否已经在传输中
  if (uploading.value) {
    ElMessage.warning('文件正在上传中，请等待完成或取消当前上传。');
    return;
  }
  
  // 4. 检查是否有残留的上传器实例
  if (uploader.value) {
    console.log('发现残留的上传器实例，正在清理...');
    try {
      uploader.value.cancel();
    } catch (error) {
      console.warn('清理残留上传器时出错:', error);
    }
    uploader.value = null;
  }
  
  try {
    console.log('=== 开始创建新的上传任务 ===');
    
    // 开始分块上传
    uploading.value = true;
    uploadPaused.value = false;
    uploadProgress.value = { completed: 0, total: 0, percentage: 0 };
    
    // 创建分块上传器
    const createUploader = (file) => {
      const userStore = useUserStore();
      
      // 添加日志：显示用户store中的信息
      console.log('=== 分块上传器创建时 ===');
      console.log('userStore.userKey:', userStore.userKey);
      console.log('userStore.id:', userStore.id);
      console.log('userStore.nickname:', userStore.nickname);
      console.log('userStore.role:', userStore.role);
      console.log('userStore.isLoggedIn:', userStore.isLoggedIn);
      
      return new ChunkUploader({
        chunkSize: 1024 * 1024, // 1MB
        concurrent: 3,
        retryTimes: 3,
        retryDelay: 1000,
        uploadUrl: '/api/admin/plugins/upload-chunk',
        mergeUrl: '/api/admin/plugins/merge-chunks',
        userId: userStore.userKey, // 传入用户ID
        getUserIdFromStore: () => userStore.userKey, // 传入获取用户ID的函数
        onProgress: (progress) => {
          uploadProgress.value = progress;
        },
        onSuccess: (result) => {
          ElMessage.success('文件上传成功！');
          uploadProgress.value = 100;
          // 重置表单
          resetResourceDialog();
          // 刷新资源列表
          fetchAllPlugins();
        },
        onError: (error) => {
          ElMessage.error(`上传失败: ${error.message}`);
          uploadProgress.value = 0;
        },
        onChunkComplete: (chunkIndex, totalChunks) => {
          console.log(`分块 ${chunkIndex + 1}/${totalChunks} 上传完成`);
        }
      });
    };
    
    uploader.value = createUploader(selectedFile.value);
    
    // 设置文件并开始上传
    uploader.value.setFile(selectedFile.value);
    await uploader.value.startUpload();
    
  } catch (error) {
    console.error('资源包上传失败:', error);
    ElMessage.error('资源包上传失败，请检查文件或网络后重试。');
    uploading.value = false;
  }
};

// 暂停上传
const pauseUpload = () => {
  if (uploader.value) {
    try {
      // 检查当前状态
      const status = uploader.value.getStatus();
      if (status.isPaused) {
        ElMessage.warning('上传已经处于暂停状态');
        return;
      }
      
      if (status.uploadedChunks === 0) {
        ElMessage.warning('还没有上传任何分块，无法暂停');
        return;
      }
      
      uploader.value.pause();
      uploadPaused.value = true;
      
      // 获取当前状态
      const currentStatus = uploader.value.getStatus();
      console.log('上传暂停状态:', currentStatus);
      
      ElMessage.success(`上传已暂停，已上传 ${currentStatus.uploadedChunks} 个分块，剩余 ${currentStatus.remainingChunks} 个分块`);
    } catch (error) {
      console.error('暂停上传失败:', error);
      ElMessage.error('暂停上传失败，请重试');
    }
  }
};

// 恢复上传
const resumeUpload = () => {
  if (uploader.value) {
    try {
      // 检查是否有剩余分块
      const status = uploader.value.getStatus();
      if (!status.isPaused) {
        ElMessage.warning('上传未处于暂停状态');
        return;
      }
      
      if (status.remainingChunks === 0) {
        ElMessage.warning('没有剩余分块需要上传');
        return;
      }
      
      uploader.value.resume();
      uploadPaused.value = false;
      
      console.log('恢复上传状态:', status);
      ElMessage.success(`继续上传，剩余 ${status.remainingChunks} 个分块`);
    } catch (error) {
      console.error('恢复上传失败:', error);
      ElMessage.error('恢复上传失败，请重试');
    }
  }
};

// 取消上传
const cancelUpload = () => {
  if (uploader.value) {
    try {
      ElMessageBox.confirm(
        '确定要取消上传吗？已上传的分块将被清空。',
        '确认取消',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        uploader.value.cancel();
        uploading.value = false;
        uploadPaused.value = false;
        uploadProgress.value = { completed: 0, total: 0, percentage: 0 };
        
        // 清理文件选择状态
        selectedFile.value = null;
        
        // 清理上传组件状态
        if (uploadRef.value) {
          uploadRef.value.clearFiles();
          if (uploadRef.value.uploadFiles) {
            uploadRef.value.uploadFiles = [];
          }
          if (uploadRef.value.fileList) {
            uploadRef.value.fileList = [];
          }
        }
        
        ElMessage.success('上传已取消');
      }).catch(() => {
        // 用户取消操作
      });
    } catch (error) {
      console.error('取消上传失败:', error);
      ElMessage.error('取消上传失败，请重试');
    }
  }
};

// 处理弹窗关闭事件
const onDialogClose = () => {
  console.log('=== 弹窗关闭事件触发 ===');
  resetResourceDialog();
};

// 处理弹窗关闭前的逻辑
const handleDialogClose = (done) => {
  console.log('=== 弹窗关闭前检查 ===');
  
  // 如果正在上传，提示用户
  if (uploading.value && uploadProgress.value.percentage < 100) {
    ElMessageBox.confirm(
      '文件正在上传中，确定要关闭弹窗吗？这将取消当前的上传任务。',
      '确认关闭',
      {
        confirmButtonText: '确定关闭',
        cancelButtonText: '继续上传',
        type: 'warning',
      }
    ).then(() => {
      console.log('用户确认关闭弹窗，强制清理状态');
      // 强制清理所有状态
      resetResourceDialog();
      showResourceDialog.value = false; // 确保弹窗状态被重置
      done(); // 关闭弹窗
    }).catch(() => {
      console.log('用户取消关闭弹窗');
      // 不关闭弹窗
    });
  } else {
    console.log('弹窗可以安全关闭，直接清理状态');
    resetResourceDialog();
    showResourceDialog.value = false; // 确保弹窗状态被重置
    done(); // 关闭弹窗
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function resetResourceDialog() {
  // 强制清理所有状态
  console.log('=== 开始重置资源对话框 ===');
  console.log('重置前状态:', {
    selectedFile: selectedFile.value?.name,
    uploading: uploading.value,
    uploadPaused: uploadPaused.value,
    hasUploader: !!uploader.value,
    progress: uploadProgress.value
  });
  
  // 1. 清理文件选择
  selectedFile.value = null;
  
  // 2. 清理上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
    // 强制清理el-upload组件的内部状态
    if (uploadRef.value.uploadFiles) {
      uploadRef.value.uploadFiles = [];
    }
    if (uploadRef.value.fileList) {
      uploadRef.value.fileList = [];
    }
    console.log('已清理上传组件文件列表和内部状态');
  }
  
  // 3. 重置上传状态
  uploading.value = false;
  uploadPaused.value = false;
  uploadProgress.value = { completed: 0, total: 0, percentage: 0 };
  
  // 4. 强制清理上传器实例
  if (uploader.value) {
    try {
      uploader.value.cancel();
      console.log('已取消上传器');
    } catch (error) {
      console.warn('取消上传器时出错:', error);
    }
    uploader.value = null;
    console.log('已清空上传器引用');
  }
  
  // 5. 强制清理可能的内存引用
  if (window.gc) {
    try {
      window.gc();
      console.log('已触发垃圾回收');
    } catch (error) {
      console.log('垃圾回收不可用');
    }
  }
  
  // 6. 强制重置上传组件的DOM状态
  if (uploadRef.value) {
    // 通过key强制重新渲染上传组件
    setTimeout(() => {
      if (uploadRef.value && uploadRef.value.$forceUpdate) {
        uploadRef.value.$forceUpdate();
      }
    }, 0);
  }
  
  // 7. 更新dialogKey强制重新渲染整个弹窗
  dialogKey.value++;
  
  // 8. 确保弹窗状态被重置
  showResourceDialog.value = false;
  
  console.log('=== 资源对话框重置完成 ===');
  console.log('重置后状态:', {
    selectedFile: selectedFile.value?.name,
    uploading: uploading.value,
    uploadPaused: uploadPaused.value,
    hasUploader: !!uploader.value,
    progress: uploadProgress.value,
    dialogOpen: showResourceDialog.value
  });
}

const filteredPlugins = computed(() => {
  console.log('filteredPlugins计算属性触发，plugins.value:', plugins.value);
  console.log('searchKeyword.value:', searchKeyword.value);
  
  if (!searchKeyword.value) {
    console.log('无搜索关键词，返回所有插件:', plugins.value);
    return plugins.value;
  }
  
  const keyword = searchKeyword.value.toLowerCase();
  const filtered = plugins.value.filter(p =>
    (p.name && p.name.toLowerCase().includes(keyword)) ||
    (p.plugin_key && p.plugin_key.toLowerCase().includes(keyword)) ||
    (p.author && p.author.toLowerCase().includes(keyword)) ||
    (p.description && p.description.toLowerCase().includes(keyword))
  );
  
  console.log('过滤后的插件:', filtered);
  return filtered;
});



// 刷新插件列表
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await Promise.all([fetchAllPlugins(), fetchEnabledPlugin()]);
    ElMessage.success('插件列表已刷新！');
  } catch (error) {
    ElMessage.error('刷新失败，请重试。');
  } finally {
    refreshing.value = false;
  }
};

// 打开资源上传弹窗
const openResourceDialog = () => {
  console.log('=== 打开资源上传弹窗 ===');
  // 确保弹窗打开前状态是干净的
  resetResourceDialog();
  // 延迟一下再打开弹窗，确保状态完全重置
  setTimeout(() => {
    showResourceDialog.value = true;
    console.log('弹窗已打开，状态:', showResourceDialog.value);
  }, 100);
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('PluginManagement组件挂载，开始加载数据...');
  console.log('初始plugins值:', plugins.value);
  console.log('初始enabledPlugin值:', enabledPlugin.value);
  
  fetchAllPlugins();
  fetchEnabledPlugin();
});
</script>

<style scoped>
.plugin-management {
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.enabled-alert {
  margin-left: 0;
  margin-top: 0;
  padding: 0 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.table-container {
  width: 100%;
  min-width: 0;
}

/* 上传对话框样式 */
.upload-container {
  min-height: 300px;
}

.file-select-area {
  padding: 20px 0;
}

.upload-progress-area {
  padding: 20px 0;
}

.file-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.file-info .el-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.file-name {
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
  flex: 1;
}

.file-size {
  color: #909399;
  font-size: 14px;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.progress-detail {
  margin-top: 8px;
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.upload-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.upload-controls .el-button {
  min-width: 100px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 上传器样式优化 */
.zip-uploader {
  width: 100%;
}

.zip-uploader .el-upload-dragger {
  width: 100%;
  height: 180px;
}

.zip-uploader .el-upload__tip {
  margin-top: 16px;
  color: #909399;
}
</style> 