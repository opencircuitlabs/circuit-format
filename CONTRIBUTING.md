# Contributing

Changes to a shared format have long-term compatibility costs. Open an issue before proposing a new component, required property or semantic change.

Pull requests should include:

- the motivation and affected consumers;
- specification and JSON Schema updates;
- matching TypeScript/runtime validation changes;
- valid and invalid test fixtures;
- a compatibility statement.

Run `npm run check`, `npm test` and `npm run validate:examples` before submitting.
