<template>
  <router-view></router-view>
</template>

<style>
/* 全局样式：确保页面支持浏览器缩放 */
html, body {
  min-width: 100%;
  min-height: 100%;
  overflow-x: auto;
  overflow-y: auto;
}

#app {
  min-width: 100%;
  min-height: 100%;
  overflow-x: auto;
  overflow-y: auto;
}

/* 确保所有容器在缩放时都能正常工作 */
* {
  box-sizing: border-box;
}

/* 防止某些组件阻止缩放 */
.el-container,
.el-main,
.el-aside {
  overflow-x: auto !important;
  overflow-y: auto !important;
}
</style>
