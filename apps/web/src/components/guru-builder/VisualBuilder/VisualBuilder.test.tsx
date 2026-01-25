
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualBuilder } from './VisualBuilder';
import { ReactFlowProvider } from 'reactflow';

// Mock ReactFlow since it relies on ResizeObserver which is not available in JSDOM usually
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

// Mock UUID
jest.mock('uuid', () => ({ v4: () => 'test-id-123' }));

const renderWithProvider = (component: React.ReactElement) => {
    return render(component);
};

describe('VisualBuilder', () => {
    test('renders node library with action blocks', () => {
        renderWithProvider(<VisualBuilder />);

        expect(screen.getByText('Action Blocks')).toBeInTheDocument();
        expect(screen.getByText('Navigate')).toBeInTheDocument();
        expect(screen.getByText('Click Element')).toBeInTheDocument();
        expect(screen.getByText('Fill Form')).toBeInTheDocument();
    });

    // Since dragging involves internal state of ReactFlow which is hard to mock fully in JSDOM, 
    // we will focus on rendering and event firing if possible.
    // Note: react-flow tests usually need a specific setup. For now we test component presence.

    test('renders save and run buttons', () => {
        renderWithProvider(<VisualBuilder />);
        expect(screen.getByText('💾 Save Template')).toBeInTheDocument();
        expect(screen.getByText('▶️ Run Automation')).toBeInTheDocument();
    });
});
