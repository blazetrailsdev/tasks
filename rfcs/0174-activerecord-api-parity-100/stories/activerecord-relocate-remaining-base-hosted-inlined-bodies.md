---
title: "activerecord: move the remaining module bodies inlined into base.ts (token_for, readonly_attributes, nested_attributes, …)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports **128** "inlined module bodies" — a Ruby
module member whose TS body sits on an including class's file instead of the file mirroring the module
(the mirror image of `moved`). It is report-only today, so nothing stops it growing; CLAUDE.md
§ "Decomposition" and § "Module mixins" require the body in the module's file, reached through
`include()` / `this`-typed functions. This story takes 15:

- `token_for.rb` → `base.ts#generatedTokenVerifier`, `base.ts#tokenDefinitions`
- `readonly_attributes.rb` → `base.ts#_attrReadonly`, `base.ts#is_attrReadonly`
- `nested_attributes.rb` → `base.ts#isNestedAttributesOptions`, `base.ts#nestedAttributesOptions`
- `inheritance.rb` → `base.ts#_abstractClass`, `base.ts#new`
- `encryption/encryptable_record.rb` → `base.ts#encryptedAttributes`, `base.ts#isEncryptedAttributes`
- `attribute_methods.rb` → `base.ts#methodMissing`, `base.ts#respondToMissing`
- `timestamp.rb` → `base.ts#recordTimestamps`
- `locking/optimistic.rb` → `base.ts#_lockingColumn`
- `autosave_association.rb` → `base.ts#destroyedByAssociation`

## Acceptance criteria

- [ ] Each body lives in the TS file mirroring its `.rb`, and the host reaches it through `include()` / `Included<>` or a `this`-typed function assigned to the class — no delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` lists none of these `inlined-from` rows; activerecord stays rowless on `parity:api:extra:gate`.
- [ ] `pnpm lint --fix` (`rails-file-structure-method-order`) leaves the moved members in Rails source order.
- [ ] No behaviour change: the touched model/relation/adapter test files are green on SQLite (and PG/MySQL for adapter files).
