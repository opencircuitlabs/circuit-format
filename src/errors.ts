import type { ValidationIssue } from "./types.js";

export class CircuitFormatError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(`Invalid OpenCircuit document:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`);
    this.name = "CircuitFormatError";
    this.issues = issues;
  }
}
