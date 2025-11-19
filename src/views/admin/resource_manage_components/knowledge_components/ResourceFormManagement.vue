<template>
  <div class="resource-form-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="resourceFormSearchKeyword" 
          placeholder="关键字模糊查询" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-select v-model="resourceFormTypeSearch" placeholder="资源类型" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="媒体" value="media"></el-option>
          <el-option label="习题" value="item"></el-option>
        </el-select>
        <el-select v-model="resourceFormStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshResourceForms" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateResourceFormDialog">
          新增资源类型
        </el-button>
      </div>
    </div>

    <el-table :data="resourceFormList" style="width: 100%" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="formName" label="资源类型名称" width="200"></el-table-column>
      <el-table-column prop="description" label="资源类型描述" width="250"></el-table-column>
      <el-table-column prop="formType" label="资源类型" width="120">
        <template #default="scope">
          <el-tag :type="getFormTypeColor(scope.row.formType)">
            {{ getFormTypeText(scope.row.formType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploadedBy" label="上传者" width="120"></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <!-- 待审核状态：通过、拒绝 -->
          <template v-if="scope.row.status === 'PENDING'">
            <el-button type="success" size="small" @click="approveResourceForm(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectResourceForm(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、禁用 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="openEditResourceFormDialog(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="disableResourceForm(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableResourceForm(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="deleteResourceForm(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitResourceForm(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="deleteResourceForm(scope.row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建/编辑资源类型对话框 -->
    <el-dialog
      v-model="showResourceFormDialog"
      :title="isEditResourceForm ? '编辑资源类型' : '新增资源类型'"
      width="600px"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="resourceFormForm" :rules="resourceFormRules" ref="resourceFormFormRef" label-width="120px">
        <el-form-item label="资源类型标识" prop="formKey">
          <el-input 
            v-model="resourceFormForm.formKey" 
            :placeholder="isEditResourceForm ? '资源类型标识不可修改' : '请输入资源类型标识'"
            :disabled="isEditResourceForm"
            clearable
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="资源类型名称" prop="formName">
          <el-input 
            v-model="resourceFormForm.formName" 
            placeholder="请输入资源类型名称"
            clearable
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="资源类型描述(可选)" prop="description">
          <el-input 
            v-model="resourceFormForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入资源类型描述(可选)"
            maxlength="200"
            show-word-limit
            resize="none"
          ></el-input>
        </el-form-item>
        <el-form-item label="资源类型" prop="formType">
          <el-select v-model="resourceFormForm.formType" placeholder="选择资源类型" style="width: 100%">
            <el-option label="媒体" value="media"></el-option>
            <el-option label="习题" value="item"></el-option>
          </el-select>
        </el-form-item>
        <!-- 编辑时才显示状态选项 -->
        <el-form-item v-if="isEditResourceForm" label="状态" prop="status">
          <el-select v-model="resourceFormForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="待审核" value="PENDING"></el-option>
            <el-option label="启用" value="ENABLED"></el-option>
            <el-option label="禁用" value="DISABLED"></el-option>
            <el-option label="已拒绝" value="REJECTED"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResourceFormDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitResourceForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { getResourceFormList, createResourceForm, updateResourceForm, deleteResourceForm as deleteResourceFormApi } from '@/api/admin/admin_resource_manage_api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const resourceFormList = ref([]);
const resourceFormSearchKeyword = ref('');
const resourceFormTypeSearch = ref('');
const resourceFormStatusSearch = ref('');

// 资源类型相关
const showResourceFormDialog = ref(false);
const isEditResourceForm = ref(false);
const resourceFormFormRef = ref(null);
const resourceFormForm = ref({
  id: null,
  formKey: '',
  formName: '',
  description: '',
  formType: '',
  status: 'ENABLED'
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 表单验证规则
const resourceFormRules = {
  formKey: [{ required: true, message: '请输入资源类型标识', trigger: 'blur' }],
  formName: [{ required: true, message: '请输入资源类型名称', trigger: 'blur' }],
  description: [{ required: false, message: '请输入资源类型描述', trigger: 'blur' }],
  formType: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
  // 新增时不需要验证状态，编辑时才验证
  status: [{ required: false, message: '请选择状态', trigger: 'change' }]
};

// 获取资源类型列表
const fetchResourceForms = async () => {
  try {
    console.log('=== 开始获取资源类型列表 ===');
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      search_value: resourceFormSearchKeyword.value,
      form_type: resourceFormTypeSearch.value,
      status: resourceFormStatusSearch.value
    };
    
    console.log('获取资源类型列表请求参数:', params);
    console.log('发送请求到后端...');
    
    const response = await getResourceFormList(params);
    console.log('获取资源类型列表响应:', response);
    console.log('响应成功状态:', response.success);
    console.log('响应数据:', response.data);
    
    if (response.success && response.data && response.data.records) {
      console.log('响应数据有效，更新列表...');
      resourceFormList.value = response.data.records;
      totalCount.value = response.data.total;
      console.log('资源类型列表更新成功，记录数:', response.data.records.length);
      console.log('当前列表数据:', resourceFormList.value);
    } else {
      console.log('获取资源类型列表失败，响应格式不正确');
      console.log('响应成功状态:', response.success);
      console.log('响应数据:', response.data);
      resourceFormList.value = [];
      totalCount.value = 0;
    }
    
    console.log('=== 获取资源类型列表完成 ===');
  } catch (error) {
    console.error('=== 获取资源类型列表异常 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', error.message);
    console.error('错误响应:', error.response);
    ElMessage.error('获取资源类型列表失败');
    resourceFormList.value = [];
    totalCount.value = 0;
  }
};

// 刷新资源类型列表
const refreshResourceForms = () => {
  currentPage.value = 1;
  fetchResourceForms();
};

// 打开创建资源类型对话框
const openCreateResourceFormDialog = () => {
  isEditResourceForm.value = false;
  resourceFormForm.value = {
    id: null,
    formKey: '',
    formName: '',
    description: '',
    formType: '',
    status: 'ENABLED'
  };
  showResourceFormDialog.value = true;
  // 清除表单验证状态
  nextTick(() => {
    if (resourceFormFormRef.value) {
      resourceFormFormRef.value.clearValidate();
    }
  });
};

// 打开编辑资源类型对话框
const openEditResourceFormDialog = (resourceForm) => {
  isEditResourceForm.value = true;
  resourceFormForm.value = {
    id: resourceForm.id,
    formKey: resourceForm.formKey,
    formName: resourceForm.formName,
    description: resourceForm.description,
    formType: resourceForm.formType,
    status: resourceForm.status
  };
  showResourceFormDialog.value = true;
  // 清除表单验证状态
  nextTick(() => {
    if (resourceFormFormRef.value) {
      resourceFormFormRef.value.clearValidate();
    }
  });
};

// 提交资源类型表单
const submitResourceForm = async () => {
  try {
    await resourceFormFormRef.value.validate();
    
    if (isEditResourceForm.value) {
      // 更新资源类型 - 不传输formKey参数
      const updateData = {
        id: resourceFormForm.value.id,
        formName: resourceFormForm.value.formName,
        description: resourceFormForm.value.description,
        formType: resourceFormForm.value.formType,
        status: resourceFormForm.value.status
      };
      const response = await updateResourceForm(updateData);
      if (response.success) {
        ElMessage.success('资源类型更新成功');
        showResourceFormDialog.value = false;
        fetchResourceForms();
      } else {
        ElMessage.error(response.message || '资源类型更新失败');
      }
    } else {
      // 创建资源类型
      const createData = {
        formKey: resourceFormForm.value.formKey, // 使用用户输入的formKey
        formName: resourceFormForm.value.formName,
        description: resourceFormForm.value.description,
        formType: resourceFormForm.value.formType,
        uploadedBy: localStorage.getItem('user_key') || 'admin' // 从localStorage获取user_key
      };
      console.log('创建资源类型请求数据:', createData);
      const response = await createResourceForm(createData);
      console.log('创建资源类型响应:', response);
      if (response.success) {
        ElMessage.success('资源类型创建成功');
        showResourceFormDialog.value = false;
        fetchResourceForms();
      } else {
        ElMessage.error(response.message || '资源类型创建失败');
      }
    }
  } catch (error) {
    console.error('提交资源类型表单失败:', error);
    ElMessage.error('操作失败');
  }
};

// 删除资源类型
const deleteResourceForm = async (resourceForm) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除资源类型"${resourceForm.formName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await deleteResourceFormApi(resourceForm.id);
    if (response.success) {
      ElMessage.success('资源类型删除成功');
      fetchResourceForms();
    } else {
      ElMessage.error(response.message || '资源类型删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除资源类型失败:', error);
      // 检查是否是后端返回的特定错误信息
      if (error.response && error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message);
      } else if (error.message && error.message.includes('请检查学习活动资源')) {
        ElMessage.error(error.message);
      } else {
        ElMessage.error('删除时发生错误: 请检查学习活动资源是否仍存在依赖该资源类型的资源。');
      }
    }
  }
};

// 通过资源类型（待审核 -> 启用）
const approveResourceForm = async (resourceForm) => {
  try {
    await ElMessageBox.confirm('确定要通过该资源类型吗？', '提示', { type: 'info' });
    const updateData = {
      id: resourceForm.id,
      formName: resourceForm.formName,
      description: resourceForm.description,
      formType: resourceForm.formType,
      status: 'ENABLED'
    };
    const response = await updateResourceForm(updateData);
    if (response.success) {
      ElMessage.success('通过成功');
      fetchResourceForms();
    } else {
      ElMessage.error(response.message || '通过失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过失败:', error);
      ElMessage.error('通过失败');
    }
  }
};

// 拒绝资源类型（待审核 -> 已拒绝）
const rejectResourceForm = async (resourceForm) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该资源类型吗？', '提示', { type: 'warning' });
    const updateData = {
      id: resourceForm.id,
      formName: resourceForm.formName,
      description: resourceForm.description,
      formType: resourceForm.formType,
      status: 'REJECTED'
    };
    const response = await updateResourceForm(updateData);
    if (response.success) {
      ElMessage.success('拒绝成功');
      fetchResourceForms();
    } else {
      ElMessage.error(response.message || '拒绝失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error);
      ElMessage.error('拒绝失败');
    }
  }
};

// 禁用资源类型（启用 -> 禁用）
const disableResourceForm = async (resourceForm) => {
  try {
    console.log('=== 开始禁用资源类型 ===');
    console.log('原始资源类型数据:', resourceForm);
    
    await ElMessageBox.confirm('确定要禁用该资源类型吗？', '提示', { type: 'warning' });
    
    const updateData = {
      id: resourceForm.id,
      formName: resourceForm.formName,
      description: resourceForm.description,
      formType: resourceForm.formType,
      status: 'DISABLED'
    };
    
    console.log('禁用资源类型请求数据:', updateData);
    console.log('发送更新请求到后端...');
    
    const response = await updateResourceForm(updateData);
    console.log('禁用资源类型响应:', response);
    console.log('响应成功状态:', response.success);
    console.log('响应消息:', response.message);
    
    if (response.success) {
      console.log('更新成功，开始刷新列表...');
      ElMessage.success('禁用成功');
      await fetchResourceForms();
      console.log('列表刷新完成');
    } else {
      console.error('更新失败，响应消息:', response.message);
      ElMessage.error(response.message || '禁用失败');
    }
    
    console.log('=== 禁用资源类型流程结束 ===');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('=== 禁用资源类型异常 ===');
      console.error('错误对象:', error);
      console.error('错误消息:', error.message);
      console.error('错误响应:', error.response);
      ElMessage.error('禁用失败');
    }
  }
};

// 启用资源类型（禁用 -> 启用）
const enableResourceForm = async (resourceForm) => {
  try {
    console.log('=== 开始启用资源类型 ===');
    console.log('原始资源类型数据:', resourceForm);
    
    await ElMessageBox.confirm('确定要启用该资源类型吗？', '提示', { type: 'info' });
    
    const updateData = {
      id: resourceForm.id,
      formName: resourceForm.formName,
      description: resourceForm.description,
      formType: resourceForm.formType,
      status: 'ENABLED'
    };
    
    console.log('启用资源类型请求数据:', updateData);
    console.log('发送更新请求到后端...');
    
    const response = await updateResourceForm(updateData);
    console.log('启用资源类型响应:', response);
    console.log('响应成功状态:', response.success);
    console.log('响应消息:', response.message);
    
    if (response.success) {
      console.log('更新成功，开始刷新列表...');
      ElMessage.success('启用成功');
      await fetchResourceForms();
      console.log('列表刷新完成');
    } else {
      console.error('更新失败，响应消息:', response.message);
      ElMessage.error(response.message || '启用失败');
    }
    
    console.log('=== 启用资源类型流程结束 ===');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('=== 启用资源类型异常 ===');
      console.error('错误对象:', error);
      console.error('错误消息:', error.message);
      console.error('错误响应:', error.response);
      console.error('错误详情:', error.response?.data || error.message);
      console.error('错误状态码:', error.response?.status);
      ElMessage.error('启用失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

// 重审核资源类型（已拒绝 -> 待审核）
const resubmitResourceForm = async (resourceForm) => {
  try {
    await ElMessageBox.confirm('确定要重新提交审核该资源类型吗？', '提示', { type: 'info' });
    const updateData = {
      id: resourceForm.id,
      formName: resourceForm.formName,
      description: resourceForm.description,
      formType: resourceForm.formType,
      status: 'PENDING'
    };
    const response = await updateResourceForm(updateData);
    if (response.success) {
      ElMessage.success('重新提交审核成功');
      fetchResourceForms();
    } else {
      ElMessage.error(response.message || '重新提交审核失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新提交审核失败:', error);
      ElMessage.error('重新提交审核失败');
    }
  }
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchResourceForms();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchResourceForms();
};

// 获取资源类型颜色
const getFormTypeColor = (formType) => {
  const colorMap = {
    'media': 'primary',
    'item': 'success'
  };
  return colorMap[formType] || 'default';
};

// 获取资源类型文本
const getFormTypeText = (formType) => {
  const textMap = {
    'media': '媒体',
    'item': '习题'
  };
  return textMap[formType] || formType;
};

// 获取状态颜色
const getStatusType = (status) => {
  const colorMap = {
    'PENDING': 'warning',
    'ENABLED': 'success',
    'DISABLED': 'danger',
    'REJECTED': 'info'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'PENDING': '待审核',
    'ENABLED': '启用',
    'DISABLED': '禁用',
    'REJECTED': '已拒绝'
  };
  return textMap[status] || status;
};

// 监听搜索条件变化
watch([resourceFormSearchKeyword, resourceFormTypeSearch, resourceFormStatusSearch], () => {
  currentPage.value = 1;
  fetchResourceForms();
}, { deep: true });

// 组件挂载时获取数据
onMounted(() => {
  fetchResourceForms();
});
</script>

<style scoped>
.resource-form-management {
  width: 100%;
  min-width: 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 操作按钮样式优化 */
.el-table .el-button + .el-button {
  margin-left: 0;
}

.el-table .el-button.el-button--small {
  padding: 5px 11px;
  font-size: 12px;
}

/* 对话框样式优化 */
.el-dialog .el-form {
  padding: 0 20px;
}

.el-dialog .el-form-item {
  margin-bottom: 22px;
}

.el-dialog .el-input__inner,
.el-dialog .el-textarea__inner {
  font-size: 14px;
  line-height: 1.5;
}

.el-dialog .el-textarea__inner {
  font-family: inherit;
  resize: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: center;
  }
  
  .header-right {
    justify-content: center;
  }
}
</style>
