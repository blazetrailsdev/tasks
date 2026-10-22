---
title: "Inline rbBuiltinClassName / rbClassOf / rbAbsintSize / isStruct into msgpack's packer, their only caller"
status: in-progress
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9252
claim: "2026-10-22T21:01:45Z"
assignee: "call-args-drops-visibility-boolean-argument"
blocked-by: null
---

## Context

These four exports have one importer, `packages/msgpack/src/packer.ts`
(8, 4, 1 and 1 calls).

## Acceptance criteria

- [ ] Only the arms the packer reaches are inlined, as module-private functions in `packer.ts`.
- [ ] The exports are deleted from ruby-compat. Their tests move with them or are deleted if they only covered unreached arms.
- [ ] `pnpm parity:api:extra:gate` is green, and the ruby-compat mark is tightened if it moved.
