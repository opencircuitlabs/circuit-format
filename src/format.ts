import type { CircuitDocument } from "./types.js";
import { parseCircuitDocument } from "./validate.js";

export function formatCircuitDocument(input: unknown, indentation = 2): string {
  return `${JSON.stringify(sortObject(parseCircuitDocument(input)), null, indentation)}\n`;
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, sortObject(entry)]));
}

export function createCircuitDocument(name: string): CircuitDocument {
  return {
    format: "opencircuit",
    version: "1.0",
    metadata: { name },
    ground: "0",
    nodes: [{ id: "0", label: "Ground" }],
    components: [],
  };
}
