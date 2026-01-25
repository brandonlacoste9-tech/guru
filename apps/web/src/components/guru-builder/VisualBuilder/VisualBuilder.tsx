
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { NodeLibrary } from './NodeLibrary';
import { AutomationNode } from './AutomationNode';
import { BuilderToolbar } from './BuilderToolbar';
import { FlowNode, FlowEdge, AutomationTemplate, FlowNodeData } from './types';
import './VisualBuilder.css';

const nodeTypes = {
    automationNode: AutomationNode,
};

const initialNodes: FlowNode[] = [
    {
        id: '1',
        type: 'automationNode',
        position: { x: 250, y: 50 },
        data: {
            type: 'start', // Note: 'start' is not in the union type in types.ts but needed for initialization. Casting or updating types might be needed.
            label: 'Start',
            description: 'Beginning of automation',
            icon: '🏁',
            color: '#10B981',
            payload: {},
            isValid: true,
        } as any, // Cast to any to bypass strict union for now
    },
];

export const VisualBuilder: React.FC<{
    onSave?: (template: AutomationTemplate) => void;
    onRun?: (template: AutomationTemplate) => void;
    initialTemplate?: AutomationTemplate;
}> = ({ onSave, onRun, initialTemplate }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Load initial template if provided
    useEffect(() => {
        if (initialTemplate && initialTemplate.steps) {
            const loadedNodes: FlowNode[] = initialTemplate.steps.map((step, index) => ({
                id: step.id,
                type: 'automationNode',
                position: { x: 250, y: 150 + index * 100 },
                data: mapStepToNodeData(step),
            }));

            setNodes(loadedNodes);
        }
    }, [initialTemplate, setNodes]);

    const mapStepToNodeData = (step: any): FlowNodeData => {
        const nodeTypeMap: Record<string, Partial<FlowNodeData>> = {
            NAVIGATE: {
                type: 'navigate',
                label: 'Navigate',
                icon: '🌐',
                color: '#3B82F6',
                description: `Go to ${step.payload?.url || 'URL'}`,
            },
            CLICK: {
                type: 'click',
                label: 'Click',
                icon: '👆',
                color: '#8B5CF6',
                description: `Click ${step.payload?.selector || 'element'}`,
            },
            FILL: {
                type: 'fill',
                label: 'Fill Form',
                icon: '📝',
                color: '#F59E0B',
                description: `Fill ${step.payload?.selector || 'field'}`,
            },
            EXTRACT: {
                type: 'extract',
                label: 'Extract Data',
                icon: '📊',
                color: '#EF4444',
                description: `Extract ${step.payload?.selector || 'data'}`,
            },
            WAIT: {
                type: 'wait',
                label: 'Wait',
                icon: '⏱️',
                color: '#6B7280',
                description: `Wait ${step.payload?.timeout || 'seconds'} seconds`,
            },
            SKILL: {
                type: 'skill',
                label: 'Skill',
                icon: '⚡',
                color: '#EC4899',
                description: `Run ${step.payload?.skillName || 'skill'}`,
            },
        };

        return {
            type: (nodeTypeMap[step.type]?.type || 'custom') as FlowNodeData['type'],
            label: nodeTypeMap[step.type]?.label || step.type,
            icon: nodeTypeMap[step.type]?.icon || '⚙️',
            color: nodeTypeMap[step.type]?.color || '#6366F1',
            description: nodeTypeMap[step.type]?.description || '',
            payload: step.payload || {},
            isValid: true,
        };
    };

    const onConnect = useCallback(
        (params: Connection | Edge) => {
            const newEdge: Edge = {
                ...params,
                type: 'smoothstep',
                animated: true,
                id: `e${params.source}-${params.target}`,
            };
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance || !reactFlowWrapper.current) return;

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
                y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
            });

            const newNode: FlowNode = {
                id: uuidv4(),
                type: 'automationNode',
                position,
                data: getNodeDataFromType(type),
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const getNodeDataFromType = (type: string): FlowNodeData => {
        const nodeDefinitions: Record<string, FlowNodeData> = {
            navigate: {
                type: 'navigate',
                label: 'Navigate',
                icon: '🌐',
                color: '#3B82F6',
                description: 'Navigate to a URL',
                payload: { url: '' },
                isValid: false,
            },
            click: {
                type: 'click',
                label: 'Click',
                icon: '👆',
                color: '#8B5CF6',
                description: 'Click an element',
                payload: { selector: '' },
                isValid: false,
            },
            fill: {
                type: 'fill',
                label: 'Fill Form',
                icon: '📝',
                color: '#F59E0B',
                description: 'Fill input fields',
                payload: { selector: '', text: '' },
                isValid: false,
            },
            extract: {
                type: 'extract',
                label: 'Extract Data',
                icon: '📊',
                color: '#EF4444',
                description: 'Extract information',
                payload: { selector: '', variableName: '' },
                isValid: false,
            },
            wait: {
                type: 'wait',
                label: 'Wait',
                icon: '⏱️',
                color: '#6B7280',
                description: 'Pause execution',
                payload: { timeout: 1000 },
                isValid: true,
            },
            skill: {
                type: 'skill',
                label: 'Skill',
                icon: '⚡',
                color: '#EC4899',
                description: 'Run AI skill',
                payload: { skillName: '@brainstorming' },
                isValid: true,
            },
        };

        return nodeDefinitions[type] || {
            type: 'custom',
            label: 'Custom Action',
            icon: '⚙️',
            color: '#6366F1',
            description: 'Custom automation step',
            payload: {},
            isValid: false,
        };
    };

    const compileToTemplate = (): AutomationTemplate => {
        // Sort nodes by position to determine execution order
        const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

        const steps: any[] = sortedNodes
            .filter(node => node.data.type !== ('start' as any))
            .map((node, index) => ({
                id: node.id,
                type: node.data.type.toUpperCase(),
                payload: node.data.payload,
                order: index,
                enabled: true,
            }));

        return {
            name: 'Untitled Automation',
            description: 'Created with Visual Builder',
            steps,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    };

    const handleGenerate = async () => {
        const prompt = window.prompt("Describe what you want this Guru to do:");
        if (!prompt) return;

        try {
            // Use env var or default
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            const res = await fetch(`${API_URL}/api/gurus/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();

            if (data.steps) {
                const newNodes: FlowNode[] = data.steps.map((step: any, index: number) => ({
                    id: uuidv4(),
                    type: 'automationNode',
                    position: { x: 250, y: 50 + index * 150 },
                    data: mapStepToNodeData(step),
                }));
                // Reset edges
                setNodes(newNodes);
                setEdges([]);

                // Auto-connect nodes
                const newEdges: Edge[] = [];
                for (let i = 0; i < newNodes.length - 1; i++) {
                    newEdges.push({
                        id: `e${newNodes[i].id}-${newNodes[i + 1].id}`,
                        source: newNodes[i].id,
                        target: newNodes[i + 1].id,
                        type: 'smoothstep',
                        animated: true
                    });
                }
                setEdges(newEdges);
            }
        } catch (e) {
            console.error("Generation failed", e);
            alert("Failed to generate Guru. Check console.");
        }
    };

    const handleSave = () => {
        const template = compileToTemplate();
        onSave?.(template);
    };

    const handleRun = () => {
        const template = compileToTemplate();
        onRun?.(template);
    };

    const updateNodeData = (nodeId: string, newData: Partial<FlowNodeData>) => {
        setNodes(nodes.map(node =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, ...newData } }
                : node
        ));
    };

    return (
        <div className="visual-builder-container" ref={reactFlowWrapper}>
            <ReactFlowProvider>
                <div className="builder-layout">
                    <NodeLibrary />

                    <div className="main-canvas">
                        <BuilderToolbar
                            onSave={handleSave}
                            onRun={handleRun}
                            onGenerate={handleGenerate}
                            canSave={nodes.length > 0}
                        />

                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeClick={(e, node) => setSelectedNode(node)}
                            nodeTypes={nodeTypes}
                            fitView
                            attributionPosition="bottom-left"
                        >
                            <Controls />
                            <Background color="#aaa" gap={16} />
                        </ReactFlow>
                    </div>

                    {selectedNode && (
                        <div className="properties-panel">
                            <h3 className="panel-title">Node Properties</h3>
                            <NodePropertiesEditor
                                node={selectedNode}
                                onUpdate={updateNodeData}
                            />
                        </div>
                    )}
                </div>
            </ReactFlowProvider>
        </div>
    );
};

// Helper component for node properties editing
const NodePropertiesEditor: React.FC<{
    node: Node;
    onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
}> = ({ node, onUpdate }) => {
    const [localData, setLocalData] = useState(node.data);

    // Sync state with node prop changes
    useEffect(() => {
        setLocalData(node.data);
    }, [node.data]);

    const handleChange = (field: string, value: any) => {
        const newData = { ...localData, [field]: value };
        setLocalData(newData);
        onUpdate(node.id, newData);
    };

    const handlePayloadChange = (field: string, value: any) => {
        // For payload changes, we need to update description/validity logic if implemented deep
        const newPayload = { ...localData.payload, [field]: value };
        const newData = { ...localData, payload: newPayload };

        // Simple validity check
        if (localData.type === 'navigate' && field === 'url' && value.length > 3) newData.isValid = true;
        if (localData.type === 'click' && field === 'selector' && value.length > 0) newData.isValid = true;

        setLocalData(newData);
        onUpdate(node.id, newData);
    };

    return (
        <div className="properties-form">
            <div className="form-group">
                <label>Label</label>
                <input
                    type="text"
                    value={localData.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                />
            </div>

            {localData.type === 'navigate' && (
                <div className="form-group">
                    <label>URL</label>
                    <input
                        type="text"
                        value={localData.payload.url || ''}
                        onChange={(e) => handlePayloadChange('url', e.target.value)}
                    />
                </div>
            )}

            {(localData.type === 'click' || localData.type === 'fill' || localData.type === 'extract') && (
                <div className="form-group">
                    <label>Selector</label>
                    <input
                        type="text"
                        value={localData.payload.selector || ''}
                        onChange={(e) => handlePayloadChange('selector', e.target.value)}
                    />
                </div>
            )}

            {localData.type === 'fill' && (
                <div className="form-group">
                    <label>Text</label>
                    <input
                        type="text"
                        value={localData.payload.text || ''}
                        onChange={(e) => handlePayloadChange('text', e.target.value)}
                    />
                </div>
            )}

            {localData.type === 'extract' && (
                <div className="form-group">
                    <label>Variable Name</label>
                    <input
                        type="text"
                        value={localData.payload.variableName || ''}
                        onChange={(e) => handlePayloadChange('variableName', e.target.value)}
                    />
                </div>
            )}

            {localData.type === 'wait' && (
                <div className="form-group">
                    <label>Timeout (ms)</label>
                    <input
                        type="number"
                        value={localData.payload.timeout || 1000}
                        onChange={(e) => handlePayloadChange('timeout', parseInt(e.target.value))}
                    />
                </div>
            )}

            {localData.type === 'skill' && (
                <div className="form-group">
                    <label>Skill Name</label>
                    <select
                        value={localData.payload.skillName || '@brainstorming'}
                        onChange={(e) => handlePayloadChange('skillName', e.target.value)}
                    >
                        <option value="@brainstorming">@brainstorming</option>
                        <option value="@systematic-debugging">@systematic-debugging</option>
                        <option value="@stripe-integration">@stripe-integration</option>
                        <option value="@supabase-integration">@supabase-integration</option>
                    </select>
                </div>
            )}
        </div>
    );
};
