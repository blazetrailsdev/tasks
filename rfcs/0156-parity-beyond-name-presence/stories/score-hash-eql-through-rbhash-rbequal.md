---
title: "score-hash-eql-through-rbhash-rbequal"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`hash` / `eql?` are skipped in `scripts/parity/conventions.ts` (their own `SKIP_GROUPS` entry, decided in CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). The 83 `hash` / 64 `eql?` TS members are live: `rbHash` (`packages/ruby-compat/src/rb-hash.ts:51`) and `rbEqual` (`packages/ruby-compat/src/rb-equal.ts:86`) dispatch to them, as do `deduplicate` (`packages/activerecord/src/connection-adapters/deduplicable.ts:29`) and the preloader batch grouping (`associations/preloader/batch.ts:104`). Rails defines 47 `hash` / 45 `eql?` across arel, activemodel, activerecord, activesupport.

## Acceptance criteria

- `hash` and `eql?` leave `SKIP_GROUPS` and are scored by name like any ported method (`hash` → `hash`, `eql?` → `eql`).
- The newly-missing rows are listed in the PR body; the parity totals move accordingly.
- A TS `hash`/`eql` with no Rails counterpart in its file surfaces in `parity:api:extra`.
