import React, { useRef, useEffect } from 'react';
import { Layout, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Bubble, Sender } from '@ant-design/x';
import { type MsgType } from '@/types';

const { Content } = Layout;

interface ChatAreaProps {
    messages: MsgType[];
    loading: boolean;
    input: string;
    onInputChange: (val: string) => void;
    onSend: (text: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
    messages, loading, input, onInputChange, onSend
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // 消息更新时自动滚动到底部
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Content style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            {/* 消息展示区 */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <Bubble.List
                    items={messages.map((msg) => ({
                        key: msg.id,
                        role: msg.role,
                        content: msg.content,
                        avatar: (
                            <Avatar
                                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                style={{ backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a' }}
                            />
                        ),
                        placement: msg.role === 'user' ? 'end' : 'start',
                        loading: loading && msg.id === messages[messages.length - 1]?.id && msg.content === ''
                    }))}
                />
            </div>

            {/* 输入区 */}
            <div style={{ padding: '20px 0' }}>
                <Sender
                    value={input}
                    onChange={onInputChange}
                    onSubmit={onSend}
                    loading={loading}
                    placeholder="给 AI 发送消息..."
                />
            </div>
        </Content>
    );
};

export default ChatArea;