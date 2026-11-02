import React, { useState } from 'react';
import { Layout, Button, Dropdown, Modal, Input } from 'antd';
import { PlusOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { type Conversation } from '@/types';

const { Sider } = Layout;

interface SidebarProps {
    conversations: Conversation[];
    activeConvId: number | null;
    onSelect: (id: number) => void;
    onNew: () => void;
    onRename: (id: number, title: string) => void;
    onDelete: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations, activeConvId, onSelect, onNew, onRename, onDelete
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [renameId, setRenameId] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState('');

    const handleOpenRename = (id: number, title: string) => {
        setRenameId(id);
        setNewTitle(title);
        setIsModalOpen(true);
    };

    const handleConfirmRename = () => {
        if (renameId && newTitle.trim()) {
            onRename(renameId, newTitle); // 呼叫父组件去发请求
            setIsModalOpen(false);
        }
    };

    return (
        <Sider width={260} style={{ background: '#f9f9f9', borderRight: '1px solid #eee' }}>
            <div style={{ padding: '16px' }}>
                <Button type="primary" icon={<PlusOutlined />} block onClick={onNew}>
                    新建对话
                </Button>
            </div>

            <div style={{ padding: '0 16px', color: '#666', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        style={{
                            padding: '8px 10px',
                            background: activeConvId === conv.id ? '#e6f4ff' : 'transparent',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                        }}
                    >
                        <div
                            onClick={() => onSelect(conv.id)}
                            style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}
                        >
                            <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {conv.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                {dayjs(conv.update_time || conv.create_time).format('MM-DD HH:mm')}
                            </div>
                        </div>

                        <Dropdown menu={{
                            items: [
                                { key: 'rename', label: '重命名', onClick: () => handleOpenRename(conv.id, conv.title) },
                                {
                                    key: 'delete',
                                    label: '删除',
                                    danger: true,
                                    onClick: () => onDelete(conv.id) // 呼叫父组件去删除
                                },
                            ]
                        }}>
                            <MoreOutlined style={{ cursor: 'pointer', padding: '4px' }} />
                        </Dropdown>
                    </div>
                ))}
            </div>

            {/* 重命名弹窗 */}
            <Modal
                title="重命名会话"
                open={isModalOpen}
                onOk={handleConfirmRename}
                onCancel={() => setIsModalOpen(false)}
                okText="确认"
                cancelText="取消"
            >
                <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="请输入新的会话标题"
                />
            </Modal>
        </Sider>
    );
};

export default Sidebar;