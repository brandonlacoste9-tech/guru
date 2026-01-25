
import React from 'react';

const actionBlocks = [
    {
        type: 'navigate',
        label: 'Navigate',
        icon: '🌐',
        color: '#3B82F6',
        description: 'Go to a specific URL'
    },
    {
        type: 'click',
        label: 'Click Element',
        icon: '👆',
        color: '#8B5CF6',
        description: 'Click on buttons, links, or elements'
    },
    {
        type: 'fill',
        label: 'Fill Form',
        icon: '📝',
        color: '#F59E0B',
        description: 'Enter text into input fields'
    },
    {
        type: 'extract',
        label: 'Extract Data',
        icon: '📊',
        color: '#EF4444',
        description: 'Scrape information from pages'
    },
    {
        type: 'wait',
        label: 'Wait/Pause',
        icon: '⏱️',
        color: '#6B7280',
        description: 'Add delays between actions'
    },
    {
        type: 'skill',
        label: 'AI Skill',
        icon: '⚡',
        color: '#EC4899',
        description: 'Run Antigravity skills'
    }
];

export const NodeLibrary: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="node-library">
            <h3 className="library-title">Action Blocks</h3>
            <div className="library-items">
                {actionBlocks.map((block) => (
                    <div
                        key={block.type}
                        className="library-item"
                        draggable
                        onDragStart={(event) => onDragStart(event, block.type)}
                    >
                        <div className="item-icon" style={{ backgroundColor: block.color }}>
                            {block.icon}
                        </div>
                        <div className="item-content">
                            <div className="item-label">{block.label}</div>
                            <div className="item-description">{block.description}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="library-section">
                <h4 className="section-title" style={{ marginTop: '16px', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>Guru Blocks</h4>
                <div className="library-item">
                    <div className="item-icon" style={{ backgroundColor: '#10B981' }}>
                        🤖
                    </div>
                    <div className="item-content">
                        <div className="item-label">Existing Guru</div>
                        <div className="item-description">Use another Guru as a step</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
