import request from '@/api/request';
import { type Conversation, type MsgType } from '@/types';

// 1. 获取会话列表
export const getConversations = async () => {
    // 因为 request.ts 拦截器里 return 了 response.data，这里直接拿数据
    return await request.get<any, Conversation[]>('/conversations/');
};

// 2. 新建会话
export const createConversation = async () => {
    return await request.post<any, Conversation>('/conversations/', { title: '新对话' });
};

// 3. 获取历史消息
export const getMessages = async (conversationId: number) => {
    return await request.get<any, MsgType[]>(`/conversations/${conversationId}/messages`);
};

// 4.重命名
export const renameConversation = async (id: number, title: string) => {
    return await request.put(`/conversations/${id}`, { title });
};

// 5. 删除会话
export const deleteConversation = async (id: number) => {
    return await request.delete(`/conversations/${id}`);
};