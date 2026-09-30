import { CircuitFormatError } from "./errors.js";
import type { CircuitComponent, CircuitDocument, ValidationIssue, ValidationResult } from "./types.js";

const TYPES = new Set(["resistor", "voltage-source", "current-source", "switch", "capacitor", "inductor", "diode", "led", "lamp"]);
const ROTATIONS = new Set([0, 90, 180, 270]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const positive = (value: unknown): value is number => finite(value) && value > 0;
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

export function validateCircuitDocument(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const issue = (path: string, message: string): void => { issues.push({ path, message }); };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { valid: false, issues: [{ path: "$", message: "must be an object" }] };
  const document = input as Partial<CircuitDocument>;

  rejectUnknownKeys(document, new Set(["format", "version", "metadata", "ground", "nodes", "components", "extensions"]), "$", issue);

  if (document.format !== "opencircuit") issue("$.format", 'must equal "opencircuit"');
  if (document.version !== "1.0") issue("$.version", 'must equal "1.0"');
  if (!document.metadata || typeof document.metadata !== "object") issue("$.metadata", "must be an object");
  else {
    rejectUnknownKeys(document.metadata, new Set(["name", "description", "author", "license", "created", "modified", "tags"]), "$.metadata", issue);
    if (!nonEmpty(document.metadata.name) || document.metadata.name.length > 200) issue("$.metadata.name", "must be a non-empty string of at most 200 characters");
    for (const field of ["description", "author", "license"] as const) {
      const value = document.metadata[field];
      if (value !== undefined && typeof value !== "string") issue(`$.metadata.${field}`, "must be a string");
    }
    if (typeof document.metadata.description === "string" && document.metadata.description.length > 2000) issue("$.metadata.description", "must be at most 2000 characters");
    if (typeof document.metadata.author === "string" && document.metadata.author.length > 200) issue("$.metadata.author", "must be at most 200 characters");
    if (typeof document.metadata.license === "string" && document.metadata.license.length > 100) issue("$.metadata.license", "must be at most 100 characters");
    for (const field of ["created", "modified"] as const) {
      const value = document.metadata[field];
      if (value !== undefined && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) issue(`$.metadata.${field}`, "must be an ISO 8601 date-time");
    }
    if (document.metadata.tags !== undefined && (!Array.isArray(document.metadata.tags) || document.metadata.tags.some((tag) => !nonEmpty(tag)))) {
      issue("$.metadata.tags", "must contain non-empty strings");
    }
  }
  if (!validId(document.ground)) issue("$.ground", "must be a valid node ID");
  if (!Array.isArray(document.nodes)) issue("$.nodes", "must be an array");
  if (!Array.isArray(document.components)) issue("$.components", "must be an array");

  const nodeIds = new Set<string>();
  if (Array.isArray(document.nodes)) {
    document.nodes.forEach((node, index) => {
      const path = `$.nodes[${index}]`;
      if (!node || typeof node !== "object") return issue(path, "must be an object");
      rejectUnknownKeys(node, new Set(["id", "label", "position"]), path, issue);
      if (!validId(node.id)) issue(`${path}.id`, "must be a valid identifier");
      else if (nodeIds.has(node.id)) issue(`${path}.id`, `duplicate node ID "${node.id}"`);
      else nodeIds.add(node.id);
      if (node.label !== undefined && (typeof node.label !== "string" || node.label.length > 200)) issue(`${path}.label`, "must be a string of at most 200 characters");
      validatePosition(node.position, `${path}.position`, issue);
    });
  }
  if (nonEmpty(document.ground) && !nodeIds.has(document.ground)) issue("$.ground", `references unknown node "${document.ground}"`);

  const componentIds = new Set<string>();
  if (Array.isArray(document.components)) {
    document.components.forEach((component, index) => {
      validateComponent(component, index, nodeIds, componentIds, issue);
    });
  }
  if (document.extensions !== undefined && (!document.extensions || typeof document.extensions !== "object" || Array.isArray(document.extensions))) {
    issue("$.extensions", "must be an object");
  }
  return issues.length === 0 ? { valid: true, value: input as CircuitDocument, issues: [] } : { valid: false, issues };
}

export function parseCircuitDocument(input: unknown): CircuitDocument {
  const result = validateCircuitDocument(input);
  if (!result.valid) throw new CircuitFormatError(result.issues);
  return result.value;
}

function validatePosition(
  position: unknown,
  path: string,
  issue: (path: string, message: string) => void,
): void {
  if (position === undefined) return;
  if (!position || typeof position !== "object") {
    issue(path, "must contain finite x and y coordinates");
    return;
  }
  rejectUnknownKeys(position, new Set(["x", "y"]), path, issue);
  if (!finite((position as { x?: unknown }).x) || !finite((position as { y?: unknown }).y)) {
    issue(path, "must contain finite x and y coordinates");
  }
}

function validateComponent(
  component: CircuitComponent,
  index: number,
  nodeIds: Set<string>,
  componentIds: Set<string>,
  issue: (path: string, message: string) => void,
): void {
  const path = `$.components[${index}]`;
  if (!component || typeof component !== "object") return issue(path, "must be an object");
  const valueKeys: Record<string, string[]> = {
    resistor: ["resistance"], "voltage-source": ["voltage"], "current-source": ["current"],
    switch: ["closed", "onResistance"], capacitor: ["capacitance", "initialVoltage"],
    inductor: ["inductance", "initialCurrent"], diode: ["model", "forwardVoltage"],
    led: ["color", "forwardVoltage"], lamp: ["resistance"],
  };
  rejectUnknownKeys(component, new Set(["id", "type", "from", "to", "label", "position", "rotation", ...(valueKeys[component.type] ?? [])]), path, issue);
  if (!validId(component.id)) issue(`${path}.id`, "must be a valid identifier");
  else if (componentIds.has(component.id)) issue(`${path}.id`, `duplicate component ID "${component.id}"`);
  else componentIds.add(component.id);
  if (!TYPES.has(component.type)) issue(`${path}.type`, "is not a supported component type");
  if (component.label !== undefined && (typeof component.label !== "string" || component.label.length > 200)) issue(`${path}.label`, "must be a string of at most 200 characters");
  for (const terminal of ["from", "to"] as const) {
    if (!validId(component[terminal])) issue(`${path}.${terminal}`, "must be a valid node ID");
    else if (!nodeIds.has(component[terminal])) issue(`${path}.${terminal}`, `references unknown node "${component[terminal]}"`);
  }
  if (component.from === component.to) issue(path, "cannot connect both terminals to the same node");
  validatePosition(component.position, `${path}.position`, issue);
  if (component.rotation !== undefined && !ROTATIONS.has(component.rotation)) issue(`${path}.rotation`, "must be 0, 90, 180, or 270");

  switch (component.type) {
    case "resistor": case "lamp":
      if (!positive(component.resistance)) issue(`${path}.resistance`, "must be greater than zero ohms");
      break;
    case "voltage-source": if (!finite(component.voltage)) issue(`${path}.voltage`, "must be a finite number of volts"); break;
    case "current-source": if (!finite(component.current)) issue(`${path}.current`, "must be a finite number of amperes"); break;
    case "switch":
      if (typeof component.closed !== "boolean") issue(`${path}.closed`, "must be a boolean");
      if (component.onResistance !== undefined && !positive(component.onResistance)) issue(`${path}.onResistance`, "must be greater than zero ohms");
      break;
    case "capacitor":
      if (!positive(component.capacitance)) issue(`${path}.capacitance`, "must be greater than zero farads");
      if (component.initialVoltage !== undefined && !finite(component.initialVoltage)) issue(`${path}.initialVoltage`, "must be a finite number of volts");
      break;
    case "inductor":
      if (!positive(component.inductance)) issue(`${path}.inductance`, "must be greater than zero henries");
      if (component.initialCurrent !== undefined && !finite(component.initialCurrent)) issue(`${path}.initialCurrent`, "must be a finite number of amperes");
      break;
    case "diode":
      if (component.model !== undefined && !nonEmpty(component.model)) issue(`${path}.model`, "must be a non-empty string");
      if (component.forwardVoltage !== undefined && !positive(component.forwardVoltage)) issue(`${path}.forwardVoltage`, "must be greater than zero volts");
      break;
    case "led":
      if (component.color !== undefined && !nonEmpty(component.color)) issue(`${path}.color`, "must be a non-empty string");
      if (component.forwardVoltage !== undefined && !positive(component.forwardVoltage)) issue(`${path}.forwardVoltage`, "must be greater than zero volts");
      break;
  }
}

function validId(value: unknown): value is string {
  return nonEmpty(value) && value.length <= 128 && ID_PATTERN.test(value);
}

function rejectUnknownKeys(
  object: object,
  allowed: Set<string>,
  path: string,
  issue: (path: string, message: string) => void,
): void {
  Object.keys(object).filter((key) => !allowed.has(key)).forEach((key) => issue(`${path}.${key}`, "is not allowed"));
}
