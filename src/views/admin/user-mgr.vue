<template>
  <AdminLayout>
    <el-table :data="userList.slice((page-1)*pageSize,page*pageSize)" style="width:100%;">
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="scope">
          <el-select v-model="scope.row.role" @change="changeRole(scope.$index,scope.row.role)">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status==='enabled'" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button size="small" @click="toggleStatus(scope.$index)">{{ scope.row.status==='enabled'?'禁用':'启用' }}</el-button>
          <el-button size="small" @click="resetPwd(scope.$index)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="prev, pager, next"
      :total="userList.length"
      :page-size="pageSize"
      v-model:current-page="page"
      style="margin-top:16px;" />
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue';
import AdminLayout from './AdminLayout.vue';

const userList = ref([
  { username: 'student1', role: 'student', status: 'enabled' },
  { username: 'teacher1', role: 'teacher', status: 'enabled' },
  { username: 'admin1', role: 'admin', status: 'disabled' }
]);
const page = ref(1);
const pageSize = 10;
function changeRole(idx, role) { userList.value[idx].role = role; }
function toggleStatus(idx) { userList.value[idx].status = userList.value[idx].status==='enabled'?'disabled':'enabled'; }
function resetPwd(idx) { alert('密码已重置为123456'); }
</script>

<style scoped>
</style>
