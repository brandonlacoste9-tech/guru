
import React from 'react';
import { Handle, Position } from 'reactflow';

export const AutomationNode = ({ data }: { data: any }) => {
    return (
        <div className={`automation-node ${data.isValid ? 'valid' : 'invalid'}`}>
            <Handle type="target" position={Position.Top} />

            <div className="node-content">
                <div className="node-header">
                    <span className="node-icon" style={{ color: data.color }}>
                        {data.icon}
                    </span>
                    <span className="node-label">{data.label}</span>
                </div>

                {data.description && (
                    <div className="node-description">{data.description}</div>
                )}

                {!data.isValid && (
                    <div className="node-warning">⚠️ Configuration required</div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};
