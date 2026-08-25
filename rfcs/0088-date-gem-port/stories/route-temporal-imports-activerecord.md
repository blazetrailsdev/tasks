---
title: "route-temporal-imports-activerecord"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["move-date-time-to-date-package"]
deps-rfc: []
est-loc: 300
pr: 6150
claim: "2026-08-06T01:53:06Z"
assignee: "route-temporal-imports-activerecord"
blocked-by: null
closed-reason: null
---

## Context

**Integration slice 2 of the "Temporal comes from `packages/date`" flip.**
Non-overlapping with `route-temporal-imports-activemodel-arel`; the two can run
in parallel.

`packages/activerecord` is the largest consumer by far: **130 files (64
non-test)** import `Temporal` from `@blazetrails/activesupport/temporal`. After
RFC 0088 the substrate belongs to `packages/date`, and activerecord should say so
directly — in Rails, `active_record` files that need temporal types get them from
the `date` gem, not through ActiveSupport.

## Acceptance criteria

- [ ] Every `@blazetrails/activesupport/temporal` import in
      `packages/activerecord` becomes `@blazetrails/date`.
- [ ] `packages/activerecord/package.json` declares `@blazetrails/date`.
- [ ] **No `instanceof` regressions** — the quoting guards at
      `connection-adapters/abstract/quoting.ts:155-158,162,219` and the
      sqlite3/mysql/pg quoting files identify Temporal values by `instanceof`, so
      a second polyfill instance would make them fall through to
      `throw new TypeError("can't quote …")`. Verify on all three adapter lanes,
      not just SQLite.
- [ ] **Grep for the specifier as a string literal, not just as an import.**
      Some code embeds `"@blazetrails/activesupport/temporal"` inside a string —
      generated-code templates and their expected-output fixtures do this — and
      `tsc` cannot see it, so a rename that looks complete will still be wrong.
      `grep -rn '@blazetrails/activesupport/temporal' --include=*.ts` (no import
      filter) and fix every hit. At time of writing this includes
      `type-virtualization/type-registry.ts:28` and its `fixtures/*/expected.ts`;
      that generator is slated for removal, so check what still exists when you
      claim this rather than assuming either way.
- [ ] Mechanical only: no behavior change. Note it in the PR body.
- [ ] **Likely near the LOC ceiling** — if over, split by subtree
      (connection-adapters / types / everything else) rather than shipping one
      oversized PR.
- [ ] `pnpm typecheck` green; AR suites pass on sqlite3, pg and mysql.
