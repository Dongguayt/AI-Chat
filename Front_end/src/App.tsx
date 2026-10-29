// src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Layout, theme, message, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Bubble, Sender } from '@ant-design/x';
import Sidebar from '@/components/Sidebar';
import { type MsgType, type Conversation } from '@/types';
import { getConversations, createConversation, getMessages } from '@/api/chat';

const { Content } = Layout;

const App: React.FC = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [input, setInput] = useState('');

  // 全局状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MsgType[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的AI助手。' },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 页面加载时拉取列表
  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. 消息更新时自动滚到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 获取左侧列表
  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      message.error('获取会话列表失败');
    }
  };

  // 点击左侧历史记录
  const handleSelectConv = async (id: number) => {
    setActiveConvId(id);
    try {
      const historyMsgs = await getMessages(id);
      setMessages(historyMsgs);
    } catch (error) {
      message.error('获取历史消息失败');
    }
  };

  // 新建对话
  const handleNewChat = async () => {
    try {
      const newConv = await createConversation();
      await fetchConversations(); // 刷新列表
      setActiveConvId(newConv.id);
      setMessages([{ id: Date.now().toString(), role: 'assistant', content: '你好！我是你的AI助手。' }]);
    } catch (error) {
      message.error('新建会话失败');
    }
  };

  // 核心发送消息
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!activeConvId) {
      message.warning('请先新建或选择一个会话！');
      return;
    }
    setInput('');

    const userMsg: MsgType = { id: Date.now().toString(), role: 'user', content: text };
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: MsgType = { id: aiMsgId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvId, // 👈 真实ID
          content: text                  // 👈 真实内容
        })
      });

      if (!response.body) throw new Error('没有响应体');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                done = true;
                break;
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, content: msg.content + data } : msg
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('请求失败', error);
      message.error('连接后端失败，请检查后端是否启动');
    } finally {
      setLoading(false);
      // 发完消息后，顺便刷新一下列表（如果是第一句话，后端可能会把标题改成第一句话）
      fetchConversations();
    }
  };

  return (
    <Layout style={{ height: '100vh', background: colorBgContainer }}>
      {/* 抽离出去的侧边栏 */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
      />

      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
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
                loading: loading && msg.id === messages[messages.length - 1].id && msg.content === ''
              }))}
            />
          </div>

          <div style={{ padding: '20px 0' }}>
            <Sender
              value={input}
              onChange={(val) => setInput(val)}
              onSubmit={handleSend}
              loading={loading}
              placeholder="给 AI 发送消息..."
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;