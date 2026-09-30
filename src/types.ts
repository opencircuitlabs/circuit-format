export type CircuitFormatVersion = "1.0";

export interface Position {
  x: number;
  y: number;
}

export interface CircuitMetadata {
  name: string;
  description?: string;
  author?: string;
  license?: string;
  created?: string;
  modified?: string;
  tags?: string[];
}

export interface CircuitNode {
  id: string;
  label?: string;
  position?: Position;
}

interface ComponentBase {
  id: string;
  from: string;
  to: string;
  label?: string;
  position?: Position;
  rotation?: 0 | 90 | 180 | 270;
}

export interface Resistor extends ComponentBase {
  type: "resistor";
  resistance: number;
}

export interface VoltageSource extends ComponentBase {
  type: "voltage-source";
  voltage: number;
}

export interface CurrentSource extends ComponentBase {
  type: "current-source";
  current: number;
}

export interface Switch extends ComponentBase {
  type: "switch";
  closed: boolean;
  onResistance?: number;
}

export interface Capacitor extends ComponentBase {
  type: "capacitor";
  capacitance: number;
  initialVoltage?: number;
}

export interface Inductor extends ComponentBase {
  type: "inductor";
  inductance: number;
  initialCurrent?: number;
}

export interface Diode extends ComponentBase {
  type: "diode";
  model?: string;
  forwardVoltage?: number;
}

export interface Led extends ComponentBase {
  type: "led";
  color?: string;
  forwardVoltage?: number;
}

export interface Lamp extends ComponentBase {
  type: "lamp";
  resistance: number;
}

export type CircuitComponent =
  | Resistor
  | VoltageSource
  | CurrentSource
  | Switch
  | Capacitor
  | Inductor
  | Diode
  | Led
  | Lamp;

export interface CircuitDocument {
  format: "opencircuit";
  version: CircuitFormatVersion;
  metadata: CircuitMetadata;
  ground: string;
  nodes: CircuitNode[];
  components: CircuitComponent[];
  extensions?: Record<string, unknown>;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; value: CircuitDocument; issues: [] }
  | { valid: false; issues: ValidationIssue[] };
