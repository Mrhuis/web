<template>
  <div class="knowledge-point-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="knowledgeSearchKeyword" 
          placeholder="关键字模糊查询" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-input 
          v-model="knowledgeNameSearch" 
          placeholder="知识点名称" 
          clearable 
          style="width: 150px; margin-right: 16px;" 
        />
        <el-select v-model="knowledgeDifficultySearch" placeholder="难度" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="入门" :value="1"></el-option>
          <el-option label="基础" :value="2"></el-option>
          <el-option label="中等" :value="3"></el-option>
          <el-option label="困难" :value="4"></el-option>
          <el-option label="专家" :value="5"></el-option>
        </el-select>
        <el-select v-model="knowledgeStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshKnowledge" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateKnowledgeDialog">
          新增知识点
        </el-button>
      </div>
    </div>

    <el-table :data="knowledgeList" style="width: 100%" border>
      <el-table-column prop="knowledge_key" label="知识点标识" width="150"></el-table-column>
      <el-table-column prop="name" label="知识点名称" width="200"></el-table-column>
      <el-table-column prop="difficulty" label="难度" width="100">
        <template #default="scope">
          <el-tag :type="getDifficultyType(scope.row.difficulty)">
            {{ getDifficultyText(scope.row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="300"></el-table-column>
      <el-table-column prop="prerequisite" label="前置知识点" min-width="240"></el-table-column>
      <el-table-column prop="uploaded_by" label="上传者" width="120"></el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="
            scope.row.status === 'ENABLED' ? 'success' :
            scope.row.status === 'PENDING' ? 'warning' :
            scope.row.status === 'DISABLED' ? 'info' : 'danger'
          ">
            {{
              scope.row.status === 'ENABLED' ? '启用' :
              scope.row.status === 'PENDING' ? '待审核' :
              scope.row.status === 'DISABLED' ? '禁用' : '已拒绝'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <!-- 待审核状态：通过、拒绝 -->
          <template v-if="scope.row.status === 'PENDING'">
            <el-button type="success" size="small" @click="approveKnowledge(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectKnowledge(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、禁用 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="editKnowledge(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="disableKnowledge(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableKnowledge(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="deleteKnowledge(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitKnowledge(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="deleteKnowledge(scope.row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页组件 -->
    <div class="pagination-container">
      <!-- <div style="margin-bottom: 10px; color: #666; font-size: 12px;">
        调试信息: 当前页 {{ currentPage }}, 每页 {{ pageSize }}, 总数 {{ totalCount }}
      </div> -->
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[5, 10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 知识点对话框 -->
    <el-dialog 
      v-model="showKnowledgeDialog" 
      :title="isEditKnowledge ? '编辑知识点' : '新增知识点'" 
      width="600px" 
      @closed="onKnowledgeDialogClosed"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="knowledgeForm" :rules="knowledgeRules" ref="knowledgeFormRef" label-width="100px">
        <el-form-item label="知识点标识" prop="knowledgeKey">
          <el-input 
            v-model="knowledgeForm.knowledgeKey" 
            :placeholder="isEditKnowledge ? '知识点标识不可修改' : '请输入知识点标识'" 
            :disabled="isEditKnowledge"
            clearable
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="knowledgeForm.name" placeholder="请输入知识点名称"></el-input>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="knowledgeForm.difficulty" placeholder="选择难度" style="width: 100%">
            <el-option label="入门" :value="1"></el-option>
            <el-option label="基础" :value="2"></el-option>
            <el-option label="中等" :value="3"></el-option>
            <el-option label="困难" :value="4"></el-option>
            <el-option label="专家" :value="5"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="knowledgeForm.description" type="textarea" :rows="4" placeholder="请输入知识点描述"></el-input>
        </el-form-item>
        <el-form-item label="前置知识点" prop="prerequisite">
          <el-select 
            v-model="knowledgeForm.prerequisite" 
            multiple 
            filterable 
            placeholder="选择前置知识点（可选）" 
            style="width: 100%"
            @visible-change="onPrerequisiteDropdownVisible"
          >
            <el-option
              v-for="knowledge in availableKnowledge"
              :key="knowledge.knowledge_key"
              :label="`${knowledge.name} (${knowledge.knowledge_key})`"
              :value="knowledge.knowledge_key"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showKnowledgeDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitKnowledge">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getKnowledgeList, createKnowledge, updateKnowledge, deleteKnowledge as deleteKnowledgeApi } from '@/api/admin/admin_resource_manage_api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const knowledgeList = ref([]);
const availableKnowledge = ref([]); // 用于前置知识点选择的知识点列表
const knowledgeSearchKeyword = ref('');
const knowledgeNameSearch = ref('');
const knowledgeDifficultySearch = ref('');
const knowledgeStatusSearch = ref('');

// 知识点相关
const showKnowledgeDialog = ref(false);
const isEditKnowledge = ref(false);
const knowledgeFormRef = ref(null);
const knowledgeForm = ref({
  knowledgeKey: '',
  name: '',
  difficulty: 1,
  description: '',
  prerequisite: []
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 表单验证规则
const knowledgeRules = {
  knowledgeKey: [{ required: true, message: '请输入知识点标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入知识点名称', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  description: [{ required: true, message: '请输入知识点描述', trigger: 'blur' }]
};

// 获取知识点列表
const fetchKnowledge = async () => {
  try {
    console.log('开始获取知识点列表...');
    
    // 构建查询参数
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      status: knowledgeStatusSearch.value || '',
      search_value: knowledgeSearchKeyword.value || '',
      name: knowledgeNameSearch.value || '',
      difficulty: knowledgeDifficultySearch.value || ''
    };
    
    console.log('发送查询参数:', params);
    console.log('当前分页状态 - currentPage:', currentPage.value, 'pageSize:', pageSize.value);
    
    const response = await getKnowledgeList(params);
    console.log('收到响应:', response);
    
    if (response.success) {
      // 处理分页结果
      const result = response.data;
      console.log('响应数据详情:', {
        records: result.records,
        total: result.total,
        current: result.current,
        size: result.size,
        pages: result.pages
      });
      
      knowledgeList.value = result.records || [];
      totalCount.value = result.total || 0;
      
      console.log('设置知识点列表:', knowledgeList.value);
      console.log('设置总记录数:', totalCount.value);
    } else {
      console.error('获取知识点列表失败:', response.message);
      ElMessage.error(response.message || '获取知识点列表失败');
    }
  } catch (error) {
    console.error('获取知识点列表异常:', error);
    ElMessage.error('获取知识点列表失败');
  }
};

// 难度相关
const getDifficultyType = (difficulty) => {
  const types = ['', 'success', 'info', 'warning', 'danger', 'danger'];
  return types[difficulty] || 'info';
};

const getDifficultyText = (difficulty) => {
  const texts = ['', '入门', '基础', '中等', '困难', '专家'];
  return texts[difficulty] || '未知';
};

// 获取可用的知识点列表（用于前置知识点选择）
const fetchAvailableKnowledge = async () => {
  try {
    console.log('获取可用知识点列表...');
    const params = {
      page_index: 1,
      page_size: 1000, // 获取大量数据用于选择
      status: 'ENABLED' // 只获取启用状态的知识点
    };
    
    const response = await getKnowledgeList(params);
    if (response.success) {
      const result = response.data;
      availableKnowledge.value = result.records || [];
      console.log('获取到可用知识点:', availableKnowledge.value.length, '个');
    } else {
      console.error('获取可用知识点失败:', response.message);
    }
  } catch (error) {
    console.error('获取可用知识点异常:', error);
  }
};

// 前置知识点下拉框显示时的处理
const onPrerequisiteDropdownVisible = (visible) => {
  if (visible && availableKnowledge.value.length === 0) {
    fetchAvailableKnowledge();
  }
};

// 知识点操作
const editKnowledge = (row) => {
  isEditKnowledge.value = true;
  knowledgeForm.value = {
    id: row.id,
    knowledgeKey: row.knowledge_key,
    name: row.name,
    difficulty: row.difficulty,
    description: row.description,
    prerequisite: typeof row.prerequisite === 'string'
      ? (row.prerequisite ? JSON.parse(row.prerequisite) : [])
      : (row.prerequisite || [])
  };
  showKnowledgeDialog.value = true;
};

const deleteKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该知识点吗？', '提示', { type: 'warning' });
    await deleteKnowledgeApi(row.id);
    ElMessage.success('删除成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 通过知识点（待审核 -> 启用）
const approveKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要通过该知识点吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      name: row.name,
      prerequisite: typeof row.prerequisite === 'string' ? row.prerequisite : JSON.stringify(row.prerequisite || []),
      difficulty: row.difficulty,
      description: row.description,
      status: 'ENABLED'
    };
    await updateKnowledge(row.knowledge_key, updateData);
    ElMessage.success('通过成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过失败:', error);
      ElMessage.error('通过失败');
    }
  }
};

// 拒绝知识点（待审核 -> 已拒绝）
const rejectKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该知识点吗？', '提示', { type: 'warning' });
    const updateData = {
      id: row.id,
      name: row.name,
      prerequisite: typeof row.prerequisite === 'string' ? row.prerequisite : JSON.stringify(row.prerequisite || []),
      difficulty: row.difficulty,
      description: row.description,
      status: 'REJECTED'
    };
    await updateKnowledge(row.knowledge_key, updateData);
    ElMessage.success('拒绝成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error);
      ElMessage.error('拒绝失败');
    }
  }
};

// 禁用知识点（启用 -> 禁用）
const disableKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用该知识点吗？', '提示', { type: 'warning' });
    const updateData = {
      id: row.id,
      name: row.name,
      prerequisite: typeof row.prerequisite === 'string' ? row.prerequisite : JSON.stringify(row.prerequisite || []),
      difficulty: row.difficulty,
      description: row.description,
      status: 'DISABLED'
    };
    await updateKnowledge(row.knowledge_key, updateData);
    ElMessage.success('禁用成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用失败:', error);
      ElMessage.error('禁用失败');
    }
  }
};

// 启用知识点（禁用 -> 启用）
const enableKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要启用该知识点吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      name: row.name,
      prerequisite: typeof row.prerequisite === 'string' ? row.prerequisite : JSON.stringify(row.prerequisite || []),
      difficulty: row.difficulty,
      description: row.description,
      status: 'ENABLED'
    };
    await updateKnowledge(row.knowledge_key, updateData);
    ElMessage.success('启用成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启用失败:', error);
      ElMessage.error('启用失败');
    }
  }
};

// 重审核知识点（已拒绝 -> 待审核）
const resubmitKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定要重新提交审核该知识点吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      name: row.name,
      prerequisite: typeof row.prerequisite === 'string' ? row.prerequisite : JSON.stringify(row.prerequisite || []),
      difficulty: row.difficulty,
      description: row.description,
      status: 'PENDING'
    };
    await updateKnowledge(row.knowledge_key, updateData);
    ElMessage.success('重新提交审核成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新提交审核失败:', error);
      ElMessage.error('重新提交审核失败');
    }
  }
};

const submitKnowledge = async () => {
  try {
    await knowledgeFormRef.value.validate();
    
    // 准备提交数据，处理前置知识点格式
    const submitData = {
      ...knowledgeForm.value,
      prerequisite: JSON.stringify(knowledgeForm.value.prerequisite || [])
    };
    
    if (isEditKnowledge.value) {
      // 更新时只提交允许的字段，且不包含 knowledgeKey / plugin_key
      const updateData = {
        id: knowledgeForm.value.id,
        name: knowledgeForm.value.name,
        difficulty: knowledgeForm.value.difficulty,
        description: knowledgeForm.value.description,
        prerequisite: submitData.prerequisite
      };
      await updateKnowledge(knowledgeForm.value.knowledgeKey, updateData);
      ElMessage.success('更新成功');
    } else {
      await createKnowledge(submitData);
      ElMessage.success('创建成功');
    }
    showKnowledgeDialog.value = false;
    resetKnowledgeForm();
    fetchKnowledge();
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败');
  }
};

const resetKnowledgeForm = () => {
  knowledgeForm.value = {
    knowledgeKey: '',
    name: '',
    difficulty: 1,
    description: '',
    prerequisite: []
  };
  isEditKnowledge.value = false;
};

// 打开新增知识点弹窗时重置编辑状态与表单
const openCreateKnowledgeDialog = () => {
  isEditKnowledge.value = false;
  resetKnowledgeForm();
  showKnowledgeDialog.value = true;
};

// 弹窗关闭后重置，避免标题残留为"编辑"
const onKnowledgeDialogClosed = () => {
  resetKnowledgeForm();
};

// 刷新知识点列表
const refreshKnowledge = () => {
  fetchKnowledge();
};

// 分页相关方法
const handleSizeChange = (val) => {
  console.log('handleSizeChange 被调用，新的 pageSize:', val);
  pageSize.value = val;
  currentPage.value = 1; // 当每页显示条数改变时，重置当前页为1
  console.log('准备获取数据，pageSize:', pageSize.value, 'currentPage:', currentPage.value);
  fetchKnowledge();
};

const handleCurrentChange = (val) => {
  console.log('handleCurrentChange 被调用，新的 currentPage:', val);
  currentPage.value = val;
  console.log('准备获取数据，pageSize:', pageSize.value, 'currentPage:', currentPage.value);
  fetchKnowledge();
};

// 监听筛选条件变化，自动重新获取数据
watch([knowledgeSearchKeyword, knowledgeNameSearch, knowledgeDifficultySearch, knowledgeStatusSearch], () => {
  currentPage.value = 1; // 重置到第一页
  fetchKnowledge();
});

// 组件挂载时加载数据
onMounted(() => {
  fetchKnowledge();
});
</script>

<style scoped>
.knowledge-point-management {
  width: 100%;
  min-width: 0;
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

:deep(.el-table) {
  width: 100%;
  min-width: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 确保弹窗不被侧边栏遮挡 */
:deep(.el-dialog) {
  z-index: 3000 !important;
}

:deep(.el-dialog__wrapper) {
  z-index: 3000 !important;
}

:deep(.el-overlay) {
  z-index: 2999 !important;
}
</style>
