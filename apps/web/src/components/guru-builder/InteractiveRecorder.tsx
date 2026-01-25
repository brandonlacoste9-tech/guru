
import React, { useState } from 'react';
import { Play, Square, Loader2, Save, Send } from 'lucide-react';

interface RecordedStep {
    type: string;
    payload: any;
    timestamp: string;
}

export const InteractiveRecorder: React.FC<{
    onSave: (steps: RecordedStep[]) => void;
    onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [command, setCommand] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [steps, setSteps] = useState<RecordedStep[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock starting a session
    const startSession = async () => {
        setIsLoading(true);
        setLogs(prev => [...prev, "🚀 Initializing Browser Session..."]);
        // Simulate API delay
        setTimeout(() => {
            setIsSessionActive(true);
            setIsLoading(false);
            setLogs(prev => [...prev, "✅ Browser Ready. Waiting for commands."]);
        }, 1500);
    };

    const executeCommand = async () => {
        if (!command.trim()) return;

        setIsLoading(true);
        const currentCmd = command;
        setCommand('');
        setLogs(prev => [...prev, `> ${currentCmd}`]);

        try {
            // Here we would call the /automation/execute_step endpoint
            // For now, we simulate execution and infer the step type
            await new Promise(r => setTimeout(r, 1000));

            // Simple inference logic
            let stepType = 'CUSTOM';
            let payload = {};

            if (currentCmd.toLowerCase().startsWith('navigate') || currentCmd.toLowerCase().includes('go to')) {
                stepType = 'NAVIGATE';
                payload = { url: currentCmd.split(' ').slice(1).join(' ') };
            } else if (currentCmd.toLowerCase().includes('click')) {
                stepType = 'CLICK';
                payload = { selector: 'button' }; // Placeholder
            } else if (currentCmd.toLowerCase().includes('type')) {
                stepType = 'FILL';
                payload = { selector: 'input', text: 'value' };
            }

            const newStep = {
                type: stepType,
                payload,
                timestamp: new Date().toISOString()
            };

            setSteps(prev => [...prev, newStep]);
            setLogs(prev => [...prev, `✅ Executed: ${stepType}`]);

        } catch (e) {
            setLogs(prev => [...prev, `❌ Error: Failed to execute`]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-[800px] h-[600px] rounded-2xl flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                        <h3 className="font-bold text-white">Interactive Teacher</h3>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white">Close</button>
                </div>

                {/* Console / Viewport */}
                <div className="flex-1 bg-black p-4 font-mono text-sm overflow-y-auto space-y-2">
                    {logs.map((log, i) => (
                        <div key={i} className={log.startsWith('>') ? 'text-cyan-400' : log.startsWith('✅') ? 'text-green-400' : 'text-slate-400'}>
                            {log}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    {!isSessionActive ? (
                        <button
                            onClick={startSession}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4" /> Start Recording Session
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-cyan-500 pr-10"
                                    placeholder="Type command (e.g. 'Go to google.com', 'Click Login')"
                                    value={command}
                                    onChange={e => setCommand(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && executeCommand()}
                                    autoFocus
                                />
                                <button
                                    onClick={executeCommand}
                                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-cyan-400"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => onSave(steps)}
                                className="px-6 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
