/**
 * Custom fetch wrapper for DeepSeek API
 * Fixes tool serialization and ensures proper schema format
 */
import * as fs from "fs";
import * as path from "path";

type DeepSeekRequestBody = {
  model: string;
  messages: Array<any>;
  tools?: Array<any>;
  [key: string]: any;
};

/**
 * Redacts sensitive information from logs
 */
function redactSensitive(obj: any): any {
  if (!obj) return obj;

  const serialized = JSON.stringify(obj);
  return JSON.parse(
    serialized
      .replace(
        /("(?:api[_-]?key|authorization|bearer|token)"\s*:\s*)"[^"]+"/gi,
        '$1"[REDACTED]"',
      )
      .replace(/(sk-[a-zA-Z0-9]{20,})/g, "[REDACTED_KEY]"),
  );
}

/**
 * Fixes tool schema formatting for DeepSeek compatibility
 */
function fixToolSchemas(tools: Array<any>): Array<any> {
  if (!tools || tools.length === 0) return tools;

  return tools.map((tool) => {
    const name = tool.name || tool.function?.name;
    const description = tool.description || tool.function?.description || "";
    const parameters = tool.parameters ||
      tool.function?.parameters || {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      };

    // Ensure parameters has type: 'object'
    if (!parameters.type) {
      parameters.type = "object";
    }

    return {
      type: "function",
      function: {
        name,
        description,
        parameters,
      },
    };
  });
}

/**
 * Custom fetch wrapper for DeepSeek API
 */
export async function deepseekFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const url = input.toString();
  console.log(`[DeepSeek SDK] Fetching: ${url}`);
  const options = init || {};
  try {
    // Parse request body
    let body: DeepSeekRequestBody | undefined;
    if (options.body && typeof options.body === "string") {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        // Not JSON or body is already parsed (shouldn't happen with SDK but good for safety)
      }
    }

    // Fix tool schemas if present
    if (body?.tools) {
      body.tools = fixToolSchemas(body.tools);
    }

    // Map new SDK 'input' to 'messages' for DeepSeek compatibility
    if (body && (body as any).input && !body.messages) {
      body.messages = (body as any).input;
      delete (body as any).input;
    }

    // Force the correct chat completions path
    // Some versions of the AI SDK might try to use /v1/responses or other endpoints
    let finalUrl = url;
    if (url.includes("/chat/completions") || url.includes("/responses")) {
      // Ensure we have /v1/chat/completions exactly
      finalUrl = "https://api.deepseek.com/v1/chat/completions";
    }

    // Fix message roles and content (DeepSeek doesn't support 'developer' role or 'input_text' type)
    if (body?.messages) {
      body.messages = body.messages.map((msg) => {
        let fixedMsg = { ...msg };

        // Map 'developer' to 'system'
        if (fixedMsg.role === "developer") {
          fixedMsg.role = "system";
        }

        // Map 'input_text' to string or standard 'text'
        if (Array.isArray(fixedMsg.content)) {
          fixedMsg.content = fixedMsg.content.map((part: any) => {
            if (part.type === "input_text") {
              return { type: "text", text: part.text };
            }
            return part;
          });

          // If it's a single text part, simplify to string for maximum compatibility
          if (
            fixedMsg.content.length === 1 &&
            fixedMsg.content[0].type === "text"
          ) {
            fixedMsg.content = fixedMsg.content[0].text;
          }
        }

        return fixedMsg;
      });
    }
    // DEBUG: Write body to file
    fs.writeFileSync("ds_body.json", JSON.stringify(body, null, 2));

    // Reconstruct options with fixed body
    const fixedOptions: any = {
      ...options,
      body: body ? JSON.stringify(body) : options.body,
    };

    // Log redacted request (for debugging)
    console.log(
      "[DeepSeek] Request Headers Keys:",
      Object.keys(fixedOptions.headers || {}),
    );
    console.log("[DeepSeek] Request:", {
      url: finalUrl,
      originalUrl: url,
      method: fixedOptions.method || "POST",
      headers: redactSensitive(fixedOptions.headers),
      bodyPreview: body
        ? {
            model: body.model,
            messageCount: body.messages?.length,
            toolCount: body.tools?.length,
            hasTools: !!body.tools,
          }
        : undefined,
    });

    // Make the actual request
    const response = await fetch(finalUrl, fixedOptions);

    // Log response status
    console.log("[DeepSeek] Response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // If error, log more details
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DeepSeek] Error response:", {
        status: response.status,
        body: errorText.substring(0, 500), // First 500 chars only
      });

      // Return a new response with the error (so it can be consumed again)
      return new Response(errorText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error) {
    console.error("[DeepSeek] Fetch error:", error);
    throw error;
  }
}
