export interface Conversation {
    id: number;
    title: string;
    create_time: string;
}

export interface MsgType {
    id: string | number;
    role: 'user' | 'assistant';
    content: string;
}