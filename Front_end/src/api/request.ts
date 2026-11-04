import axios from 'axios';
import { message } from 'antd';

// 创建全局 axios 实例
const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        //拦截器：统一提取后端全局异常处理返回的 message
        const errorMsg = error.response?.data?.message || '网络异常，请稍后再试';
        message.error(errorMsg);

        return Promise.reject(error);
    }
);

export default request;