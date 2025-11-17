<template>
  <TeacherLayout>
    <div class="message-center-container">
      <div class="page-header">
        <h1 class="page-title">消息中心</h1>
      </div>
      <div class="content">
        <el-empty description="消息中心功能开发中..." />
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import TeacherLayout from '../layout/TeacherLayout.vue';
</script>

<style scoped>
.message-center-container {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
  padding: 0 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

