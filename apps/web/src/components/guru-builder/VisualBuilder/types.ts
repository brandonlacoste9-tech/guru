export interface FlowNodeData {
  type:
    | "navigate"
    | "click"
    | "fill"
    | "extract"
    | "wait"
    | "custom"
    | "skill"
    | "guru";
  label: string;
  description?: string;
  icon: string;
  color: string;
  payload: any;
  isValid: boolean;
}

export interface FlowNode {
  id: string;
  type: "automationNode";
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated?: boolean;
  data?: {
    condition?: string;
    delay?: number;
  };
}

export interface FlowMap {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface AutomationTemplate {
  id?: string;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AutomationStep {
  id: string;
  type: string;
  payload: any;
  order: number;
  enabled: boolean;
}
