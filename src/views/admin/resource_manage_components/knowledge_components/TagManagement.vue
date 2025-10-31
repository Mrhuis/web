<template>
  <div class="tag-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="tagSearchKeyword" 
          placeholder="关键字模糊查询" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-input 
          v-model="tagContentSearch" 
          placeholder="标签内容" 
          clearable 
          style="width: 150px; margin-right: 16px;" 
        />
        <el-select v-model="tagTypeSearch" placeholder="标签类型" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="通用" value="common"></el-option>
          <el-option label="习题" value="item"></el-option>
          <el-option label="媒体" value="media"></el-option>
        </el-select>
        <el-select v-model="tagStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshTags" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateTagDialog">
          新增标签
        </el-button>
      </div>
    </div>

    <el-table :data="tagList" style="width: 100%" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="tagContent" label="标签内容" width="200"></el-table-column>
      <el-table-column prop="tagDesc" label="标签描述" width="250"></el-table-column>
      <el-table-column prop="tagApplicableType" label="标签类型" width="120">
        <template #default="scope">
          <el-tag :type="getTagTypeColor(scope.row.tagApplicableType)">
            {{ getTagTypeText(scope.row.tagApplicableType) }}
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
            <el-button type="success" size="small" @click="approveTag(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectTag(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、禁用 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="openEditTagDialog(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="disableTag(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableTag(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="deleteTag(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitTag(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="deleteTag(scope.row)">
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

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="showTagDialog"
      :title="isEditTag ? '编辑标签' : '新增标签'"
      width="600px"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="tagForm" :rules="tagRules" ref="tagFormRef" label-width="120px">
        <el-form-item label="标签内容" prop="tagContent">
          <el-input 
            v-model="tagForm.tagContent" 
            placeholder="请输入标签内容"
            clearable
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="标签描述(可选)" prop="tagDesc">
          <el-input 
            v-model="tagForm.tagDesc" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入标签描述(可选)"
            maxlength="200"
            show-word-limit
            resize="none"
          ></el-input>
        </el-form-item>
        <el-form-item label="标签类型" prop="tagApplicableType">
          <el-select v-model="tagForm.tagApplicableType" placeholder="选择标签类型" style="width: 100%">
            <el-option label="通用" value="common"></el-option>
            <el-option label="习题" value="item"></el-option>
            <el-option label="媒体" value="media"></el-option>
          </el-select>
        </el-form-item>
        <!-- 编辑时才显示状态选项 -->
        <el-form-item v-if="isEditTag" label="状态" prop="status">
          <el-select v-model="tagForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="待审核" value="PENDING"></el-option>
            <el-option label="启用" value="ENABLED"></el-option>
            <el-option label="禁用" value="DISABLED"></el-option>
            <el-option label="已拒绝" value="REJECTED"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTagDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitTag">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getTagList, createTag, updateTag, deleteTag as deleteTagApi } from '@/api/admin/admin_resource_manage_api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const tagList = ref([]);
const tagSearchKeyword = ref('');
const tagContentSearch = ref('');
const tagTypeSearch = ref('');
const tagStatusSearch = ref('');

// 标签相关
const showTagDialog = ref(false);
const isEditTag = ref(false);
const tagFormRef = ref(null);
const tagForm = ref({
  id: null,
  tagContent: '',
  tagDesc: '',
  tagApplicableType: '',
  status: 'ENABLED'
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 表单验证规则
const tagRules = {
  tagContent: [{ required: true, message: '请输入标签内容', trigger: 'blur' }],
  tagDesc: [{ required: false, message: '请输入标签描述', trigger: 'blur' }],
  tagApplicableType: [{ required: true, message: '请选择标签类型', trigger: 'change' }],
  // 新增时不需要验证状态，编辑时才验证
  status: [{ required: false, message: '请选择状态', trigger: 'change' }]
};

// 获取标签列表
const fetchTags = async () => {
  try {
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      search_value: tagSearchKeyword.value,
      tag_content: tagContentSearch.value,
      tag_applicable_type: tagTypeSearch.value,
      status: tagStatusSearch.value
    };
    
    const response = await getTagList(params);
    if (response.success && response.data.records) {
      tagList.value = response.data.records;
      totalCount.value = response.data.total;
    } else {
      tagList.value = [];
      totalCount.value = 0;
    }
  } catch (error) {
    console.error('获取标签列表失败:', error);
    ElMessage.error('获取标签列表失败');
    tagList.value = [];
    totalCount.value = 0;
  }
};

// 刷新标签列表
const refreshTags = () => {
  currentPage.value = 1;
  fetchTags();
};

// 打开创建标签对话框
const openCreateTagDialog = () => {
  isEditTag.value = false;
  tagForm.value = {
    id: null,
    tagContent: '',
    tagDesc: '',
    tagApplicableType: '',
    status: 'ENABLED'
  };
  showTagDialog.value = true;
};

// 打开编辑标签对话框
const openEditTagDialog = (tag) => {
  isEditTag.value = true;
  tagForm.value = {
    id: tag.id,
    tagContent: tag.tagContent,
    tagDesc: tag.tagDesc,
    tagApplicableType: tag.tagApplicableType,
    status: tag.status
  };
  showTagDialog.value = true;
};

// 提交标签表单
const submitTag = async () => {
  try {
    await tagFormRef.value.validate();
    
    if (isEditTag.value) {
      // 更新标签
      const response = await updateTag(tagForm.value);
      if (response.success) {
        ElMessage.success('标签更新成功');
        showTagDialog.value = false;
        fetchTags();
      } else {
        ElMessage.error(response.message || '标签更新失败');
      }
    } else {
      // 创建标签，设置默认状态为待审核
      const createData = {
        tagContent: tagForm.value.tagContent,
        tagDesc: tagForm.value.tagDesc,
        tagApplicableType: tagForm.value.tagApplicableType,
        status: 'PENDING'  // 新标签默认为待审核状态
      };
      const response = await createTag(createData);
      if (response.success) {
        ElMessage.success('标签创建成功');
        showTagDialog.value = false;
        fetchTags();
      } else {
        ElMessage.error(response.message || '标签创建失败');
      }
    }
  } catch (error) {
    console.error('提交标签表单失败:', error);
    ElMessage.error('操作失败');
  }
};

// 删除标签
const deleteTag = async (tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签"${tag.tagContent}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await deleteTagApi(tag.id);
    if (response.success) {
      ElMessage.success('标签删除成功');
      fetchTags();
    } else {
      ElMessage.error(response.message || '标签删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 通过标签（待审核 -> 启用）
const approveTag = async (tag) => {
  try {
    await ElMessageBox.confirm('确定要通过该标签吗？', '提示', { type: 'info' });
    const updateData = {
      id: tag.id,
      tagContent: tag.tagContent,
      tagDesc: tag.tagDesc,
      tagApplicableType: tag.tagApplicableType,
      status: 'ENABLED'
    };
    const response = await updateTag(updateData);
    if (response.success) {
      ElMessage.success('通过成功');
      fetchTags();
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

// 拒绝标签（待审核 -> 已拒绝）
const rejectTag = async (tag) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该标签吗？', '提示', { type: 'warning' });
    const updateData = {
      id: tag.id,
      tagContent: tag.tagContent,
      tagDesc: tag.tagDesc,
      tagApplicableType: tag.tagApplicableType,
      status: 'REJECTED'
    };
    const response = await updateTag(updateData);
    if (response.success) {
      ElMessage.success('拒绝成功');
      fetchTags();
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

// 禁用标签（启用 -> 禁用）
const disableTag = async (tag) => {
  try {
    await ElMessageBox.confirm('确定要禁用该标签吗？', '提示', { type: 'warning' });
    const updateData = {
      id: tag.id,
      tagContent: tag.tagContent,
      tagDesc: tag.tagDesc,
      tagApplicableType: tag.tagApplicableType,
      status: 'DISABLED'
    };
    const response = await updateTag(updateData);
    if (response.success) {
      ElMessage.success('禁用成功');
      fetchTags();
    } else {
      ElMessage.error(response.message || '禁用失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用失败:', error);
      ElMessage.error('禁用失败');
    }
  }
};

// 启用标签（禁用 -> 启用）
const enableTag = async (tag) => {
  try {
    await ElMessageBox.confirm('确定要启用该标签吗？', '提示', { type: 'info' });
    const updateData = {
      id: tag.id,
      tagContent: tag.tagContent,
      tagDesc: tag.tagDesc,
      tagApplicableType: tag.tagApplicableType,
      status: 'ENABLED'
    };
    const response = await updateTag(updateData);
    if (response.success) {
      ElMessage.success('启用成功');
      fetchTags();
    } else {
      ElMessage.error(response.message || '启用失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启用失败:', error);
      ElMessage.error('启用失败');
    }
  }
};

// 重审核标签（已拒绝 -> 待审核）
const resubmitTag = async (tag) => {
  try {
    await ElMessageBox.confirm('确定要重新提交审核该标签吗？', '提示', { type: 'info' });
    const updateData = {
      id: tag.id,
      tagContent: tag.tagContent,
      tagDesc: tag.tagDesc,
      tagApplicableType: tag.tagApplicableType,
      status: 'PENDING'
    };
    const response = await updateTag(updateData);
    if (response.success) {
      ElMessage.success('重新提交审核成功');
      fetchTags();
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
  fetchTags();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTags();
};

// 获取标签类型颜色
const getTagTypeColor = (type) => {
  const colorMap = {
    'common': 'primary',
    'item': 'warning',
    'media': 'info'
  };
  return colorMap[type] || 'default';
};

// 获取标签类型文本
const getTagTypeText = (type) => {
  const textMap = {
    'common': '通用',
    'item': '习题',
    'media': '媒体'
  };
  return textMap[type] || type;
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
watch([tagSearchKeyword, tagContentSearch, tagTypeSearch, tagStatusSearch], () => {
  currentPage.value = 1;
  fetchTags();
}, { deep: true });

// 组件挂载时获取数据
onMounted(() => {
  fetchTags();
});
</script>

<style scoped>
.tag-management {
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
