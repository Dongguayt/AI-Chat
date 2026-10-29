import axios from 'axios';
import { type Conversation } from '@/types/index';

const BASE_URL = 'http://127.0.0.1:8000/api';

// 1. 获取会话列表
export const getConversations = async () => {
    const res = await axios.get<Conversation[]>(`${BASE_URL}/conversations/`);
    return res.data;
};

// 2. 新建会话
export const createConversation = async (title: string = '新对话') => {
    const res = await axios.post<Conversation>(`${BASE_URL}/conversations/`, { title });
    return res.data;
};

// 3. 获取历史消息
export const getMessages = async (conversationId: number) => {
    const res = await axios.get(`${BASE_URL}/conversations/${conversationId}/messages`);
    return res.data;
};