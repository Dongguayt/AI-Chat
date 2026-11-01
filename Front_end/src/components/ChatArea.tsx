import React, { useRef, useEffect } from 'react';
import { Layout, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Bubble, Sender } from '@ant-design/x';
import { type MsgType } from '@/types';
import ReactMarkdown from 'react-markdown';

//AI模型回复的渲染优化
import remarkGfm from 'remark-gfm';//用来支持表格、删除线等扩展语法
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';//加上面那个专门用来解析和渲染数学公式（LaTeX）
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css'; // 公式排版更好看

const { Content } = Layout;

interface ChatAreaProps {
    messages: MsgType[];
    loading: boolean;
    input: string;
    onInputChange: (val: string) => void;
    onSend: (text: string) => void;
    onStop: () => void;
}

//清洗函数
const formatMath = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\\\[/g, '$$$$') // 将 \[ 替换为 $$
        .replace(/\\\]/g, '$$$$') // 将 \] 替换为 $$
        .replace(/\\\(/g, '$')    // 将 \( 替换为 $
        .replace(/\\\)/g, '$');   // 将 \) 替换为 $
};

const ChatArea: React.FC<ChatAreaProps> = ({
    messages, loading, input, onInputChange, onSend, onStop
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
                        content: (//对于气泡内容进行优化
                            <div
                                className="markdown-body"
                                style={{
                                    textAlign: 'left',
                                    wordBreak: 'break-word',
                                    backgroundColor: 'transparent',
                                    fontSize: '14px',
                                    color: 'inherit'
                                }}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ borderCollapse: 'collapse', width: '100%' }} {...props} />
                                            </div>
                                        )
                                    }}
                                >
                                    {formatMath(msg.content)}
                                </ReactMarkdown>
                            </div>
                        ),
                        avatar: (
                            <Avatar
                                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                style={{ backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a' }}
                            />
                        ),
                        placement: msg.role === 'user' ? 'end' : 'start',
                        loading: loading && msg.id === messages[messages.length - 1]?.id && msg.content === ''
                    }))}
                    //样式覆盖 确保气泡内部对齐
                    styles={{
                        content: { textAlign: 'left' }
                    }}
                />
            </div>

            {/* 输入区 */}
            <div style={{ padding: '20px 0' }}>
                <Sender
                    value={input}
                    onChange={onInputChange}
                    onSubmit={onSend}
                    loading={loading}
                    onCancel={onStop}
                    placeholder="给 AI 发送消息..."
                />
            </div>
        </Content>
    );
};

export default ChatArea;