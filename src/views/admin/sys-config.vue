<template>
  <AdminLayout>
    <el-table :data="configList" style="width:100%;">
      <el-table-column prop="k" label="配置项" width="200" />
      <el-table-column prop="v" label="值" width="300">
        <template #default="scope">
          <el-input v-model="scope.row.v" @change="onEdit(scope.$index)"></el-input>
        </template>
      </el-table-column>
    </el-table>
    <el-alert v-if="showAlert" title="配置已更新，系统将自动热刷新！" type="success" show-icon style="margin-top:16px;" />
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue';
import AdminLayout from './AdminLayout.vue';

const configList = ref([
  { k: 'recommend_algo', v: 'DeepFM' },
  { k: 'upload_max_size', v: '100MB' }
]);
const showAlert = ref(false);
function onEdit(idx) {
  showAlert.value = true;
  setTimeout(()=>{ showAlert.value = false; }, 2000);
}
</script>

<style scoped>
</style>
