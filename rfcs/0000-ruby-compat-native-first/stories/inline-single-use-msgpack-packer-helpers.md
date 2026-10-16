---
title: "Inline rbBuiltinClassName / rbClassOf / rbAbsintSize / isStruct into msgpack's packer, their only caller"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

These four exports have one importer, `packages/msgpack/src/packer.ts`
(8, 4, 1 and 1 calls).

## Acceptance criteria

- [ ] Only the arms the packer reaches are inlined, as module-private functions in `packer.ts`.
- [ ] The exports are deleted from ruby-compat. Their tests move with them or are deleted if they only covered unreached arms.
- [ ] `pnpm parity:api:extra:gate` is green, and the ruby-compat mark is tightened if it moved.
