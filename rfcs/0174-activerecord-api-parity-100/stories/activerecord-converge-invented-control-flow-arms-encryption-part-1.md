---
title: "activerecord: remove or credit the 80 invented branches in encryption part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-subsystems"]
deps-rfc: []
est-loc: 560
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

- `encryption/auto-filtered-parameters.ts#collectForLater` — `+if`
- `encryption/cipher.ts#tryToDecryptWithEach` — `+if +throw +if +throw`
- `encryption/cipher/aes256-gcm.ts#encrypt` — `+if`
- `encryption/cipher/aes256-gcm.ts#decrypt` — `+if +throw`
- `encryption/configurable.ts#configure` — `+if +if +if +if`
- `encryption/configurable.ts#onEncryptedAttributeDeclared` — `+if`
- `encryption/configurable.ts#encryptedAttributeWasDeclared` — `+if`
- `encryption/contexts.ts#withEncryptionContext` — `-loop +rescue +throw +if +throw`
- `encryption/contexts.ts#currentCustomContext` — `+if`
- `encryption/derived-secret-key-provider.ts#constructor` — `+if`
- `encryption/deterministic-key-provider.ts#constructor` — `+if`
- `encryption/encryptable-record.ts#encrypts` — `+if +if +loop`
- `encryption/encryptable-record.ts#deterministicEncryptedAttributes` — `+if +loop +if`
- `encryption/encryptable-record.ts#preserveOriginalEncrypted` — `+if`
- `encryption/encryptable-record.ts#buildEncryptAttributeAssignments` — `+loop +if`
- `encryption/encryptable-record.ts#buildDecryptAttributeAssignments` — `+loop`
- `encryption/encrypted-attribute-type.ts#cast` — `+if`
- `encryption/encrypted-attribute-type.ts#deserialize` — `+if`
- `encryption/encrypted-attribute-type.ts#serialize` — `+if`
- `encryption/encrypted-attribute-type.ts#isEncrypted` — `+if`
- `encryption/encrypted-attribute-type.ts#previousTypes` — `+if`
- `encryption/encrypted-attribute-type.ts#decryptAsText` — `+try +rescue +if +throw +if`
- `encryption/encrypted-attribute-type.ts#tryToDeserializeWithPreviousEncryptedTypes` — `+throw +if`
- `encryption/encrypted-attribute-type.ts#serializeWithCurrent` — `+if +if +if +if +if`
- `encryption/encrypted-attribute-type.ts#textToDatabaseType` — `+if +if +if`
- `encryption/encrypted-attribute-type.ts#databaseTypeToText` — `+if`
- `encryption/encryptor.ts#encrypt` — `+throw +if +if +if +throw`
- `encryption/encryptor.ts#decrypt` — `+if +if +if +if +if +throw +if +throw +throw +throw +if +try +rescue +throw +throw +if`
- `encryption/encryptor.ts#validatePayloadType` — `+if`
- `encryption/encryptor.ts#buildEncryptedMessage` — `+throw +if +if`
- `encryption/encryptor.ts#deserializeMessage` — `+if +throw`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
