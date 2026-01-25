
import React from 'react';

export const BuilderToolbar: React.FC<{
    onSave: () => void;
    onRun: () => void;
    onGenerate?: () => void;
    canSave: boolean;
}> = ({ onSave, onRun, onGenerate, canSave }) => {
    return (
        <div className="builder-toolbar">
            <div className="toolbar-group">
                <button
                    className="toolbar-button primary"
                    onClick={onSave}
                    disabled={!canSave}
                >
                    💾 Save Template
                </button>
                <button
                    className="toolbar-button secondary"
                    onClick={onRun}
                    disabled={!canSave}
                >
                    ▶️ Run Automation
                </button>
                {onGenerate && (
                    <button
                        className="toolbar-button magic"
                        onClick={onGenerate}
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
                    >
                        ✨ Magic Create
                    </button>
                )}
            </div>

            <div className="toolbar-group">
                <button className="toolbar-button">
                    📋 Copy JSON
                </button>
                <button className="toolbar-button">
                    📤 Export
                </button>
            </div>
        </div>
    );
};
