# OpenCircuit Circuit Format

A strict, versioned and portable JSON format for electronic circuits. It gives simulators, editors, teaching tools and command-line programs a common document they can exchange without sharing an implementation.

## Features

- JSON Schema Draft 2020-12
- TypeScript types and dependency-free runtime validation
- Semantic checks for IDs, node references and component values
- Stable JSON formatter and command-line validator
- Explicit versioning and extension mechanism
- SI units and documented current/voltage direction conventions
- Resistors, sources, switches, capacitors, inductors, diodes, LEDs and lamps
- Browser, ESM and CommonJS builds

## Install

```sh
npm install @opencircuitlabs/circuit-format
```

Until the package is published, clone this repository and run `npm install && npm run build`.

## Example

```json
{
  "format": "opencircuit",
  "version": "1.0",
  "metadata": { "name": "Simple resistor" },
  "ground": "0",
  "nodes": [{ "id": "0" }, { "id": "vcc" }],
  "components": [
    { "id": "V1", "type": "voltage-source", "from": "vcc", "to": "0", "voltage": 5 },
    { "id": "R1", "type": "resistor", "from": "vcc", "to": "0", "resistance": 1000 }
  ]
}
```

See the [complete specification](SPECIFICATION.md), [JSON Schema](schema/v1/circuit.schema.json) and [examples](examples).

## JavaScript API

```ts
import {
  createCircuitDocument,
  formatCircuitDocument,
  parseCircuitDocument,
  validateCircuitDocument,
} from "@opencircuitlabs/circuit-format";

const document = createCircuitDocument("My circuit");
const result = validateCircuitDocument(document);

if (result.valid) console.log(formatCircuitDocument(result.value));
parseCircuitDocument(document); // returns the typed document or throws CircuitFormatError
```

## CLI

```sh
circuit-format validate circuit.json
circuit-format format circuit.json
```

The formatter prints canonical, stable JSON to standard output; it never overwrites the input file.

## Development

```sh
npm install
npm run check
npm test
npm run validate:examples
npm pack --dry-run
```

The format is licensed under MIT. Example circuits are marked CC0 where practical.
