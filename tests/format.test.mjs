import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { CircuitFormatError, createCircuitDocument, formatCircuitDocument, parseCircuitDocument, validateCircuitDocument } from "../dist/index.js";

const exampleFiles = ["examples/voltage-divider.json", "examples/rc-low-pass.json"];
const loadJson = async (file) => JSON.parse(await readFile(file, "utf8"));

test("all examples satisfy the JSON Schema", async () => {
  const schema = await loadJson("schema/v1/circuit.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } });
  const validate = ajv.compile(schema);
  for (const file of exampleFiles) assert.equal(validate(await loadJson(file)), true, `${file}: ${JSON.stringify(validate.errors)}`);
});

test("all examples satisfy semantic validation", async () => {
  for (const file of exampleFiles) assert.equal(validateCircuitDocument(await loadJson(file)).valid, true, file);
});

test("semantic validation reports duplicate and missing node references together", () => {
  const input = createCircuitDocument("Broken");
  input.nodes.push({ id: "0" });
  input.components.push({ id: "R1", type: "resistor", from: "missing", to: "0", resistance: -1 });
  const result = validateCircuitDocument(input);
  assert.equal(result.valid, false);
  assert.ok(result.issues.length >= 3);
  assert.match(result.issues.map((entry) => entry.message).join(" "), /duplicate node|unknown node|greater than zero/);
});

test("unknown properties are rejected", () => {
  const input = { ...createCircuitDocument("Extra"), unexpected: true };
  assert.throws(() => parseCircuitDocument(input), CircuitFormatError);
});

test("invalid identifiers and initial conditions are rejected", () => {
  const input = createCircuitDocument("Invalid values");
  input.nodes.push({ id: "bad id" });
  input.components.push({ id: "C1", type: "capacitor", from: "0", to: "0", capacitance: 1e-6, initialVoltage: Number.NaN });
  const result = validateCircuitDocument(input);
  assert.equal(result.valid, false);
  assert.match(result.issues.map((entry) => entry.message).join(" "), /valid identifier|same node|finite number/);
});

test("the formatter produces stable, newline-terminated JSON", async () => {
  const input = await loadJson(exampleFiles[0]);
  const once = formatCircuitDocument(input);
  const twice = formatCircuitDocument(JSON.parse(once));
  assert.equal(once, twice);
  assert.ok(once.endsWith("\n"));
});

test("createCircuitDocument returns a valid minimal document", () => {
  const document = createCircuitDocument("New circuit");
  assert.equal(validateCircuitDocument(document).valid, true);
  assert.equal(document.ground, "0");
});
