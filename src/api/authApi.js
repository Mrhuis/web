// web/src/api/authApi.js

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 调用后端登录接口
 * @param {string} username
 * @param {string} password
 * @returns {Promise<any>} 解析后的JSON数据
 */
export async function login(username, password) {
    console.log('=== API调用开始 ===');
    console.log('请求URL:', `${API_BASE_URL}/auth/login`);
    console.log('请求参数:', { username, password });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    console.log('=== 响应状态 ===');
    console.log('response.ok:', response.ok);
    console.log('response.status:', response.status);
    console.log('response.statusText:', response.statusText);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('用户名或密码错误');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('=== 原始响应文本 ===');
    console.log('responseText:', responseText);
    
    let userData;
    try {
        userData = JSON.parse(responseText);
        console.log('=== 解析后的JSON数据 ===');
        console.log('userData:', userData);
        console.log('userData.userKey:', userData.userKey);
        console.log('userData.id:', userData.id);
        console.log('userData.nickname:', userData.nickname);
        console.log('userData.role:', userData.role);
    } catch (error) {
        console.error('JSON解析失败:', error);
        throw new Error('响应数据格式错误');
    }
    
    return userData;
}
