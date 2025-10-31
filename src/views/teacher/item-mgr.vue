<template>
  <TeacherLayout>
    <div class="content-wrapper">
      <div class="type-panel">
        <el-radio-group v-model="typeFilter" size="small" style="display:flex;flex-direction:column;">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="choice">选择题</el-radio-button>
          <el-radio-button label="blank">填空题</el-radio-button>
          <el-radio-button label="code">编程题</el-radio-button>
        </el-radio-group>
      </div>
      <div class="table-panel">
        <el-table :data="filteredItems" style="width:100%;">
          <el-table-column prop="title" label="题目" width="200" />
          <el-table-column prop="type" label="题型" width="100" />
          <el-table-column prop="difficulty" label="难度" width="100">
            <template #default="scope">
              <el-rate v-model="scope.row.difficulty" :max="3" show-score></el-rate>
            </template>
          </el-table-column>
          <el-table-column prop="tags" label="标签" width="180">
            <template #default="scope">
              <el-tag v-for="tag in scope.row.tags.split(',')" :key="tag">{{ tag }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="import-panel">
          <el-upload drag action="#" :auto-upload="false" :show-file-list="true">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽 zip 文件（含 *.md + YAML）到此处，或点击上传</div>
          </el-upload>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import TeacherLayout from './TeacherLayout.vue';

const typeFilter = ref('all');
const items = ref([
  { title: '队列的基本操作', type: 'code', difficulty: 2, tags: '队列,基础' },
  { title: '栈的定义', type: 'choice', difficulty: 1, tags: '栈,基础' }
]);
const filteredItems = computed(() => {
  if(typeFilter.value==='all') return items.value;
  return items.value.filter(i => i.type===typeFilter.value);
});
</script>

<style scoped>
.content-wrapper { display: flex; }
.type-panel { width: 180px; margin-right: 24px; }
.table-panel { flex: 1; }
.import-panel { margin-top: 24px; }
</style>
