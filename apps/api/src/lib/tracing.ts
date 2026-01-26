import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { trace, Tracer } from "@opentelemetry/api";

/**
 * Initialize OpenTelemetry for Arize/Phoenix tracing.
 */
let sdk: NodeSDK | null = null;

export const initTracing = () => {
  if (sdk) return;

  const arizeSpaceId = process.env.ARIZE_SPACE_ID;
  const arizeApiKey = process.env.ARIZE_API_KEY;

  if (!arizeSpaceId || !arizeApiKey) {
    console.warn("⚠️ Arize keys missing. Skipping tracing initialization.");
    return;
  }

  const exporter = new OTLPTraceExporter({
    url: "https://otlp.arize.com/v1/traces",
    headers: {
      Authorization: `${arizeSpaceId}:${arizeApiKey}`,
      // Some Arize OTLP implementations use space_id/api_key headers directly
      space_id: arizeSpaceId,
      api_key: arizeApiKey,
    },
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: "guru-api",
      [ATTR_SERVICE_VERSION]: "1.0.0",
      "arize.space_id": arizeSpaceId,
    }),
    spanProcessor: new BatchSpanProcessor(exporter),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new FetchInstrumentation(),
    ],
  });

  sdk.start();
  console.log("🔭 Tracing initialized targeting Arize AX");

  process.on("SIGTERM", () => {
    sdk
      ?.shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
};

export const getTracer = (name: string): Tracer => {
  return trace.getTracer(name);
};
