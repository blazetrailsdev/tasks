---
title: "Stale @noRailsEquivalent on NullConfig makes pnpm api:extra exit 1"
status: draft
updated: 2026-07-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:extra` exits 1 on `main`:

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) on methods that no longer flag
as extra surface ...
  - activerecord  connection-adapters/abstract/connection-pool.ts  NullConfig
```

The tag is at
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:62`
("Rails nests this class inside `NullPool` (`class NullPool; class
NullConfig`"). It went stale when #5458 ("let a nested Ruby class feed its
file's extra-surface allow-set") made the nested Ruby class feed the allow-set,
so `NullConfig` no longer counts as extra surface and the tag has nothing left
to suppress. #5462 ("honor @noRailsEquivalent on class declarations") is what
made the tag visible to the staleness check in the first place.

Reproduced on a clean rebuild with `rm -rf scripts/api-compare/output/ts-api-cache
&& pnpm api:compare && pnpm api:extra`.

NOT a CI gate — `.github/workflows/ci.yml` invokes no `api:extra`, and main is
green with the tag present — so this only breaks the local fidelity-tooling
workflow. Filed so the tool stops exiting 1 for everyone who runs it.

## Acceptance criteria

- [ ] `pnpm api:extra` exits 0 on a clean rebuild of `main`.
- [ ] The stale `@noRailsEquivalent` tag on `NullConfig` is deleted (or, if it
      is still load-bearing, the staleness check is corrected and the reason
      recorded).
