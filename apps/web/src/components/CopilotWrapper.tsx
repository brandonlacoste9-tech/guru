'use client';

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function CopilotWrapper({ children }: { children: React.ReactNode }) {
    return (
        <CopilotKit publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY} runtimeUrl="/api/copilot">
            {children}
        </CopilotKit>
    );
}
