---
title: "Move encryption-hooks.ts members onto encryptable-record.ts and drop their PERMANENT receipts"
status: draft
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. `encryption-hooks.ts` carries
`@noRailsEquivalent PERMANENT` on five names that score `moved` without the
receipt, plus a registry setter:

| trails                                             | Rails definition                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `encryption-hooks.ts:4` `encrypts`                 | `encryption/encryptable_record.rb:49`                                                               |
| `encryption-hooks.ts:9` `encryptedAttribute`       | `encryption/encryptable_record.rb:146` (`encrypted_attribute?`)                                     |
| `encryption-hooks.ts:12` `ciphertextFor`           | `encryption/encryptable_record.rb:157`                                                              |
| `encryption-hooks.ts:15` `encrypt`                 | `encryption/encryptable_record.rb` (`encrypt`)                                                      |
| `encryption-hooks.ts:18` `decrypt`                 | `encryption/encryptable_record.rb` (`decrypt`)                                                      |
| `encryption-hooks.ts:40` `registerEncryptionHooks` | none — a registry that exists only so `base.ts` can reach the above without importing `encryption/` |

The PERMANENT claim is false for the first five; the sixth is invented
plumbing. If the import direction closes a real cycle, the sanctioned shape is
a zero-import slot (CLAUDE.md § Call-time constant resolution), which must then
be added to that section's list.

## Acceptance criteria

- The five Rails-named members live on `encryption/encryptable-record.ts` and
  are reached from there; `encryption-hooks.ts` is deleted or reduced to a
  listed slot.
- No `@noRailsEquivalent PERMANENT` receipt remains on any of the six names.
- A plain-node import of the built `dist/` entry modules shows no TDZ.
