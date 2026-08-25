---
title: "hwia-symbol-key-normalization"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4517
claim: "2026-07-03T21:55:08Z"
assignee: "hwia-symbol-key-normalization"
blocked-by: null
---

## Context

`packages/activerecord/src/test-helpers/fixtures/admin/users.ts` stores the Jamis fixture's settings as `{ ":symbol": "symbol", string: "string" }` — with a leading-colon key — because our JS-YAML fixture parser produces `":symbol"` for the Ruby-symbol YAML key `:symbol`.

Rails side: `admin/users.yml` has `settings: { :symbol: symbol, string: string }`. Ruby YAML loads `:symbol` as the Ruby Symbol `:symbol`; `ActiveSupport::HashWithIndifferentAccess` then normalizes it to the plain string `"symbol"` via `Symbol#to_s`. So Rails' runtime HWIA key is `"symbol"`, but our HWIA key is `":symbol"`.

The test at `packages/activerecord/src/store.test.ts` ("convert store attributes from Hash to HashWithIndifferentAccess…") asserts `get(":symbol")` rather than `get("symbol")` to match our actual runtime behaviour.

Relevant files:

- `vendor/rails/activerecord/test/fixtures/admin/users.yml:7` — `:symbol: symbol`
- `packages/activerecord/src/test-helpers/fixtures/admin/users.ts:12` — `{ ":symbol": "symbol", … }`
- `packages/activerecord/src/store.test.ts:255` — `get(":symbol")`
- `packages/activerecord/src/activesupport` HWIA — does not normalize colon-prefixed string keys

## Acceptance criteria

- [ ] The fixture loader (or HWIA constructor) normalizes YAML-symbol-style keys (`":foo"` → `"foo"`) the same way Ruby HWIA normalizes `:foo` → `"foo"` via `Symbol#to_s`
- [ ] `admin/users.ts` fixture key updated to `"symbol"` (no colon)
- [ ] `store.test.ts` "convert store attributes from Hash to HashWithIndifferentAccess…" updated to assert `get("symbol")`
- [ ] `scripts/fixtures-compare/compare.ts` updated so the comparison gate treats `":symbol"` (Rails YAML-parsed) and `"symbol"` (TS normalized) as equivalent, or normalizes both sides
- [ ] Fixture-compare CI gate remains green (`match>=133`)
