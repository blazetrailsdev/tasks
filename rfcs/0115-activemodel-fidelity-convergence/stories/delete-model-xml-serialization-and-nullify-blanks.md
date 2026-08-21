---
title: "Delete model.ts's XML serialization and nullify_blanks invented surface"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6813
claim: "2026-08-20T22:18:55Z"
assignee: "delete-model-xml-serialization-and-nullify-blanks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/model.ts` carries three clusters with **no Rails
counterpart anywhere** — not in `activemodel/lib`, not in `activerecord/lib`,
not in `activesupport/lib`:

- `toXml` (`model.ts:2519`, 14 code lines), `_hashToXml` (`:2538`, 22 lines)
  and the module-level `_xmlTypeInfo` (`:210`, 44 lines). Rails removed XML
  serialization from ActiveModel in 4.2 — it lives in the external
  `activemodel-serializers-xml` gem. There is no
  `vendor/rails/activemodel/lib/active_model/serializers/xml.rb`
  (`ls vendor/rails/activemodel/lib/active_model/serializers/` → `json.rb`
  only).
- `nullifyBlanks` (`:532`, 16 lines) and `_applyNullifyBlanks` (`:1828`,
  10 lines). `grep -rn "def nullify_blanks" vendor/rails` returns nothing.
- `withOptions` (`:562`, 6 lines). Rails' `with_options` is
  `activesupport/lib/active_support/core_ext/object/with_options.rb:92`, an
  `Object` core-ext, and trails already ports it at
  `packages/activesupport/src/core-ext/object/with-options.ts`. The `Model`
  static is a second spelling.

Together ~112 code lines / ~230 raw lines of `model.ts`, and `nullifyBlanks`
and `toXml` are two of `model.ts`'s 20 `novel` names in
`pnpm parity:api:extra --package activemodel`.

This is the smallest Phase 1 story deliberately: it removes surface rather than
relocating it, so it lands without touching any other file's definitions.

## Acceptance criteria

- `toXml`, `_hashToXml`, `_xmlTypeInfo`, `nullifyBlanks`, `_applyNullifyBlanks`
  and the `withOptions` static are gone from `model.ts`.
- Any caller of `withOptions` uses the `@blazetrails/activesupport` core-ext.
- Tests that exercised the deleted surface are deleted with it. Do **not**
  rename or reword any surviving test (CLAUDE.md).
- `pnpm parity:api:extra --package activemodel` loses at least the
  `toXml` and `nullifyBlanks` novel rows; `model.ts` novel count drops.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `:args` clean with no reseed. Any stranded row in
  `scripts/api-compare/call-mismatches-exclude/activemodel/model.json` is
  hand-deleted, then `pnpm parity:api:calls:tighten activemodel/model.json`.

## Verification

```bash
pnpm vitest run packages/activemodel/src/model.test.ts packages/activemodel/src/serialization.test.ts
pnpm parity:api:extra --package activemodel
pnpm parity:api:calls && pnpm parity:api:calls:args
```
