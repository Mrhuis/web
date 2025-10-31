<template>
  <div class="item-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="itemSearchKeyword" 
          placeholder="搜索习题" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-select v-model="itemStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
        <el-select v-model="selectedItemType" placeholder="习题类型" clearable style="width: 150px; margin-right: 16px;">
          <el-option
            v-for="itemType in availableItemTypes"
            :key="itemType.formKey"
            :label="`${itemType.formName} (${itemType.formKey})`"
            :value="itemType.formKey"
          />
        </el-select>
        <el-select 
          v-model="itemChapterSearch" 
          placeholder="章节筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="chapter in availableChapters"
            :key="chapter.chapterKey"
            :label="`${chapter.name} (${chapter.chapterKey})`"
            :value="chapter.chapterKey"
          />
        </el-select>
        <el-select 
          v-model="itemKnowledgeSearch" 
          placeholder="知识点筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="knowledge in availableKnowledge"
            :key="knowledge.knowledge_key"
            :label="`${knowledge.name} (${knowledge.knowledge_key})`"
            :value="knowledge.knowledge_key"
          />
        </el-select>
        <el-select 
          v-model="itemTagSearch"
          placeholder="标签筛选"
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="`${tag.tagContent} (${tag.id})`"
            :value="tag.id"
          />
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshItems" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateItemDialog">
          新增习题
        </el-button>
      </div>
    </div>

    <el-table :data="itemList" style="width: 100%" border>
      <!-- 基本字段 -->
      <el-table-column prop="itemKey" label="习题标识" width="150"></el-table-column>
      <el-table-column prop="pluginKey" label="插件标识" width="120"></el-table-column>
      <el-table-column prop="formKey" label="类型" width="100">
        <template #default="scope">
          <el-tag type="info">{{ getItemTypeText(scope.row.formKey) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="difficulty" label="难度" width="100">
        <template #default="scope">
          <el-tag :type="getDifficultyType(scope.row.difficulty)">
            {{ getDifficultyText(scope.row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="题干" min-width="300" show-overflow-tooltip></el-table-column>
      
      <el-table-column prop="uploadedBy" label="上传者" width="120"></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>

      <!-- 关联信息字段 -->
      <el-table-column label="章节" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.chapterKeyName" class="tag-container">
            <el-tag
              v-for="(name, key) in scope.row.chapterKeyName"
              :key="key"
              size="small"
              type="primary"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="知识点" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.knowledgeKeyName" class="tag-container">
            <el-tag
              v-for="(name, key) in scope.row.knowledgeKeyName" 
              :key="key" 
              size="small"
              type="success"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="标签" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.tagIdName" class="tag-container">
            <el-tag
              v-for="(name, id) in scope.row.tagIdName" 
              :key="id"
              size="small"
              type="warning"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <!-- 待审核状态：通过、拒绝 -->
          <template v-if="scope.row.status === 'PENDING'">
            <el-button type="success" size="small" @click="approveItem(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectItem(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、预览、禁用 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="editItem(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="showItemPreview(scope.row)" style="margin-right: 8px;">
              预览
            </el-button>
            <el-button type="warning" size="small" @click="disableItem(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableItem(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="deleteItem(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitItem(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="deleteItem(scope.row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="itemCurrentPage"
        :page-size="itemPageSize"
        :page-sizes="[5, 10, 20, 50, 100]"
        :total="itemTotalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleItemSizeChange"
        @current-change="handleItemCurrentChange"
      />
    </div>

    <!-- 题目预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="题目预览"
      width="800px"
      :z-index="3000"
      append-to-body
    >
      <div class="preview-container">
        <!-- 选择题预览 -->
        <ChoiceItemDisplay
          v-if="previewItem && previewItem.formKey === 'choice'"
          :item="previewItem"
          :question-number="1"
          :show-answer="true"
        />
        
        <!-- 判断题预览 -->
        <JudgeItemDisplay
          v-else-if="previewItem && previewItem.formKey === 'judge'"
          :item="formatItemForDisplay(previewItem)"
          :question-number="1"
          :show-answer="true"
        />
        
        <!-- 填空题预览 -->
        <BlankItemDisplay
          v-else-if="previewItem && previewItem.formKey === 'blank'"
          :item="formatItemForDisplay(previewItem)"
          :question-number="1"
          :show-answer="true"
        />
        
        <!-- 开放题预览 -->
        <OpenItemDisplay
          v-else-if="previewItem && (previewItem.formKey === 'qa' || previewItem.formKey === 'code' || previewItem.formKey === 'drawing')"
          :item="formatItemForDisplay(previewItem)"
          :question-number="1"
          :show-answer="true"
        />
        
        <!-- 不支持的类型 -->
        <div v-else class="unsupported-type">
          <el-alert
            title="暂不支持此类型题目的预览"
            type="warning"
            :closable="false"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 习题管理对话框 -->
    <el-dialog
      v-model="showItemDialog" 
      :title="isEditItem ? '编辑习题' : '新增习题'" 
      width="800px"
      @closed="onItemDialogClosed"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="itemForm" :rules="itemRules" ref="itemFormRef" label-width="100px">
        <el-form-item label="习题标识" prop="itemKey">
          <el-input v-model="itemForm.itemKey" placeholder="请输入习题标识"></el-input>
        </el-form-item>
        <el-form-item label="习题类型" prop="formKey">
          <el-select v-model="itemForm.formKey" placeholder="选择习题类型" style="width: 100%">
            <el-option
              v-for="itemType in availableItemTypes"
              :key="itemType.formKey"
              :label="`${itemType.formName} (${itemType.formKey})`"
              :value="itemType.formKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="itemForm.difficulty" placeholder="选择难度" style="width: 100%">
            <el-option label="入门" :value="1"></el-option>
            <el-option label="基础" :value="2"></el-option>
            <el-option label="中等" :value="3"></el-option>
            <el-option label="困难" :value="4"></el-option>
            <el-option label="专家" :value="5"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="content">
          <RichTextEditor
            :value="itemForm.content"
            @input="(value) => { if (typeof value === 'string') itemForm.content = value }"
            @change="(value) => { if (typeof value === 'string') itemForm.content = value }"
            field-name="题干"
            :height="'150px'"
            placeholder="请输入题干内容，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="选项" prop="options" v-if="itemForm.formKey === 'choice'">
          <RichTextEditor
            :value="itemForm.options"
            @input="(value) => { if (typeof value === 'string') itemForm.options = value }"
            @change="(value) => { if (typeof value === 'string') itemForm.options = value }"
            field-name="选项"
            :height="'120px'"
            placeholder="请输入选项内容，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="答案" prop="answer">
          <RichTextEditor
            :value="itemForm.answer"
            @input="(value) => { if (typeof value === 'string') itemForm.answer = value }"
            @change="(value) => { if (typeof value === 'string') itemForm.answer = value }"
            field-name="答案"
            :height="'120px'"
            placeholder="请输入参考答案，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="解析" prop="solution">
          <RichTextEditor
            :value="itemForm.solution"
            @input="(value) => { if (typeof value === 'string') itemForm.solution = value }"
            @change="(value) => { if (typeof value === 'string') itemForm.solution = value }"
            field-name="解析"
            :height="'120px'"
            placeholder="请输入详细解析，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="关联章节">
          <el-select
            v-model="itemForm.chapterKey"
            multiple 
            filterable
            placeholder="选择关联章节（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="chapter in availableChapters"
              :key="chapter.chapterKey"
              :label="`${chapter.name} (${chapter.chapterKey})`"
              :value="chapter.chapterKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联知识点">
          <el-select
            v-model="itemForm.knowledgeKey"
            multiple 
            filterable
            placeholder="选择关联知识点（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="knowledge in availableKnowledge"
              :key="knowledge.knowledge_key"
              :label="`${knowledge.name} (${knowledge.knowledge_key})`"
              :value="knowledge.knowledge_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联标签">
          <el-select
            v-model="itemForm.tagId"
            multiple
            filterable 
            placeholder="选择关联标签（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.tagContent} (${tag.id})`"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showItemDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitItem">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import {
  getItemList,
  createItem, 
  updateItem,
  updateItemStatus,
  deleteItem as deleteItemApi,
  getChapterList,
  getKnowledgeListForVideo,
  getTagList,
  uploadImage,
  getResourceFormList
} from "@/api/admin/admin_resource_manage_api.js";

// 导入题目显示组件
import ChoiceItemDisplay from "./item_components/ChoiceItemDisplay.vue";
import JudgeItemDisplay from "./item_components/JudgeItemDisplay.vue";
import BlankItemDisplay from "./item_components/BlankItemDisplay.vue";
import OpenItemDisplay from "./item_components/OpenItemDisplay.vue";
import RichTextEditor from './item_components/RichTextEditor.vue';
import { convertImagePaths, convertToRelativePaths } from '@/utils/imageUtils';

// 习题数据
const itemList = ref([]);
const showItemDialog = ref(false);
const isEditItem = ref(false);
const itemFormRef = ref(null);

// 预览相关
const showPreviewDialog = ref(false);
const previewItem = ref(null);

// 习题搜索筛选
const itemSearchKeyword = ref("");
const itemStatusSearch = ref("");
const selectedItemType = ref("");
const itemChapterSearch = ref([]);
const itemKnowledgeSearch = ref([]);
const itemTagSearch = ref([]);

// 习题表单
const itemForm = ref({
  id: null,
  itemKey: "",
  formKey: "choice",
  difficulty: 1,
  content: "",
  options: "",
  answer: "",
  solution: "",
  chapterKey: [],
  knowledgeKey: [],
  tagId: []
});

// 习题分页相关
const itemCurrentPage = ref(1);
const itemPageSize = ref(10);
const itemTotalCount = ref(0);

// 关联数据
const availableChapters = ref([]);
const availableKnowledge = ref([]);
const availableTags = ref([]);
const availableItemTypes = ref([]);

// 习题表单验证规则
const itemRules = {
  itemKey: [{ required: true, message: "请输入习题标识", trigger: "blur" }],
  formKey: [{ required: true, message: "请选择习题类型", trigger: "change" }],
  difficulty: [{ required: true, message: "请选择难度", trigger: "change" }],
  content: [
    { 
      required: true, 
      message: "请输入题干内容", 
      trigger: "change",
      validator: (rule, value, callback) => {
        console.log('验证题干:', value, '长度:', value ? value.length : 0);
        if (!value || value.trim() === '') {
          callback(new Error('请输入题干内容'));
        } else {
          callback();
        }
      }
    }
  ],
  answer: [
    { 
      required: true, 
      message: "请输入答案", 
      trigger: "change",
      validator: (rule, value, callback) => {
        console.log('验证答案:', value, '长度:', value ? value.length : 0);
        if (!value || value.trim() === '') {
          callback(new Error('请输入答案'));
        } else {
          callback();
        }
      }
    }
  ]
};

// 显示题目预览
const showItemPreview = (item) => {
  previewItem.value = item;
  showPreviewDialog.value = true;
};

// 格式化题目数据用于显示组件
const formatItemForDisplay = (item) => {
  const formattedItem = {
    content: item.content,
    solution: item.solution,
    answer: item.answer,
    options: item.options
  };

  // 根据题目类型处理不同的数据格式
  switch (item.formKey) {
    case 'choice':
      // 选择题数据直接传递，由组件内部解析 JSON 格式的选项
      break;

    case 'judge':
      // 处理判断题答案
      formattedItem.answer = item.answer === 'true' || item.answer === true;
      break;

    case 'blank':
      // 处理填空题答案
      try {
        if (typeof item.answer === 'string') {
          formattedItem.answer = JSON.parse(item.answer);
        } else {
          formattedItem.answer = Array.isArray(item.answer) ? item.answer : [item.answer];
        }
      } catch (error) {
        console.error('解析填空题数据失败:', error);
        formattedItem.answer = [item.answer];
      }
      break;

    case 'qa':
    case 'code':
    case 'drawing':
      // 处理开放题答案
      formattedItem.answer = item.answer;
      break;

    default:
      console.warn('未知的题目类型:', item.formKey);
      break;
  }

  return formattedItem;
};

// 获取习题列表
const fetchItems = async () => {
  try {
    console.log("fetchItems方法被调用，开始获取习题列表...");

    const params = {
      page_index: itemCurrentPage.value,  // 改为 page_index
      page_size: itemPageSize.value,     // 改为 page_size
      status: itemStatusSearch.value || "",
      content: itemSearchKeyword.value || "",
      formKey: selectedItemType.value || ""
    };

    // 添加章节筛选参数
    if (itemChapterSearch.value && itemChapterSearch.value.length > 0) {
      params.chapter_key = itemChapterSearch.value;
    }

    // 添加知识点筛选参数
    if (itemKnowledgeSearch.value && itemKnowledgeSearch.value.length > 0) {
      params.knowledge_key = itemKnowledgeSearch.value;
    }

    // 添加标签筛选参数
    if (itemTagSearch.value && itemTagSearch.value.length > 0) {
      params.tagId = itemTagSearch.value;
    }

    console.log("发送习题查询参数:", params);

    const response = await getItemList(params);
    console.log("收到习题响应:", response);

    if (response.success) {
      const result = response.data;
      itemList.value = result.records || [];
      itemTotalCount.value = result.total || 0;

      console.log("设置习题列表:", itemList.value);
      console.log("设置习题总记录数:", itemTotalCount.value);
    } else {
      console.error("获取习题列表失败:", response.message);
      ElMessage.error(response.message || "获取习题列表失败");
    }
  } catch (error) {
    console.error("获取习题列表异常:", error);
    ElMessage.error("获取习题列表失败");
  }
};

// 获取关联数据
const fetchRelatedData = async () => {
  try {
    // 获取章节列表
    const chapterResponse = await getChapterList({ page_index: 1, page_size: 1000, status: "ENABLED" });
    if (chapterResponse.success) {
      availableChapters.value = chapterResponse.data.records || [];
    }

    // 获取知识点列表
    const knowledgeResponse = await getKnowledgeListForVideo({ page_index: 1, page_size: 1000, status: "ENABLED" });
    if (knowledgeResponse.success) {
      availableKnowledge.value = knowledgeResponse.data.records || [];
    }

    // 获取标签列表
    const tagResponse = await getTagList({ page_index: 1, page_size: 1000 });
    if (tagResponse.success) {
      availableTags.value = tagResponse.data.records || [];
    }

    // 获取习题类型列表
    const itemTypeResponse = await getResourceFormList({ 
      page_index: 1, 
      page_size: 1000, 
      formType: "item" 
    });
    if (itemTypeResponse.success) {
      availableItemTypes.value = itemTypeResponse.data.records || [];
    }
  } catch (error) {
    console.error("获取关联数据失败:", error);
  }
};

// 工具函数
const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss");
};

const getItemTypeText = (type) => {
  // 首先尝试从动态数据中查找
  const itemType = availableItemTypes.value.find(item => item.formKey === type);
  if (itemType) {
    return itemType.formName;
  }
  
  // 如果没找到，使用默认映射
  const types = {
    choice: "选择题",
    judge: "判断题",
    blank: "填空题",
    code: "编程题",
    qa: "问答题",
    drawing: "画图题"
  };
  return types[type] || type;
};

const getDifficultyType = (difficulty) => {
  const types = ["", "success", "info", "warning", "danger", "danger"];
  return types[difficulty] || "info";
};

const getDifficultyText = (difficulty) => {
  const texts = ["", "入门", "基础", "中等", "困难", "专家"];
  return texts[difficulty] || "未知";
};

// 状态相关工具函数
const getStatusType = (status) => {
  const statusTypes = {
    'PENDING': 'warning',
    'ENABLED': 'success', 
    'DISABLED': 'info',
    'REJECTED': 'danger'
  };
  return statusTypes[status] || 'info';
};

const getStatusText = (status) => {
  const statusTexts = {
    'PENDING': '待审核',
    'ENABLED': '已启用',
    'DISABLED': '已禁用', 
    'REJECTED': '已拒绝'
  };
  return statusTexts[status] || status;
};

const canEdit = (status) => {
  // 所有状态都可以编辑
  return true;
};

const canDelete = (status) => {
  // 所有状态都可以删除
  return true;
};

const canEnable = (status) => {
  // 只有待审核和禁用状态可以启用
  return status === 'PENDING' || status === 'DISABLED';
};

const canDisable = (status) => {
  // 只有启用状态可以禁用
  return status === 'ENABLED';
};

const canReject = (status) => {
  // 只有待审核状态可以拒绝
  return status === 'PENDING';
};

const canApprove = (status) => {
  // 只有待审核状态可以审核通过
  return status === 'PENDING';
};

// 习题操作
const onItemDialogClosed = () => {
  resetItemForm();
};

const editItem = (row) => {
  isEditItem.value = true;

  console.log("编辑习题 - 原始数据:", JSON.stringify(row, null, 2));

  // 处理关联数据的默认值
  let chapterKeys = [];
  let knowledgeKeys = [];
  let tagIds = [];

  // 处理章节关联数据
  if (row.chapterKeyName && typeof row.chapterKeyName === "object") {
    chapterKeys = Object.keys(row.chapterKeyName);
  }

  // 处理知识点关联数据
  if (row.knowledgeKeyName && typeof row.knowledgeKeyName === "object") {
    knowledgeKeys = Object.keys(row.knowledgeKeyName);
  }

  // 处理标签关联数据
  if (row.tagIdName && typeof row.tagIdName === "object") {
    tagIds = Object.keys(row.tagIdName).map(id => parseInt(id));
  }

  // 处理选项内容，如果是JSON格式则解析后转换图片路径
  let processedOptions = row.options || "";
  if (processedOptions && processedOptions.trim() !== '') {
    try {
      // 尝试解析为JSON数组
      const optionsArray = JSON.parse(processedOptions);
      if (Array.isArray(optionsArray)) {
        // 对每个选项转换图片路径
        const processedOptionsArray = optionsArray.map(option => convertImagePaths(option));
        processedOptions = JSON.stringify(processedOptionsArray);
      } else {
        // 如果不是数组，直接转换图片路径
        processedOptions = convertImagePaths(processedOptions);
      }
    } catch (e) {
      // 如果不是JSON格式，直接转换图片路径
      processedOptions = convertImagePaths(processedOptions);
    }
  }

  itemForm.value = {
    id: row.id,
    itemKey: row.itemKey,
    formKey: row.formKey,
    difficulty: row.difficulty,
    content: convertImagePaths(row.content), // 编辑时转换为完整URL用于显示
    options: processedOptions,
    answer: convertImagePaths(row.answer), // 编辑时转换为完整URL用于显示
    solution: convertImagePaths(row.solution || ""), // 编辑时转换为完整URL用于显示
    chapterKey: chapterKeys,
    knowledgeKey: knowledgeKeys,
    tagId: tagIds
  };

  showItemDialog.value = true;
};

const deleteItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该习题吗？", "提示", { type: "warning" });
    await deleteItemApi(row.id);
    ElMessage.success("删除成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 审核通过习题
const approveItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要审核通过该习题吗？", "提示", { type: "info" });
    await updateItemStatus({ id: row.id, status: "ENABLED" });
    ElMessage.success("审核通过成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("审核通过失败:", error);
      ElMessage.error("审核通过失败");
    }
  }
};

// 拒绝习题
const rejectItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要拒绝该习题吗？", "提示", { type: "warning" });
    await updateItemStatus({ id: row.id, status: "REJECTED" });
    ElMessage.success("拒绝成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("拒绝失败:", error);
      ElMessage.error("拒绝失败");
    }
  }
};

// 启用习题
const enableItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要启用该习题吗？", "提示", { type: "info" });
    await updateItemStatus({ id: row.id, status: "ENABLED" });
    ElMessage.success("启用成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("启用失败:", error);
      ElMessage.error("启用失败");
    }
  }
};

// 禁用习题
const disableItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要禁用该习题吗？", "提示", { type: "warning" });
    await updateItemStatus({ id: row.id, status: "DISABLED" });
    ElMessage.success("禁用成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("禁用失败:", error);
      ElMessage.error("禁用失败");
    }
  }
};

// 在submitItem方法中，添加内容处理逻辑
const submitItem = async () => {
  try {
    console.log('=== 验证前表单数据 ===')
    console.log('题干(content):', itemForm.value.content)
    console.log('答案(answer):', itemForm.value.answer)
    console.log('选项(options):', itemForm.value.options)
    console.log('解析(solution):', itemForm.value.solution)
    console.log('题干长度:', itemForm.value.content ? itemForm.value.content.length : 0)
    console.log('答案长度:', itemForm.value.answer ? itemForm.value.answer.length : 0)
    
    // 手动检查必填字段
    const validationErrors = [];
    
    if (!itemForm.value.content || itemForm.value.content.trim() === '') {
      validationErrors.push({
        field: 'content',
        message: '请输入题干内容',
        fieldValue: itemForm.value.content
      });
    }
    
    if (!itemForm.value.answer || itemForm.value.answer.trim() === '') {
      validationErrors.push({
        field: 'answer', 
        message: '请输入答案',
        fieldValue: itemForm.value.answer
      });
    }
    
    if (validationErrors.length > 0) {
      console.error('手动验证失败:', validationErrors);
      throw validationErrors;
    }
    
    // 如果手动验证通过，跳过Element UI的验证
    // await itemFormRef.value.validate();
    
    // 处理富文本内容，确保markdown格式正确
    const formData = {
      ...itemForm.value,
      content: processMarkdownContent(itemForm.value.content),
      answer: processMarkdownContent(itemForm.value.answer),
      solution: processMarkdownContent(itemForm.value.solution),
      // 确保关联数据字段被保留，并确保tagId是数字数组
      chapterKey: itemForm.value.chapterKey || [],
      knowledgeKey: itemForm.value.knowledgeKey || [],
      tagId: (itemForm.value.tagId || []).map(id => typeof id === 'string' ? parseInt(id) : id)
    };

    // 处理选项字段 - 只有选择题才需要options字段
    if (itemForm.value.formKey === 'choice') {
      formData.options = processOptionsForChoice(itemForm.value.options);
    } else {
      // 对于判断题和其他类型，不发送options字段或发送null
      formData.options = null;
    }

    // 转换字段名为后端期望的格式
    if (formData.chapterKey) {
      formData.chapter_key = formData.chapterKey;
      delete formData.chapterKey;
    }

    if (formData.knowledgeKey) {
      formData.knowledge_key = formData.knowledgeKey;
      delete formData.knowledgeKey;
    }

    // tagId 字段名已经匹配，不需要转换

    // 如果是新增模式，确保不包含 id 字段
    if (!isEditItem.value) {
      delete formData.id;
    }

    console.log('=== 处理后的数据 ===')
    console.log('题干(content):', formData.content)
    console.log('答案(answer):', formData.answer)
    console.log('选项(options):', formData.options)
    console.log('解析(solution):', formData.solution)
    console.log('标签(tagId):', formData.tagId)
    console.log('章节(chapter_key):', formData.chapter_key)
    console.log('知识点(knowledge_key):', formData.knowledge_key)

    if (isEditItem.value) {
      formData.id = itemForm.value.id;
      // 编辑时不发送uploadedBy字段
      delete formData.uploadedBy;
      await updateItem(formData);
      ElMessage.success("更新成功");
    } else {
      // 创建时保留uploadedBy字段
      formData.uploadedBy = localStorage.getItem("user_key") || "";
      await createItem(formData);
      ElMessage.success("创建成功");
    }

    showItemDialog.value = false;
    resetItemForm();
    fetchItems();
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败");
  }
};

// 添加内容处理方法
const processMarkdownContent = (content) => {
  if (!content) return '';
  
  // 确保图片链接格式正确
  let processedContent = content
    .replace(/<img[^>]+src="([^"]+)"[^>]*>/g, '![图片]($1)') // 将img标签转换为markdown
    .replace(/<br\s*\/?>/g, '\n') // 将br标签转换为换行
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n') // 移除p标签但保留内容
    .replace(/<div[^>]*>(.*?)<\/div>/g, '$1\n') // 移除div标签但保留内容
    .replace(/\n+/g, '\n') // 合并多个换行
    .trim();
  
  // 将图片路径转换为相对路径（去掉端口号）
  processedContent = convertToRelativePaths(processedContent);
  
  return processedContent;
};

// 处理选择题选项，确保返回有效的JSON格式
const processOptionsForChoice = (options) => {
  if (!options || options.trim() === '') {
    return '[]'; // 返回空的JSON数组
  }
  
  // 处理富文本内容
  const processedOptions = processMarkdownContent(options);
  
  // 如果处理后的内容为空，返回空数组
  if (!processedOptions || processedOptions.trim() === '') {
    return '[]';
  }
  
  // 尝试解析是否为有效的JSON
  try {
    JSON.parse(processedOptions);
    return processedOptions; // 如果已经是有效JSON，直接返回
  } catch (e) {
    // 如果不是JSON格式，将内容包装成JSON数组
    // 按行分割选项，每个选项作为一个数组元素
    const optionLines = processedOptions.split('\n').filter(line => line.trim() !== '');
    return JSON.stringify(optionLines);
  }
};

const resetItemForm = () => {
  itemForm.value = {
    id: null,
    itemKey: "",
    formKey: "choice",
    difficulty: 1,
    content: "",
    options: "",
    answer: "",
    solution: "",
    uploadedBy: "",
    chapterKey: [],
    knowledgeKey: [],
    tagId: []
  };
  isEditItem.value = false;
};

// 打开新增习题弹窗
const openCreateItemDialog = () => {
  isEditItem.value = false;
  resetItemForm();
  itemForm.value.uploadedBy = localStorage.getItem("user_key") || "";
  showItemDialog.value = true;
};

// 刷新习题列表
const refreshItems = () => {
  fetchItems();
};

// 重新提交审核
const resubmitItem = async (row) => {
  try {
    await ElMessageBox.confirm("确定要重新提交该习题进行审核吗？", "提示", { type: "info" });
    await updateItemStatus({ id: row.id, status: "PENDING" });
    ElMessage.success("重新提交成功");
    fetchItems();
  } catch (error) {
    if (error !== "cancel") {
      console.error("重新提交失败:", error);
      ElMessage.error("重新提交失败");
    }
  }
};

// 习题分页相关方法
const handleItemSizeChange = (val) => {
  itemPageSize.value = val;
  itemCurrentPage.value = 1;
  fetchItems();
};

const handleItemCurrentChange = (val) => {
  itemCurrentPage.value = val;
  fetchItems();
};

// 监听习题筛选条件变化
watch([itemSearchKeyword, itemStatusSearch, selectedItemType, itemChapterSearch, itemKnowledgeSearch, itemTagSearch], () => {
  itemCurrentPage.value = 1;
  fetchItems();
});

// 组件挂载时加载数据
onMounted(() => {
  console.log("ItemManagement组件已挂载，开始加载数据...");
  fetchItems();
  fetchRelatedData();
});

// 暴露方法给父组件
defineExpose({
  fetchItems,
  fetchRelatedData
});

// 处理题干输入
const handleContentInput = (value) => {
  if (typeof value === 'string') {
    itemForm.value.content = value
  }
}

// 处理题干变化
const handleContentChange = (value) => {
  if (typeof value === 'string') {
    itemForm.value.content = value
  }
}
</script>

<style scoped>
.item-management {
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.preview-container {
  max-height: 600px;
  overflow-y: auto;
}

.unsupported-type {
  padding: 20px;
  text-align: center;
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

/* 标签容器样式 - 支持自动换行 */
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  min-height: 32px;
  padding: 4px 0;
}

.tag-item {
  margin: 0 !important;
  flex-shrink: 0;
  max-width: 100%;
  word-break: break-all;
}

/* 表格行高度自适应 */
:deep(.el-table__body tr) {
  height: auto !important;
}

:deep(.el-table__body td) {
  padding: 8px 0 !important;
  vertical-align: top;
}

/* 确保标签列有足够的最小高度 */
:deep(.el-table__body .el-table__cell) {
  min-height: 40px;
}
</style>
