import React from 'react';
import { Layout, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { type Conversation } from '@/types/index';

const { Sider } = Layout;

interface SidebarProps {
    conversations: Conversation[];
    activeConvId: number | null;
    onSelect: (id: number) => void;
    onNew: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, activeConvId, onSelect, onNew }) => {
    return (
        <Sider width={260} style={{ background: '#f9f9f9', borderRight: '1px solid #eee' }}>
            <div style={{ padding: '16px' }}>
                <Button type="primary" icon={<PlusOutlined />} block onClick={onNew}>
                    新建对话
                </Button>
            </div>
            <div style={{ padding: '0 16px', color: '#666' }}>
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        style={{
                            padding: '10px',
                            background: activeConvId === conv.id ? '#e6f4ff' : 'transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '8px',
                        }}
                    >
                        {conv.title}
                    </div>
                ))}
            </div>
        </Sider>
    );
};

export default Sidebar;