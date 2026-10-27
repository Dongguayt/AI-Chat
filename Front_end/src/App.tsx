import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, theme, message, Avatar } from 'antd';
import { PlusOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Bubble, Sender } from '@ant-design/x';

const { Sider, Content } = Layout;

// 定义消息格式
type MsgType = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const App: React.FC = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [input, setInput] = useState('');

  // 聊天记录状态
  const [messages, setMessages] = useState<MsgType[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的AI助手。' },
  ]);
  // 是否正在加载（打字中）
  const [loading, setLoading] = useState(false);

  // 滚动到底部的引用
  const scrollRef = useRef<HTMLDivElement>(null);

  // 消息更新时自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 核心：发送消息并读取流
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput('');

    // 1. 把用户消息加到列表
    const userMsg: MsgType = { id: Date.now().toString(), role: 'user', content: text };
    // 2. 准备一条空的 AI 消息占位
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: MsgType = { id: aiMsgId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setLoading(true);

    try {
      // 3. 发起 POST 请求，请求你的 FastAPI 假接口
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }) // 现在后端不校验，随便传
      });

      if (!response.body) throw new Error('没有响应体');

      // 4. 获取流的读取器
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      // 5. 循环读取流
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          // 解码文本
          const chunk = decoder.decode(value, { stream: true });

          // 按 SSE 格式分割
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                done = true;
                break;
              }
              // 6. 把收到的字，追加到刚才空占位的 AI 消息里
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
    }
  };

  return (
    <Layout style={{ height: '100vh', background: colorBgContainer }}>
      <Sider width={260} style={{ background: '#f9f9f9', borderRight: '1px solid #eee' }}>
        <div style={{ padding: '16px' }}>
          <Button type="primary" icon={<PlusOutlined />} block onClick={() => {
            setMessages([{
              id: Date.now().toString(), role: 'assistant', content: '你好！我是你的AI助手。'
            }]);
            setInput('');
          }}>
            新建对话
          </Button>
        </div>
        <div style={{ padding: '0 16px', color: '#666' }}>
          <div style={{ padding: '10px', background: '#e6f4ff', borderRadius: '8px' }}>历史会话 1</div>
        </div>
      </Sider>

      <Layout>
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
                    style={{
                      backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a'
                    }}
                  />
                ),
                placement: msg.role === 'user' ? 'end' : 'start',
                loading: loading && msg.id === messages[messages.length - 1].id && msg.content === '' // 最后一条 AI 消息显示加载中
              }))}
            />
          </div>

          {/* 输入区 */}
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