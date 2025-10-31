import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // api 的 base_url
  timeout: 5000, // 请求超时时间
});

// request 拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    if (userStore.id) { // 假设 userStore.id 存在表示已登录，实际可能用 token
      // config.headers['X-Token'] = getToken(); // 让每个请求携带 token
      // 这里可以根据实际的认证方式添加 token
    }
    return config;
  },
  error => {
    // Do something with request error
    console.log(error); // for debug
    Promise.reject(error);
  }
);

// response 拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 检查业务逻辑状态，而不是HTTP状态码
    if (res.success === false) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000,
      });

      // 50008:非法的token; 50012:其他客户端登录了;  50014:Token 过期了;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        ElMessageBox.confirm(
          '你已被登出，可以取消继续留在该页面，或者重新登录',
          '确定登出',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).then(() => {
          // userStore.fedLogOut().then(() => {
          //   location.reload(); // 为了重新实例化 vue-router 对象，避免 bug
          // });
        });
      }
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      // 直接返回响应数据，这样前端可以直接访问 response.data
      return res;
    }
  },
  error => {
    console.log('err' + error); // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  }
);

export default service;
