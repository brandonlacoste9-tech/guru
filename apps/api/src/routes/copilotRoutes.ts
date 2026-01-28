import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNodeExpressEndpoint,
} from "@copilotkit/runtime";
import { Router } from "express";

const router: Router = Router();

// Initialize the CopilotRuntime with an adapter (OpenAI/DeepSeek compatible)
const copilotRuntime = new CopilotRuntime();

router.post("/", (req, res, next) => {
  const openaiAdapter = new OpenAIAdapter();

  const handler = copilotRuntimeNodeExpressEndpoint({
    endpoint: "/api/copilot",
    runtime: copilotRuntime,
    serviceAdapter: openaiAdapter,
  });

  return handler(req, res);
});

export default router;
