---
title: "naming-taxonomy-arel-i18n-globalid-classes"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096's `wave-4-naming-arel-i18n-tail` converged 5 of its 13 rows. Of the 8
that survived, 6 are not burndown at all — they are Ruby-idiom classes the
taxonomy in `scripts/api-compare/naming-taxonomy.ts` does not yet recognize, so
they are counted against the burndown total and against `naming-gate-flip`'s
precondition even though no rename can retire them. Measured 2026-08-15 with
`pnpm parity:api:calls:args:report`:

| Row                                                               | Ruby                                              | TS                                  | Class it belongs in                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `arel/visitors/to-sql.ts` `quoteTableName` → `quote_table_name`   | `quote_table_name(name)` (to_sql.rb:874)          | `quoteTableName(toS(name))`         | Ruby implicit `to_s`. `toS` is load-bearing: `to-sql.trails.test.ts` pins Ruby `Array#to_s` rendering (`["a", "b"]`, not `a,b`) for composite-PK names, so dropping it reds three tests. |
| `arel/visitors/to-sql.ts` `quoteColumnName` → `quote_column_name` | to_sql.rb:879                                     | same                                | same                                                                                                                                                                                     |
| `globalid/locator.ts` `unscoped` → `unscoped`                     | `model_class.unscoped { yield }` (locator.rb:223) | `klass.unscoped(block)`             | Ruby block → TS callback argument. The settled trails idiom; no rename applies.                                                                                                          |
| `globalid/locator.ts` `locateManySigned` → `locate_many`          | `...compact` (locator.rb:107)                     | `...filter((sgid) => sgid != null)` | `Array#compact` token rename. The body was converged to Rails' `map`/`compact` chain shape in the wave-4 PR; only the token differs.                                                     |
| `i18n/backend/base.ts` `loadYml`/`loadJson` → `new`               | `e.inspect` (base.rb:269, 285)                    | `inspectError(e)`                   | Ruby `Object#inspect` is a method on every object; JS has no counterpart, so it is a free function.                                                                                      |
| `i18n/backend/base.ts` `loadJson` → `parse`                       | `File.read(filename)` (base.rb:282)               | `readFile(filename)`                | Ruby `File.read` receiver-style vs the fs module function.                                                                                                                               |
| `i18n/backend/flatten.ts` `resolveLink` → `store_link`            | `key.gsub(*link)` (flatten.rb:100)                | `key.replaceAll(link[0], link[1])`  | `String#gsub` → `replaceAll` is a documented token rename in `docs/ruby-ts-conventions.md`.                                                                                              |

Two more of the 13 are already-known shape and are not part of this story.

## Acceptance criteria

- [ ] Each row above is classified into a `naming-taxonomy.ts` class with a
      reason — `no-js-equivalent` / `block-idiom` / `conventions-rename` as the
      table indicates, or a new permanent class where none fits.
- [ ] `pnpm parity:api:calls:args:report` shows the in-scope `burndown` naming
      count fall by 6 and the permanent count rise by 6; no `shape` rows move.
- [ ] No baseline row is added or widened; `naming` stays report-only until
      `naming-gate-flip`.
- [ ] `conventions.test.ts` green (check `SCOPED_SKIP_GROUPS` for overlap before
      adding any global entry).
