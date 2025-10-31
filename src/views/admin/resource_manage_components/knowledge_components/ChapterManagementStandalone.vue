<template>
  <div class="chapter-management-standalone">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="chapterSearchKeyword" 
          placeholder="关键字模糊查询" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-input 
          v-model="chapterNameSearch" 
          placeholder="章节名称" 
          clearable 
          style="width: 150px; margin-right: 16px;" 
        />
        <el-select v-model="chapterLevelSearch" placeholder="目录层级" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="一级目录" :value="1"></el-option>
          <el-option label="二级目录" :value="2"></el-option>
          <el-option label="三级目录" :value="3"></el-option>
        </el-select>
        <el-select v-model="chapterStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshChapters" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateChapterDialog">
新增章节
        </el-button>
      </div>
    </div>

    <el-table :data="chapterList" style="width: 100%" border>
      <el-table-column prop="chapterKey" label="章节标识" width="150"></el-table-column>
      <el-table-column prop="name" label="章节名称" width="200"></el-table-column>
      <el-table-column prop="level" label="层级" width="100">
        <template #default="scope">
          <el-tag>{{ scope.row.level }}级</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="100"></el-table-column>
      <el-table-column prop="parentChapterKey" label="父章节" width="150"></el-table-column>
      <el-table-column prop="description" label="描述" min-width="300"></el-table-column>
      <el-table-column prop="uploadedBy" label="上传者" width="120"></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180"></el-table-column>
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
            <el-button type="success" size="small" @click="approveChapter(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectChapter(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、禁用 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="editChapter(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="disableChapter(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableChapter(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteChapter(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitChapter(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteChapter(scope.row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页组件 -->
    <div class="pagination-container">
      <!-- <div>
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

    <!-- 章节对话框 -->
    <el-dialog 
      v-model="showChapterDialog" 
      :title="isEditChapter ? '编辑章节' : '新增章节'" 
      width="600px" 
      @closed="onChapterDialogClosed"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="chapterForm" :rules="chapterRules" ref="chapterFormRef" label-width="100px">
        <el-form-item label="章节标识" prop="chapterKey">
          <el-input 
            v-model="chapterForm.chapterKey" 
            :placeholder="isEditChapter ? '章节标识不可修改' : '请输入章节标识'" 
            :disabled="isEditChapter"
            clearable
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="章节名称" prop="name">
          <el-input v-model="chapterForm.name" placeholder="请输入章节名称"></el-input>
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-select 
            v-model="chapterForm.level" 
            placeholder="选择层级" 
            style="width: 100%" 
            @change="onLevelChange"
            popper-class="chapter-level-select"
          >
            <el-option label="一级目录" :value="1"></el-option>
            <el-option label="二级目录" :value="2"></el-option>
            <el-option label="三级目录" :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="chapterForm.sortOrder" :min="0" style="width: 100%"></el-input-number>
        </el-form-item>
        
        <!-- 修复：父章节选择器 -->
        <el-form-item label="父章节" prop="parentChapterKey" v-if="chapterForm.level > 1">
          <el-cascader
            v-model="chapterForm.parentChapterKey"
            :options="parentChapterTree"
            :props="cascaderProps"
            placeholder="选择父章节"
            clearable
            style="width: 100%"
            :loading="parentChaptersLoading"
            @change="onParentChapterChange"
            filterable
            :show-all-levels="false"
          />
        </el-form-item>
        
        <!-- 备选方案：使用树形选择器 -->
        <el-form-item label="父章节" prop="parentChapterKey" v-if="chapterForm.level > 1 && useTreeSelect">
          <el-tree-select
            v-model="chapterForm.parentChapterKey"
            :data="parentChapterTree"
            :props="treeSelectProps"
            placeholder="选择父章节"
            clearable
            style="width: 100%"
            :loading="parentChaptersLoading"
            filterable
            check-strictly
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input v-model="chapterForm.description" type="textarea" :rows="4" placeholder="请输入章节描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChapterDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitChapter">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getChapterList, createChapter, updateChapter, deleteChapter } from '@/api/admin/admin_resource_manage_api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

// 搜索条件
const chapterSearchKeyword = ref('');
const chapterNameSearch = ref('');
const chapterLevelSearch = ref('');
const chapterStatusSearch = ref('');

// 章节列表数据
const chapterList = ref([]);

// 对话框相关
const showChapterDialog = ref(false);
const isEditChapter = ref(false);
const chapterFormRef = ref(null);
const chapterForm = ref({
  id: null, // 添加ID字段用于编辑
  chapterKey: '',
  name: '',
  level: 1,
  sortOrder: 0,
  parentChapterKey: '',
  description: ''
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 父章节相关 - 新的实现方式
const parentChapters = ref([]);
const parentChaptersLoading = ref(false);
const parentChapterTree = ref([]);
const parentChapterPath = ref([]);
const useTreeSelect = ref(false); // 控制使用哪种选择器

// 修复：级联选择器配置
const cascaderProps = {
  value: 'chapterKey',  // 修改：使用驼峰命名，匹配后端返回的字段名
  label: 'name',
  children: 'children',
  emitPath: false, // 只返回最后一级的值
  checkStrictly: true // 可以选择任意一级
};

// 修复：树形选择器配置
const treeSelectProps = {
  value: 'chapterKey',  // 修改：使用驼峰命名
  label: 'name',
  children: 'children'
};

// 表单验证规则
const chapterRules = {
  chapterKey: [{ required: true, message: '请输入章节标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入章节名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择层级', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
};

// 层级变化时获取父章节
const onLevelChange = async (level) => {
  if (level > 1) {
    await fetchParentChaptersForTree(level - 1);
  } else {
    parentChapters.value = [];
    parentChapterTree.value = [];
    parentChapterPath.value = [];
    chapterForm.value.parentChapterKey = '';
  }
};

// 修复：简化的获取父章节方法
const fetchParentChaptersForTree = async (parentLevel) => {
  try {
    parentChaptersLoading.value = true;
    console.log('开始获取父章节，层级:', parentLevel);
    
    // 直接获取指定层级的章节
    const params = {
      page_index: 1,
      page_size: 1000,
      level: parentLevel
    };
    
    const response = await getChapterList(params);
    console.log('获取父章节响应:', response);
    
    if (response.success && response.data.records) {
      // 修复：使用正确的字段名构建数据
      parentChapterTree.value = response.data.records.map(chapter => ({
        chapterKey: chapter.chapterKey,  // 修改：使用驼峰命名
        name: chapter.name,
        level: chapter.level,
        children: [] // 简化处理，不构建复杂的树形结构
      }));
      console.log('构建的父章节树:', parentChapterTree.value);
    } else {
      console.log('获取父章节失败或无数据');
      parentChapterTree.value = [];
    }
  } catch (error) {
    console.error('获取父章节列表失败:', error);
    ElMessage.error('获取父章节列表失败');
    parentChapterTree.value = [];
  } finally {
    parentChaptersLoading.value = false;
  }
};

// 构建章节树形结构
const buildChapterTree = (allLevels) => {
  if (allLevels.length === 0) return [];
  
  const tree = [];
  const levelMap = new Map();
  
  // 按层级组织数据
  allLevels.forEach(({ level, chapters }) => {
    levelMap.set(level, chapters);
  });
  
  // 构建树形结构
  const buildLevel = (level) => {
    const chapters = levelMap.get(level) || [];
    return chapters.map(chapter => {
      const node = {
        chapter_key: chapter.chapter_key,
        name: chapter.name,
        level: chapter.level,
        children: level < allLevels.length ? buildLevel(level + 1) : []
      };
      return node;
    });
  };
  
  return buildLevel(1);
};

// 级联选择器变化处理
const onParentChapterChange = (value) => {
  console.log('级联选择器选择的值:', value);
  console.log('级联选择器原始事件:', arguments);
  
  // 直接设置到表单字段
  chapterForm.value.parentChapterKey = value || '';
  console.log('设置后的parentChapterKey:', chapterForm.value.parentChapterKey);
};

// 简化的获取父章节方法 - 直接获取指定层级
const fetchParentChaptersSimple = async (parentLevel) => {
  try {
    parentChaptersLoading.value = true;
    const params = {
      page_index: 1,
      page_size: 1000,
      level: parentLevel
    };
    
    const response = await getChapterList(params);
    if (response.success) {
      parentChapters.value = response.data.records || [];
    } else {
      ElMessage.error('获取父章节列表失败');
      parentChapters.value = [];
    }
  } catch (error) {
    console.error('获取父章节列表失败:', error);
    ElMessage.error('获取父章节列表失败');
    parentChapters.value = [];
  } finally {
    parentChaptersLoading.value = false;
  }
};

// 获取章节列表
const fetchChapters = async () => {
  try {
    console.log('开始获取章节列表...');
    
    // 构建查询参数
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      chapter_key: chapterSearchKeyword.value || '',
      name: chapterNameSearch.value || '',
      level: chapterLevelSearch.value || '',
      status: chapterStatusSearch.value || '',
      search_value: chapterSearchKeyword.value || ''
    };
    
    console.log('发送查询参数:', params);
    console.log('当前分页状态 - currentPage:', currentPage.value, 'pageSize:', pageSize.value);
    
    const response = await getChapterList(params);
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
      
      chapterList.value = result.records || [];
      totalCount.value = result.total || 0;
      
      console.log('设置章节列表:', chapterList.value);
      console.log('设置总记录数:', totalCount.value);
    } else {
      console.error('获取章节列表失败:', response.message);
      ElMessage.error('获取章节列表失败');
    }
  } catch (error) {
    console.error('获取章节列表出错:', error);
    ElMessage.error('获取章节列表出错');
  }
};

const editChapter = (row) => {
  isEditChapter.value = true;
  chapterForm.value = {
    id: row.id,
    chapterKey: row.chapterKey,
    name: row.name,
    level: row.level,
    sortOrder: row.sortOrder,
    parentChapterKey: row.parentChapterKey,
    description: row.description,
    uploadedBy: row.uploadedBy,
    status: row.status
  };
  
  // 编辑模式下也需要加载父章节列表
  if (row.level > 1) {
    // 使用简化的方法
    fetchParentChaptersSimple(row.level - 1);
  } else {
    parentChapterTree.value = [];
    parentChapterPath.value = [];
  }
  
  showChapterDialog.value = true;
};

const handleDeleteChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该章节吗？', '提示', { type: 'warning' });
    await deleteChapter(row.id);
    ElMessage.success('删除成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 通过章节（待审核 -> 启用）
const approveChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要通过该章节吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      chapterKey: row.chapterKey,
      name: row.name,
      level: row.level,
      sortOrder: row.sortOrder,
      parentChapterKey: row.parentChapterKey,
      description: row.description,
      uploadedBy: row.uploadedBy,
      status: 'ENABLED'
    };
    await updateChapter(updateData);
    ElMessage.success('通过成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过失败:', error);
      ElMessage.error('通过失败');
    }
  }
};

// 拒绝章节（待审核 -> 已拒绝）
const rejectChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该章节吗？', '提示', { type: 'warning' });
    const updateData = {
      id: row.id,
      name: row.name,
      level: row.level,
      sortOrder: row.sortOrder,
      parentChapterKey: row.parentChapterKey,
      description: row.description,
      uploadedBy: row.uploadedBy,
      status: 'REJECTED'
    };
    await updateChapter(updateData);
    ElMessage.success('拒绝成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error);
      ElMessage.error('拒绝失败');
    }
  }
};

// 禁用章节（启用 -> 禁用）
const disableChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用该章节吗？', '提示', { type: 'warning' });
    const updateData = {
      id: row.id,
      name: row.name,
      level: row.level,
      sortOrder: row.sortOrder,
      parentChapterKey: row.parentChapterKey,
      description: row.description,
      uploadedBy: row.uploadedBy,
      status: 'DISABLED'
    };
    await updateChapter(updateData);
    ElMessage.success('禁用成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用失败:', error);
      ElMessage.error('禁用失败');
    }
  }
};

// 启用章节（禁用 -> 启用）
const enableChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要启用该章节吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      name: row.name,
      level: row.level,
      sortOrder: row.sortOrder,
      parentChapterKey: row.parentChapterKey,
      description: row.description,
      uploadedBy: row.uploadedBy,
      status: 'ENABLED'
    };
    await updateChapter(updateData);
    ElMessage.success('启用成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启用失败:', error);
      ElMessage.error('启用失败');
    }
  }
};

// 重审核章节（已拒绝 -> 待审核）
const resubmitChapter = async (row) => {
  try {
    await ElMessageBox.confirm('确定要重新提交审核该章节吗？', '提示', { type: 'info' });
    const updateData = {
      id: row.id,
      name: row.name,
      level: row.level,
      sortOrder: row.sortOrder,
      parentChapterKey: row.parentChapterKey,
      description: row.description,
      uploadedBy: row.uploadedBy,
      status: 'PENDING'
    };
    await updateChapter(updateData);
    ElMessage.success('重新提交审核成功');
    fetchChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新提交审核失败:', error);
      ElMessage.error('重新提交审核失败');
    }
  }
};

// 修复：提交章节方法
const submitChapter = async () => {
  try {
    await chapterFormRef.value.validate();
    
    // 添加详细的调试日志
    console.log('=== 提交章节调试信息 ===');
    console.log('表单数据:', chapterForm.value);
    console.log('parentChapterKey值:', chapterForm.value.parentChapterKey);
    console.log('parentChapterPath值:', parentChapterPath.value);
    console.log('是否为编辑模式:', isEditChapter.value);
    
    if (isEditChapter.value) {
      // 编辑时确保包含ID，但不包含chapterKey
      const updateData = {
        id: chapterForm.value.id,
        name: chapterForm.value.name,
        level: chapterForm.value.level,
        sortOrder: chapterForm.value.sortOrder,
        parentChapterKey: chapterForm.value.parentChapterKey,
        description: chapterForm.value.description
      };
      console.log('更新章节数据:', updateData);
      await updateChapter(updateData);
      ElMessage.success('更新成功');
    } else {
      // 创建新章节时，添加 uploadedBy 字段
      const chapterData = {
        ...chapterForm.value,
        uploadedBy: localStorage.getItem('user_key')
      };
      // 创建时不需要ID字段
      delete chapterData.id;
      console.log('创建章节数据:', chapterData);
      console.log('parentChapterKey在创建数据中:', chapterData.parentChapterKey);
      await createChapter(chapterData);
      ElMessage.success('创建成功');
    }
    showChapterDialog.value = false;
    resetChapterForm();
    fetchChapters();
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败');
  }
};

const resetChapterForm = () => {
  chapterForm.value = {
    id: null, // 重置时ID为null
    chapterKey: '',
    name: '',
    level: 1,
    sortOrder: 0,
    parentChapterKey: '',
    description: ''
  };
  isEditChapter.value = false;
};

// 修复：打开新增章节对话框
const openCreateChapterDialog = () => {
  isEditChapter.value = false;
  chapterForm.value = {
    id: null,
    chapterKey: '',
    name: '',
    level: 1,
    sortOrder: 0,
    parentChapterKey: '',
    description: ''
  };
  parentChapterTree.value = [];
  parentChapterPath.value = [];
  showChapterDialog.value = true;
};

// 修复：打开编辑章节对话框
const openEditChapterDialog = (chapter) => {
  isEditChapter.value = true;
  chapterForm.value = {
    id: chapter.id,
    chapterKey: chapter.chapter_key,
    name: chapter.name,
    level: chapter.level,
    sortOrder: chapter.sort_order,
    parentChapterKey: chapter.parent_chapter_key || '',
    description: chapter.description || ''
  };
  
  console.log('编辑章节表单数据:', chapterForm.value);
  
  // 如果是编辑且层级大于1，需要获取父章节列表
  if (chapter.level > 1) {
    fetchParentChaptersForTree(chapter.level - 1);
  } else {
    parentChapterTree.value = [];
  }
  
  showChapterDialog.value = true;
};

// 弹窗关闭后重置，避免标题残留为"编辑"
const onChapterDialogClosed = () => {
  resetChapterForm();
};

// 刷新章节列表
const refreshChapters = () => {
  fetchChapters();
};

// 分页相关方法
const handleSizeChange = (val) => {
  console.log('handleSizeChange 被调用，新的 pageSize:', val);
  pageSize.value = val;
  currentPage.value = 1; // 当每页显示条数改变时，重置当前页为1
  console.log('准备获取数据，pageSize:', pageSize.value, 'currentPage:', currentPage.value);
  fetchChapters();
};

const handleCurrentChange = (val) => {
  console.log('handleCurrentChange 被调用，新的 currentPage:', val);
  currentPage.value = val;
  console.log('准备获取数据，pageSize:', pageSize.value, 'currentPage:', currentPage.value);
  fetchChapters();
};

// 监听筛选条件变化，自动重新获取数据
watch([chapterSearchKeyword, chapterNameSearch, chapterLevelSearch, chapterStatusSearch], () => {
  currentPage.value = 1; // 重置到第一页
  fetchChapters();
});

// 组件挂载时加载数据
onMounted(() => {
  fetchChapters();
});
</script>

<style scoped>
.chapter-management-standalone {
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

<style>
/* 全局样式，确保下拉框显示在弹窗之上 */
.chapter-level-select {
  z-index: 3001 !important;
}

.chapter-parent-select {
  z-index: 3001 !important;
}

/* 修复父章节下拉框选项变蓝的问题 */
.chapter-parent-select .el-option {
  color: #606266 !important;
}

.chapter-parent-select .el-option:hover {
  background-color: #f5f7fa !important;
  color: #606266 !important;
}

.chapter-parent-select .el-option.selected {
  color: #409eff !important;
  font-weight: normal !important;
}

.chapter-parent-select .el-option.is-selected {
  color: #409eff !important;
  font-weight: normal !important;
}

/* 确保所有下拉框都在弹窗之上 */
.el-select-dropdown {
  z-index: 3001 !important;
}

.el-popper {
  z-index: 3001 !important;
}
</style>
