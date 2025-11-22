<template>
  <AdminLayout>
    <div class="sys-config-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">系统设置</h1>
        <p class="page-subtitle">管理推荐系统相关配置</p>
      </div>

      <!-- 操作工具栏 -->
      <div class="toolbar">
        <el-button type="primary" :icon="Refresh" @click="fetchConfig" :loading="loading">
          刷新配置
        </el-button>
        <el-button type="success" :icon="Download" @click="handleExport">
          导出配置
        </el-button>
        <el-button type="warning" :icon="Upload" @click="handleImportClick">
          导入配置
        </el-button>
        <el-button type="info" :icon="Document" @click="fetchModels" :loading="loadingModels">
          刷新模型列表
        </el-button>
        <el-button 
          type="danger" 
          :icon="VideoPlay" 
          @click="handleRunPipeline" 
          :loading="runningPipeline"
        >
          执行流水线任务
        </el-button>
        <el-button 
          type="primary" 
          :icon="Check" 
          @click="handleSaveAll" 
          :loading="saving"
          :disabled="!hasChanges"
        >
          保存所有更改
        </el-button>
      </div>

      <!-- 配置项表格 -->
      <el-card class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>系统配置项</span>
            <el-tag v-if="hasChanges" type="warning">有未保存的更改</el-tag>
          </div>
        </template>
        <el-table 
          :data="configList" 
          style="width: 100%"
          v-loading="loading"
          empty-text="暂无配置项"
        >
          <el-table-column prop="key" label="配置项" width="250" show-overflow-tooltip>
            <template #default="scope">
              <el-tag type="info" size="small">{{ scope.row.key }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="值" min-width="300">
            <template #default="scope">
              <el-select 
                v-if="scope.row.key === 'USED_MODEL'"
                v-model="scope.row.value" 
                @change="onConfigChange(scope.row)"
                :placeholder="`请选择${scope.row.key}的值`"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="model in modelList"
                  :key="model"
                  :label="model"
                  :value="model"
                />
              </el-select>
              <el-input 
                v-else
                v-model="scope.row.value" 
                @change="onConfigChange(scope.row)"
                :placeholder="`请输入${scope.row.key}的值`"
                clearable
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="300" show-overflow-tooltip>
            <template #default="scope">
              <span class="description-text" :title="scope.row.description">{{ scope.row.description || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                type="primary" 
                link 
                size="small" 
                @click="handleSaveSingle(scope.row)"
                :loading="scope.row.saving"
              >
                保存
              </el-button>
              <el-button 
                type="info" 
                link 
                size="small" 
                @click="handleResetSingle(scope.row)"
              >
                重置
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 模型文件列表 -->
      <el-card class="models-card" shadow="never" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>模型文件列表</span>
            <el-tag type="success">{{ modelList.length }} 个模型</el-tag>
          </div>
        </template>
        <div v-loading="loadingModels">
          <el-empty v-if="modelList.length === 0" description="暂无模型文件" />
          <el-tag 
            v-for="(model, index) in modelList" 
            :key="index"
            type="success"
            style="margin: 4px 8px 4px 0;"
            size="large"
          >
            {{ model }}
          </el-tag>
        </div>
      </el-card>

      <!-- 消息提示 -->
      <el-alert 
        v-if="showAlert" 
        :title="alertMessage" 
        :type="alertType" 
        show-icon 
        :closable="false"
        style="margin-top: 16px;"
      />

      <!-- 导入配置对话框 -->
      <el-dialog
        v-model="showImportDialog"
        title="导入配置"
        width="500px"
      >
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".json"
          drag
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将JSON文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传JSON格式的配置文件
            </div>
          </template>
        </el-upload>
        <template #footer>
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :loading="importing">
            确认导入
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Download, Upload, Document, Check, UploadFilled, VideoPlay } from '@element-plus/icons-vue';
import AdminLayout from './AdminLayout.vue';
import {
  getSystemConfig,
  updateSystemConfig,
  exportSystemConfig,
  importSystemConfig,
  getModelList,
  runPipeline
} from '@/api/admin/admin_system_settings_api.js';

// 数据状态
const configList = ref([]);
const originalConfig = ref({});
const modelList = ref(['DEFAULT']); // 默认包含 DEFAULT 选项
const loading = ref(false);
const loadingModels = ref(false);
const saving = ref(false);
const importing = ref(false);
const runningPipeline = ref(false);
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
const showImportDialog = ref(false);
const importFile = ref(null);
const uploadRef = ref(null);

// 配置项说明映射
const configDescriptions = {
  // 文件路径配置
  'TRAINING_SETS_DIR': '训练集输出位置',
  'TRAINING_MODELS_DIR': '训练集模型输出位置',
  'MODEL_CONFIG_DIR': '模型特征配置文件位置',
  'USER_FEATURE_DIR': '用户滞后暂时用特征文件存贮位置',
  'CONTENT_FEATURE_DIR': '内容静态特征文件存贮位置',
  'USER_RECOMMEND_RESOURCE_DIR': '用户推荐资源文件位置',
  
  // 推荐系统配置
  'HIGH_MATCHING_CANDIDATE_RESOURCE_COUNT': '高匹配备选资源个数',
  'RECOMMEND_USED_RESOURCES': '是否推荐使用过后的资源（-1：不使用过。0：无限制。1：使用过）',
  'USED_MODEL': '使用的模型',
  
  // 特征配置
  'CONTINUOUS_COLS': '连续特征（区分连续/类别特征）',
  'CATEGORICAL_COLS': '类别特征（区分连续/类别特征）',
  'TARGET_COL': '目标列',
  
  // 数据配置
  'DEFAULT_TRAIN_NUM': '训练数据条数，数据集个数',
  'BATCH_SIZE': '批次大小：每次送入模型训练的样本数量',
  
  // 模型配置
  'EMBEDDING_DIM': '类别特征嵌入维度，用于将高维离散的类别特征（如is_correct、resource_tags）映射为低维连续向量的长度（此处为16维）。避免维度爆炸，内存开销剧增，高维度下数据会呈现"稀疏性"，过拟合严重，高维度下，有用特征的权重会被大量"无效稀疏特征"稀释。',
  'DNN_HIDDEN': '隐藏层结构，列表中每个数字代表对应隐藏层的神经元数量（此处为3层：128→64→32）。',
  'DROPOUT': '训练时随机"关闭"（丢弃）神经元的比例（此处为20%）。提升预测新数据的泛化能力',
  
  // 训练配置
  'EPOCHS': '训练轮数',
  'LR': '学习率',
  'DEVICE': '训练设备(gpu/cpu)',
  
  // 其他配置（兼容旧配置项）
  'recommend_algo': '推荐算法类型',
  'upload_max_size': '上传文件最大大小',
  'model_path': '模型文件路径',
  'batch_size': '批处理大小',
  'learning_rate': '学习率',
  'epochs': '训练轮数',
  'embedding_dim': '嵌入维度',
  'hidden_units': '隐藏层单元数'
};

// 去掉文件后缀的辅助函数
const removeFileExtension = (filename) => {
  if (!filename) return filename;
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.substring(0, lastDotIndex);
};

// 计算属性
const hasChanges = computed(() => {
  return configList.value.some(item => {
    const originalValue = originalConfig.value[item.key];
    return originalValue !== undefined && String(originalValue) !== String(item.value);
  });
});

// 获取配置列表
const fetchConfig = async () => {
  loading.value = true;
  try {
    const response = await getSystemConfig();
    if (response.success) {
      const config = response.data || {};
      
      // 如果 USED_MODEL 存在且包含后缀，去掉后缀
      if (config.USED_MODEL) {
        config.USED_MODEL = removeFileExtension(config.USED_MODEL);
      }
      
      originalConfig.value = JSON.parse(JSON.stringify(config));
      
      // 转换为表格数据格式
      configList.value = Object.keys(config).map(key => ({
        key,
        value: config[key],
        description: configDescriptions[key] || '',
        saving: false,
        originalValue: config[key]
      }));
      
      ElMessage.success('配置加载成功');
    } else {
      ElMessage.error(response.message || '获取配置失败');
    }
  } catch (error) {
    console.error('获取配置失败:', error);
    ElMessage.error('获取配置失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 获取模型列表
const fetchModels = async () => {
  loadingModels.value = true;
  try {
    const response = await getModelList();
    if (response.success) {
      // 去掉文件后缀，只保留文件名
      const models = response.data?.data || [];
      const processedModels = models.map(model => removeFileExtension(model));
      
      // 确保 DEFAULT 选项存在，并放在最前面
      if (!processedModels.includes('DEFAULT')) {
        processedModels.unshift('DEFAULT');
      } else {
        // 如果已存在，移到最前面
        const defaultIndex = processedModels.indexOf('DEFAULT');
        processedModels.splice(defaultIndex, 1);
        processedModels.unshift('DEFAULT');
      }
      
      modelList.value = processedModels;
      ElMessage.success('模型列表加载成功');
    } else {
      ElMessage.error(response.message || '获取模型列表失败');
    }
  } catch (error) {
    console.error('获取模型列表失败:', error);
    ElMessage.error('获取模型列表失败: ' + (error.message || '未知错误'));
  } finally {
    loadingModels.value = false;
  }
};

// 配置项变化
const onConfigChange = (row) => {
  // 如果是 USED_MODEL，去掉文件后缀
  if (row.key === 'USED_MODEL' && row.value) {
    row.value = removeFileExtension(row.value);
  }
  // 标记为已修改
  row.modified = String(row.originalValue) !== String(row.value);
};

// 保存单个配置项
const handleSaveSingle = async (row) => {
  row.saving = true;
  try {
    // 如果是 USED_MODEL，确保去掉文件后缀
    let valueToSave = row.value;
    if (row.key === 'USED_MODEL' && valueToSave) {
      valueToSave = removeFileExtension(valueToSave);
      row.value = valueToSave; // 更新显示的值
    }
    
    const updateConfig = {
      [row.key]: valueToSave
    };
    
    const response = await updateSystemConfig(updateConfig);
    if (response.success) {
      const result = response.data || {};
      const invalidConfigs = result.invalid_configs || [];
      
      if (invalidConfigs.includes(row.key)) {
        ElMessage.error(`配置项 ${row.key} 更新失败`);
        // 恢复原值
        row.value = row.originalValue;
      } else {
        ElMessage.success(`配置项 ${row.key} 更新成功`);
        row.originalValue = row.value;
        originalConfig.value[row.key] = row.value;
        row.modified = false;
        showSuccessAlert('配置已更新，系统将自动热刷新！');
      }
    } else {
      ElMessage.error(response.message || '更新配置失败');
      row.value = row.originalValue;
    }
  } catch (error) {
    console.error('更新配置失败:', error);
    ElMessage.error('更新配置失败: ' + (error.message || '未知错误'));
    row.value = row.originalValue;
  } finally {
    row.saving = false;
  }
};

// 重置单个配置项
const handleResetSingle = (row) => {
  row.value = row.originalValue;
  row.modified = false;
  ElMessage.info('已重置为原始值');
};

// 保存所有更改
const handleSaveAll = async () => {
  if (!hasChanges.value) {
    ElMessage.warning('没有需要保存的更改');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确定要保存所有更改吗？系统将自动热刷新配置。',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    saving.value = true;
    
    // 收集所有更改的配置项
    const updateConfig = {};
    configList.value.forEach(item => {
      if (String(item.originalValue) !== String(item.value)) {
        // 如果是 USED_MODEL，确保去掉文件后缀
        let valueToSave = item.value;
        if (item.key === 'USED_MODEL' && valueToSave) {
          valueToSave = removeFileExtension(valueToSave);
          item.value = valueToSave; // 更新显示的值
        }
        updateConfig[item.key] = valueToSave;
      }
    });

    const response = await updateSystemConfig(updateConfig);
    if (response.success) {
      const result = response.data || {};
      const updatedConfigs = result.updated_configs || [];
      const invalidConfigs = result.invalid_configs || [];

      if (invalidConfigs.length > 0) {
        ElMessage.warning(`部分配置项更新失败: ${invalidConfigs.join(', ')}`);
        // 恢复失败的配置项
        configList.value.forEach(item => {
          if (invalidConfigs.includes(item.key)) {
            item.value = item.originalValue;
          } else if (updatedConfigs.includes(item.key)) {
            item.originalValue = item.value;
            originalConfig.value[item.key] = item.value;
            item.modified = false;
          }
        });
      } else {
        ElMessage.success('所有配置项更新成功');
        // 更新原始值
        configList.value.forEach(item => {
          if (updatedConfigs.includes(item.key)) {
            item.originalValue = item.value;
            originalConfig.value[item.key] = item.value;
            item.modified = false;
          }
        });
        showSuccessAlert('配置已更新，系统将自动热刷新！');
      }
    } else {
      ElMessage.error(response.message || '更新配置失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存配置失败:', error);
      ElMessage.error('保存配置失败: ' + (error.message || '未知错误'));
    }
  } finally {
    saving.value = false;
  }
};

// 导出配置
const handleExport = async () => {
  try {
    const response = await exportSystemConfig();
    if (response.success) {
      const config = response.data || {};
      const jsonStr = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      ElMessage.success('配置导出成功');
    } else {
      ElMessage.error(response.message || '导出配置失败');
    }
  } catch (error) {
    console.error('导出配置失败:', error);
    ElMessage.error('导出配置失败: ' + (error.message || '未知错误'));
  }
};

// 点击导入按钮
const handleImportClick = () => {
  showImportDialog.value = true;
  importFile.value = null;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

// 文件选择变化
const handleFileChange = (file) => {
  importFile.value = file.raw;
};

// 导入配置
const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的JSON文件');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '导入配置将覆盖当前配置，确定要继续吗？',
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    importing.value = true;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importConfig = JSON.parse(e.target.result);
        
        // 如果导入的配置中包含 USED_MODEL，去掉文件后缀
        if (importConfig.USED_MODEL) {
          importConfig.USED_MODEL = removeFileExtension(importConfig.USED_MODEL);
        }
        
        const response = await importSystemConfig(importConfig);
        if (response.success) {
          ElMessage.success('配置导入成功');
          showImportDialog.value = false;
          // 重新加载配置
          await fetchConfig();
        } else {
          ElMessage.error(response.message || '导入配置失败');
        }
      } catch (parseError) {
        console.error('解析JSON失败:', parseError);
        ElMessage.error('配置文件格式错误，请检查JSON格式');
      } finally {
        importing.value = false;
      }
    };
    
    reader.onerror = () => {
      ElMessage.error('读取文件失败');
      importing.value = false;
    };
    
    reader.readAsText(importFile.value);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导入配置失败:', error);
      ElMessage.error('导入配置失败: ' + (error.message || '未知错误'));
    }
    importing.value = false;
  }
};

// 执行流水线任务
const handleRunPipeline = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要立即执行推荐系统流水线任务吗？此操作可能需要较长时间，请耐心等待。',
      '确认执行流水线任务',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    runningPipeline.value = true;
    
    const response = await runPipeline();
    if (response.success) {
      const result = response.data || {};
      const message = result.message || '流水线任务执行成功';
      ElMessage.success(message);
      showSuccessAlert(message);
    } else {
      const errorMessage = response.message || '执行流水线任务失败';
      ElMessage.error(errorMessage);
      alertMessage.value = errorMessage;
      alertType.value = 'error';
      showAlert.value = true;
      setTimeout(() => {
        showAlert.value = false;
      }, 5000);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('执行流水线任务失败:', error);
      const errorMessage = '执行流水线任务失败: ' + (error.message || '未知错误');
      ElMessage.error(errorMessage);
      alertMessage.value = errorMessage;
      alertType.value = 'error';
      showAlert.value = true;
      setTimeout(() => {
        showAlert.value = false;
      }, 5000);
    }
  } finally {
    runningPipeline.value = false;
  }
};

// 显示成功提示
const showSuccessAlert = (message) => {
  alertMessage.value = message;
  alertType.value = 'success';
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
};

// 组件挂载时加载数据
onMounted(() => {
  fetchConfig();
  fetchModels();
});
</script>

<style scoped>
.sys-config-container {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
  padding: 0 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.config-card,
.models-card {
  border: 1px solid #e5e7eb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.description-text {
  color: #6b7280;
  font-size: 13px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-card__header) {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style>
