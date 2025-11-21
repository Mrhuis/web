<template>
  <div class="algorithm-list">
    <el-card
      v-for="algorithm in algorithms"
      :key="algorithm.id"
      class="algorithm-item"
      shadow="hover"
      @click="$emit('select', algorithm)"
    >
      <div class="algorithm-card-content">
        <h3>{{ algorithm.name }}</h3>
        <p>{{ algorithm.description }}</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
defineProps({
  algorithms: {
    type: Array,
    required: true
  }
});

defineEmits(['select']);
</script>

<style scoped>
.algorithm-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.algorithm-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.algorithm-item:hover {
  border-color: #409eff;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.algorithm-card-content h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.algorithm-card-content p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .algorithm-list {
    grid-template-columns: 1fr;
  }
}
</style>

