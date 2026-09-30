---
title: "activerecord: remove or credit the 49 invented branches in encryption part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-subsystems"]
deps-rfc: []
est-loc: 374
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `encryption/encryptor.ts#compress` — `+if`
- `encryption/encryptor.ts#forceEncodingIfNeeded` — `+if +if`
- `encryption/envelope-encryption-key-provider.ts#decryptDataKey` — `+try +if +rescue +throw`
- `encryption/extended-deterministic-queries.ts#installSupport` — `+if +if +if +if +if +if +throw`
- `encryption/extended-deterministic-queries.ts#processArguments` — `+if +if`
- `encryption/extended-deterministic-queries.ts#processEncryptedQueryArgument` — `+if`
- `encryption/extended-deterministic-uniqueness-validator.ts#installSupport` — `+if +if +throw`
- `encryption/key-provider.ts#constructor` — `+if`
- `encryption/key-provider.ts#encryptionKey` — `+if`
- `encryption/message-pack-message-serializer.ts#load` — `+if +throw +throw`
- `encryption/message-pack-message-serializer.ts#hashToMessage` — `+if`
- `encryption/message-pack-message-serializer.ts#validateMessageDataFormat` — `+if +throw +if +throw`
- `encryption/message-pack-message-serializer.ts#parseProperties` — `+if`
- `encryption/message-serializer.ts#load` — `+if +throw`
- `encryption/message-serializer.ts#parseMessage` — `+if`
- `encryption/message-serializer.ts#validateMessageDataFormat` — `+if +throw +if +throw`
- `encryption/message-serializer.ts#parseProperties` — `+if`
- `encryption/message-serializer.ts#encodeIfNeeded` — `+if`
- `encryption/message-serializer.ts#decodeIfNeeded` — `+if +throw +throw`
- `encryption/properties.ts#validateValueType` — `+if +if +if`
- `encryption/properties.ts#add` — `+if`
- `encryption/scheme.ts#constructor` — `+if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
