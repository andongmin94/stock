import { fetchJson } from "@/lib/markets/fetch-json";
import type {
  HyperliquidAnnotation,
  HyperliquidAnnotationEntry,
  HyperliquidMarketData,
  HyperliquidMeta,
} from "@/lib/markets/provider-types";

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const HYPERLIQUID_TIMEOUT_MS = 8_000;

async function postHyperliquid<T>(body: Record<string, unknown>) {
  try {
    return await fetchJson<T>(HYPERLIQUID_INFO_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      timeoutMs: HYPERLIQUID_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(
      error instanceof DOMException && error.name === "AbortError"
        ? "Hyperliquid request timed out"
        : "Hyperliquid request failed",
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHyperliquidMeta(value: unknown): value is HyperliquidMeta {
  return (
    isRecord(value) &&
    Array.isArray(value.universe) &&
    value.universe.every(
      (asset) =>
        isRecord(asset) &&
        typeof asset.name === "string" &&
        (asset.isDelisted === undefined ||
          typeof asset.isDelisted === "boolean"),
    )
  );
}

function isHyperliquidMarketData(
  value: unknown,
): value is HyperliquidMarketData {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isHyperliquidMeta(value[0]) &&
    Array.isArray(value[1]) &&
    value[1].every(isRecord)
  );
}

function isHyperliquidAnnotation(
  value: unknown,
): value is HyperliquidAnnotation {
  return (
    isRecord(value) &&
    (value.category === undefined || typeof value.category === "string") &&
    (value.displayName === undefined ||
      typeof value.displayName === "string") &&
    (value.keywords === undefined ||
      (Array.isArray(value.keywords) &&
        value.keywords.every((keyword) => typeof keyword === "string")))
  );
}

function isHyperliquidAnnotationEntry(
  value: unknown,
): value is HyperliquidAnnotationEntry {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    isHyperliquidAnnotation(value[1])
  );
}

export async function fetchHyperliquidMarketData() {
  const data = await postHyperliquid<unknown>({
    type: "metaAndAssetCtxs",
    dex: "xyz",
  });

  if (!isHyperliquidMarketData(data)) {
    throw new Error("Hyperliquid market data shape is invalid");
  }

  return data;
}

export async function fetchHyperliquidAnnotations() {
  const data = await postHyperliquid<unknown>({
    type: "perpConciseAnnotations",
  });

  if (!Array.isArray(data) || !data.every(isHyperliquidAnnotationEntry)) {
    throw new Error("Hyperliquid annotations shape is invalid");
  }

  return data;
}
