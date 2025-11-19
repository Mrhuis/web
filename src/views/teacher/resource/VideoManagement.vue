<template>
  <TeacherLayout>
    <el-card class="video-list">
      <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">视频/动画资源</div>
      <el-upload drag action="#" :auto-upload="false" :show-file-list="true">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">拖拽视频文件到此处，或点击上传（自动转码）</div>
      </el-upload>
      <el-table :data="mediaList" style="width:100%;margin-top:16px;">
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上传者" width="160">
          <template #default="scope">
            {{ scope.row.uploaded_by || scope.row.uploadedBy || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="knowledge" label="关联知识点" width="180">
          <template #default="scope">
            <el-select v-model="scope.row.knowledge" placeholder="选择知识点">
              <el-option v-for="k in knowledgeList" :key="k.id" :label="k.name" :value="k.name" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card>
      <div style="font-size:18px;font-weight:bold;margin-bottom:12px;">动画脚本 JSON 编辑</div>
      <el-input type="textarea" v-model="animJson" class="json-editor"></el-input>
      <el-button type="primary" style="margin-top:8px;" @click="saveJson">保存</el-button>
    </el-card>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import { ElTag } from 'element-plus';
import TeacherLayout from '../layout/TeacherLayout.vue';

const mediaList = ref([
  {
    name: '队列动画',
    type: 'anim',
    status: 'ENABLED',
    uploadedBy: 'A0001',
    createdAt: '2025-10-03 21:33:32',
    knowledge: ''
  },
  {
    name: '栈视频',
    type: 'video',
    status: 'DISABLED',
    uploadedBy: 'A0002',
    createdAt: '2025-10-05 10:15:20',
    knowledge: ''
  }
]);
const knowledgeList = ref([
  { id: 1, name: '队列' },
  { id: 2, name: '栈' }
]);
const animJson = ref(`{
  "frames": []
}`);
function saveJson() {
  alert('动画脚本已保存！');
}

function getStatusType(status) {
  if (status === 'ENABLED') return 'success';
  if (status === 'DISABLED') return 'info';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

function getStatusText(status) {
  if (status === 'ENABLED') return '启用';
  if (status === 'DISABLED') return '禁用';
  if (status === 'REJECTED') return '已拒绝';
  return '待审核';
}
</script>

<style scoped>
.video-list { margin-bottom: 32px; }
.json-editor { width: 100%; height: 180px; font-family: monospace; }
</style>
