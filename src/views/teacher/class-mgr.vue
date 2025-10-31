<template>
  <TeacherLayout>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="班级管理" name="class">
        <el-form inline>
          <el-form-item label="班级名称">
            <el-input v-model="newClassName"></el-input>
          </el-form-item>
          <el-button type="primary" @click="addClass">创建班级</el-button>
        </el-form>
        <el-table :data="classList" style="width:100%;margin-top:16px;">
          <el-table-column prop="name" label="班级" width="180" />
          <el-table-column prop="invite" label="邀请码" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeClass(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="班级学生" name="student">
        <el-table :data="studentList" style="width:100%;">
          <el-table-column prop="name" label="学生" width="180" />
          <el-table-column prop="class" label="班级" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" type="danger" @click="kickStudent(scope.$index)">踢出</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="自由学习者" name="free">
        <el-table :data="freeList" style="width:100%;">
          <el-table-column prop="name" label="学生" width="180" />
          <el-table-column prop="reason" label="申请理由" width="200" />
          <el-table-column prop="remark" label="备注" width="120">
            <template #default="scope">
              <el-input v-model="scope.row.remark" size="small"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button size="small" type="success" @click="approve(scope.$index)">同意</el-button>
              <el-button size="small" type="danger" @click="reject(scope.$index)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </TeacherLayout>
</template>

<script setup>
import { ref } from 'vue';
import TeacherLayout from './TeacherLayout.vue';

const activeTab = ref('class');
const newClassName = ref('');
const classList = ref([
  { name: 'A班', invite: 'INV123' },
  { name: 'B班', invite: 'INV456' }
]);
function addClass() {
  classList.value.push({ name: newClassName.value, invite: 'INV' + Math.floor(Math.random()*1000) });
  newClassName.value = '';
}
function removeClass(idx) { classList.value.splice(idx,1); }
const studentList = ref([
  { name: '学生A', class: 'A班' },
  { name: '学生B', class: 'B班' }
]);
function kickStudent(idx) { studentList.value.splice(idx,1); }
const freeList = ref([
  { name: '学生C', reason: '想旁听', remark: '' }
]);
function approve(idx) { freeList.value.splice(idx,1); }
function reject(idx) { freeList.value.splice(idx,1); }
</script>