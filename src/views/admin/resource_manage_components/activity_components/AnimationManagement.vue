<template>
  <div class="animation-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="animationSearchKeyword" 
          placeholder="搜索动画" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAnimationDialog = true">
          新增动画
        </el-button>
      </div>
    </div>

    <el-table :data="filteredAnimations" style="width: 100%" border>
      <el-table-column prop="media_key" label="动画标识" width="150"></el-table-column>
      <el-table-column prop="entry_point" label="入口点" width="150"></el-table-column>
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="scope">
          {{ formatDuration(scope.row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="file_name" label="文件名" width="200"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'CONFIRMED' ? 'success' : 'warning'">
            {{ scope.row.status === 'CONFIRMED' ? '已确认' : '未确认' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editAnimation(scope.row)" style="margin-right: 8px;">
            编辑
          </el-button>
          <el-button type="success" size="small" @click="previewAnimation(scope.row)" style="margin-right: 8px;">
            预览
          </el-button>
          <el-button type="danger" size="small" @click="deleteAnimation(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 动画对话框 -->
    <el-dialog v-model="showAnimationDialog" :title="isEditAnimation ? '编辑动画' : '新增动画'" width="600px">
      <el-form :model="animationForm" :rules="animationRules" ref="animationFormRef" label-width="100px">
        <el-form-item label="动画标识" prop="media_key">
          <el-input v-model="animationForm.media_key" placeholder="请输入动画标识"></el-input>
        </el-form-item>
        <el-form-item label="所属插件" prop="plugin_key">
          <el-select v-model="animationForm.plugin_key" placeholder="选择插件" style="width: 100%">
            <el-option
              v-for="plugin in plugins"
              :key="plugin.plugin_key"
              :label="plugin.name"
              :value="plugin.plugin_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入口点" prop="entry_point">
          <el-input v-model="animationForm.entry_point" placeholder="请输入动画入口点"></el-input>
        </el-form-item>
        <el-form-item label="动画脚本" prop="implementation_script">
          <el-input v-model="animationForm.implementation_script" type="textarea" :rows="6" placeholder="请输入动画实现脚本"></el-input>
        </el-form-item>
        <el-form-item label="时长(秒)" prop="duration">
          <el-input-number v-model="animationForm.duration" :min="0" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="animationForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="未确认" value="UNCONFIRMED"></el-option>
            <el-option label="已确认" value="CONFIRMED"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAnimationDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitAnimation">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getAllPlugins,
  getMediaList, 
  createMedia, 
  updateMedia, 
  deleteMedia as deleteMediaApi
} from '@/api/admin/admin_resource_manage_api';

// Props
const props = defineProps({
  selectedPluginForAnimation: {
    type: String,
    default: ''
  }
});

// 数据
const plugins = ref([]);
const animationList = ref([]);
const animationSearchKeyword = ref('');

// 动画相关
const showAnimationDialog = ref(false);
const isEditAnimation = ref(false);
const animationFormRef = ref(null);
const animationForm = ref({
  media_key: '',
  plugin_key: '',
  entry_point: '',
  implementation_script: '',
  duration: 0,
  status: 'UNCONFIRMED'
});

// 表单验证规则
const animationRules = {
  media_key: [{ required: true, message: '请输入动画标识', trigger: 'blur' }],
  plugin_key: [{ required: true, message: '请选择所属插件', trigger: 'change' }],
  entry_point: [{ required: true, message: '请输入入口点', trigger: 'blur' }]
};

// 获取插件列表
const fetchPlugins = async (queryParams = {}) => {
  try {
    const response = await getAllPlugins(queryParams);
    if (response.success) {
      const result = response.data;
      plugins.value = result.records || [];
    } else {
      ElMessage.error(response.message || '获取插件列表失败');
    }
  } catch (error) {
    ElMessage.error('获取插件列表失败');
  }
};

// 获取动画列表
const fetchAnimations = async () => {
  try {
    const response = await getMediaList(props.selectedPluginForAnimation, 'animation');
    animationList.value = response.data;
  } catch (error) {
    ElMessage.error('获取动画列表失败');
  }
};

// 过滤数据
const filteredAnimations = computed(() => {
  let filtered = animationList.value;
  if (props.selectedPluginForAnimation) {
    filtered = filtered.filter(a => a.plugin_key === props.selectedPluginForAnimation);
  }
  if (animationSearchKeyword.value) {
    const keyword = animationSearchKeyword.value.toLowerCase();
    filtered = filtered.filter(a => 
      a.media_key.toLowerCase().includes(keyword) ||
      a.entry_point.toLowerCase().includes(keyword)
    );
  }
  return filtered;
});

// 工具函数
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

// 动画操作
const editAnimation = (row) => {
  isEditAnimation.value = true;
  animationForm.value = { ...row };
  showAnimationDialog.value = true;
};

const deleteAnimation = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该动画吗？', '提示', { type: 'warning' });
    await deleteMediaApi(row.media_key);
    ElMessage.success('删除成功');
    fetchAnimations();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const previewAnimation = (row) => {
  if (row.url) {
    // 构建正确的访问URL
    let previewUrl = row.url;
    if (!row.url.startsWith('http')) {
      // 数据库中存储的是相对路径，如 ./media/xxx.mp4 或 /media/xxx.mp4
      // 通过Vite代理访问后端静态资源
      let cleanUrl = row.url;
      // 移除开头的 ./ 如果存在
      if (cleanUrl.startsWith('./')) {
        cleanUrl = cleanUrl.substring(1);
      }
      // 确保以 / 开头
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }
      previewUrl = cleanUrl; // 使用Vite代理，不需要完整的URL
    }
    window.open(previewUrl, '_blank');
  } else {
    ElMessage.warning('动画链接不存在');
  }
};

const submitAnimation = async () => {
  try {
    await animationFormRef.value.validate();
    if (isEditAnimation.value) {
      await updateMedia(animationForm.value.media_key, animationForm.value);
      ElMessage.success('更新成功');
    } else {
      await createMedia(animationForm.value);
      ElMessage.success('创建成功');
    }
    showAnimationDialog.value = false;
    resetAnimationForm();
    fetchAnimations();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

const resetAnimationForm = () => {
  animationForm.value = {
    media_key: '',
    plugin_key: '',
    entry_point: '',
    implementation_script: '',
    duration: 0,
    status: 'UNCONFIRMED'
  };
  isEditAnimation.value = false;
};

// 监听筛选条件变化
watch(() => props.selectedPluginForAnimation, () => {
  fetchAnimations();
});

// 组件挂载时加载数据
onMounted(() => {
  fetchPlugins();
  fetchAnimations();
});
</script>

<style scoped>
.animation-management {
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
