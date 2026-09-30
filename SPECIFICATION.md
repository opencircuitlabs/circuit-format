# OpenCircuit Circuit Format 1.0

## Status

Version 1.0 is the first stable document shape. Additive component types and optional properties may be introduced in minor releases. Removing or changing existing semantics requires a new major format version.

## Document

Every document contains:

- `format`: always `"opencircuit"`.
- `version`: currently `"1.0"`.
- `metadata`: human-facing information with a required `name`.
- `ground`: the ID of the zero-volt reference node.
- `nodes`: every electrical net used by the circuit.
- `components`: two-terminal components connected by node ID.
- `extensions`: optional namespaced data that core readers may preserve and ignore.

IDs are case-sensitive, unique within their collection and match `^[A-Za-z0-9][A-Za-z0-9_.:-]*$`.

## Units and signs

All values use unscaled SI units:

| Quantity | Unit |
|---|---|
| Voltage | volt |
| Current | ampere |
| Resistance | ohm |
| Capacitance | farad |
| Inductance | henry |
| Position | editor-defined canvas unit |

For any component, positive voltage is `V(from) - V(to)` and positive current flows from `from` to `to`. Positive power therefore means absorbed power; negative power means delivered power.

## Components

| Type | Required value | Optional values |
|---|---|---|
| `resistor` | positive `resistance` | — |
| `voltage-source` | finite `voltage` | — |
| `current-source` | finite `current` | — |
| `switch` | boolean `closed` | positive `onResistance` |
| `capacitor` | positive `capacitance` | `initialVoltage` |
| `inductor` | positive `inductance` | `initialCurrent` |
| `diode` | — | `model`, positive `forwardVoltage` |
| `led` | — | `color`, positive `forwardVoltage` |
| `lamp` | positive `resistance` | — |

All components require `id`, `type`, `from` and `to`. They may also contain `label`, `position` and a rotation of 0, 90, 180 or 270 degrees.

## Nodes

Nodes describe electrical connectivity, not drawing wires. Any terminals sharing a node ID are electrically connected. Editors may use optional node and component positions to generate or retain a visual layout.

## Extensions

Extension keys should use a reverse-domain namespace such as `org.opencircuitlabs.analysis`. Readers must preserve unrecognized extensions when editing a document unless the user explicitly requests their removal. Extension data must not alter core electrical meanings.

## Validation

JSON Schema validates document structure. The runtime validator additionally checks relationships that JSON Schema cannot express conveniently, including unique IDs, a valid ground reference, component node references and terminals that do not connect back to the same node.

## Compatibility

A reader that supports major version 1 should reject unknown major versions. It may preserve unknown namespaced extension data. Writers should emit the oldest version capable of representing the circuit.
