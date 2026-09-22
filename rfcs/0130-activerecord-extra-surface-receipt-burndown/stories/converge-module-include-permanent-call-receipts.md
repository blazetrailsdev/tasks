---
title: "Make the include/prepend/set_callback calls PERMANENT call receipts claim trails cannot make"
status: claimed
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: 4
pr: null
claim: "2026-09-22T16:36:38Z"
assignee: "converge-module-include-permanent-call-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These `@missingRailsCall include|prepend —
PERMANENT` receipts claim trails can never make the call, but
`include()` / `prepend()` exist (`packages/ruby-compat/src/include.ts:615,723`) and
CLAUDE.md § Module mixins names them the settled idiom:

| trails                                                                                            | Rails                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `associations.ts:296` `hasAndBelongsToMany` ← `include`                                           | `associations.rb:1886` `include Module.new {…}`                                                                   |
| `core.ts:502` `generatedAssociationMethods` ← `include` (returns a `Set<string>`)                 | `core.rb:338-345` builds and includes a module (prior art `generated-association-methods-module`, RFC 0023 draft) |
| `enum.ts:449` `_enumMethodsModule` ← `include` (registry map)                                     | `enum.rb:326-331`                                                                                                 |
| `encryption/encryptable-record.ts:122` `overrideAccessorsToPreserveOriginal` ← `include`          | `encryption/encryptable_record.rb:109`                                                                            |
| `encryption/extended-deterministic-queries.ts:14` `installSupport` ← `include`                    | `encryption/extended_deterministic_queries.rb:24`                                                                 |
| `encryption/extended-deterministic-uniqueness-validator.ts:7` `installSupport` ← `prepend`        | `encryption/extended_deterministic_uniqueness_validator.rb:6`                                                     |
| `secure-token.ts:16` `hasSecureToken` ← `set_callback` (spelled `beforeCreate`/`afterInitialize`) | `secure_token.rb:54`                                                                                              |

`aggregations.ts:27` `composedOf` ← `include` is already owned by
`converge-composed-of-include-aggregations-module` (RFC 0130, ready) and is
excluded here. `module-carrier.ts:5` `getOrCreateModuleCarrier`
(`@noRailsEquivalent PERMANENT`) exists only to fake these modules and should go
with them.

## Acceptance criteria

- Each body makes the Rails call through ruby-compat `include()` / `prepend()` /
  the port of ActiveSupport `set_callback`, and its receipt is deleted.
- `getOrCreateModuleCarrier` is deleted once nothing reads it.
- Split along the encryption / associations+enum+secure-token line if the
  diff exceeds the LOC ceiling.
