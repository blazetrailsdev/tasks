---
title: "fixtures-compare: normalize Ruby-symbol row-column keys (naked/yml/trees false DIFF)"
status: draft
updated: 2026-07-04
rfc: "0014-fixtures-adoption"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced by PR #4517 (hwia-symbol-key-normalization). That PR normalized Ruby-symbol YAML keys (`:foo` → `foo`, mirroring `ActiveSupport::HashWithIndifferentAccess#convert_key` / `Symbol#to_s`) but **only for store/serialize hash values**, inside `stableStringify` (`scripts/fixtures-compare/compare.ts` `normalizeSymbolKey`).

The same Ruby-symbol-key pattern also appears at the **row-column level**, which is not normalized. `vendor/rails/activerecord/test/fixtures/naked/yml/trees.yml` has:

```yaml
root:
  :id: 1
  :name: The Root
```

The TS counterpart `packages/activerecord/src/test-helpers/fixtures/naked/yml/trees.ts` correctly stores plain `{ id: 1, name: "The Root" }`.

The compare script reads the raw YAML, so the Rails row keys stay `:id` / `:name`. `canonicalizeRailsRow` (compare.ts) treats `:id` as an unknown column (the real column is `id`, and `:id_id` isn't a column either) and drops it, so the per-attr diff reports `extra-in-ts: root.id` and the file lands as **DIFF** (`attrs: 0/2`, 0%). This is a false positive — the fixture data is faithful; only the compare tool's row-column key handling lacks the `Symbol#to_s` normalization the value-side already has.

`SYMBOL_RE = /^:(\w+)$/` and `normalizeSymbolKey` already exist in compare.ts (compare.ts:353, ~400).

## Acceptance criteria

- [ ] `canonicalizeRailsRow` (or the row-key ingestion path) normalizes `:word`-shaped Rails-YAML row-column keys via `normalizeSymbolKey` before column matching, so `:id`/`:name` map to `id`/`name`.
- [ ] `naked/yml/trees.yml` flips from DIFF to MATCH (`attrs: 2/2`).
- [ ] Add a `canonicalizeRailsRow` unit test in `scripts/fixtures-compare/compare.test.ts` covering a symbol-keyed row column.
- [ ] Fixture-compare CI gate stays green; the `diff` baseline drops by 1 (10 → 9) once trees MATCHes — update `CI_BASELINE.diff` accordingly.

## Notes

Audit (from #4517) confirmed the only `:word`-shaped Rails fixture keys are in `admin/users.yml`, `to_be_linked/users.yml` (store-hash values, already handled), and `naked/yml/trees.yml` (row columns, this story). No quoted literal colon keys exist, so blanket symbol-key normalization at the row level is safe.
