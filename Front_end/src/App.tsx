import React, { useState, useEffect, useRef } from 'react';
import { Layout, message as antMessage } from 'antd';
import Sidebar from '@/components/Sidebar';//侧边栏
import ChatArea from '@/components/ChatArea';//聊天区域
import { type Conversation, type MsgType } from '@/types';
import { getConversations, createConversation, getMessages } from '@/api/chat';
import 'github-markdown-css/github-markdown.css';//样式库（表格 代码块）

const App: React.FC = () => {
  // === 状态管理（只管数据） ===
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MsgType[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的AI助手。' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // === 业务逻辑（调后端API） ===
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      antMessage.error('获取会话列表失败');
    }
  };

  const handleSelectConv = async (id: number) => {
    setActiveConvId(id);
    try {
      const historyMsgs = await getMessages(id);
      setMessages(historyMsgs);
    } catch (error) {
      antMessage.error('获取历史消息失败');
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation();
      await fetchConversations();
      setActiveConvId(newConv.id);
      setMessages([{ id: Date.now().toString(), role: 'assistant', content: '你好！我是你的AI助手。' }]);
    } catch (error) {
      antMessage.error('新建会话失败');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !activeConvId) return;
    setInput('');

    const userMsg: MsgType = { id: Date.now().toString(), role: 'user', content: text };
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: MsgType = { id: aiMsgId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setLoading(true);

    abortControllerRef.current = new AbortController();//每次发请求前，创建一个新的 AbortController

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvId, content: text }),
        signal: abortControllerRef.current.signal//把信号传递给fetch
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too Many Requests");
        }
        throw new Error("网络请求失败");
      }

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
    } catch (error: any) {
      console.error('请求失败', error);
      if (error.message === "Too Many Requests") {
        antMessage.warning('请求太频繁了，请 1 分钟后再试！');
      } else if (error.name === 'AbortError') {
        console.log('用户停止了生成');
      } else {
        antMessage.error('连接后端失败，请检查后端是否启动');
      }

      //把刚才乐观更新加进去的 userMsg 和空的 aiMsg 过滤掉
      setMessages((prev) => prev.filter((msg) => msg.id !== userMsg.id && msg.id !== aiMsgId));

    } finally {
      setLoading(false);
      abortControllerRef.current = null; // 清空
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  // === 渲染视图 ===
  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
      />

      {/* 把数据和事件通过 props 传给右侧聊天区 */}
      <ChatArea
        messages={messages}
        loading={loading}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={handleStop}
      />
    </Layout>
  );
};

export default App;