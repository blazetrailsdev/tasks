---
title: "delete-object-inspect-reexport-shim-and-repoint-callers"
status: done
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7424
claim: "2026-09-03T00:39:30Z"
assignee: "consolidate-kernel-integer-and-float-conversions"
blocked-by: null
closed-reason: null
---

## Context

PR #7403 moved `Object#inspect` / `Object#to_s` to
`packages/ruby-compat/src/object.ts` as `rbInspect` (`vendor/ruby/object.c:704`
`rb_inspect`) and `rbObjAsString` (`vendor/ruby/string.c:1653`
`rb_obj_as_string`), and left
`packages/activesupport/src/core-ext/object/inspect.ts` behind as a re-export
shim so activesupport's public surface stayed unchanged.

That shim is the **fourth** instance of the failure mode
`third-round-ruby-compat-reexport-shim-sweep` diagnoses: a `move-*` story
writing its shim deletion into a successor. It is filed separately from the
three sweep stories because the call-site inventory is much larger than theirs
and is already known — 22 files, all in packages that ALREADY depend on
`@blazetrails/ruby-compat`, so no `package.json` change is needed.

In-package (import from `./core-ext/object/inspect.js`):
`activesupport/src/array-utils.ts:10` (both), `duration.ts:13`,
`duration/iso8601-parser.ts:3`, `xml-mini.ts:9`, plus the public re-export at
`activesupport/src/index.ts:755`.

Cross-package (import from `"@blazetrails/activesupport"`), 17 files:
`actionpack/src/action-controller/metal/implicit-render.ts:9`;
`activemodel/src/type/date-time.ts:13`, `type/date-time.test.ts:3`,
`type/value.ts:1`; `activerecord/src/attribute-inspection.ts:1`,
`connection-adapters/{mysql,postgresql,sqlite3}/quoting.ts`,
`connection-adapters/sqlite3/schema-statements.ts:2`,
`relation/predicate-builder.ts:2`,
`relation/predicate-builder/{basic-object-handler,range-handler}.ts`,
`type-caster/connection.ts:2`, `type-caster/map.ts:2`;
`arel/src/test-helpers/default-quoter.ts:3`;
`rack-session/src/abstract/id.ts:1`.

## Converged shape

Import from `@blazetrails/ruby-compat` **under a local alias that keeps the call
site's spelling**:

```ts
import { rbInspect as inspect } from "@blazetrails/ruby-compat";
```

The alias is not cosmetic. `parity:api:calls` matches TS call names against the
Ruby call names in the body it mirrors, and the Ruby is `x.inspect` / `x.to_s`.
Renaming the call sites to `rbInspect(x)` would stop those matching and open new
call-mismatch rows across `activesupport`, `actionpack`, `activemodel`,
`activerecord` and `arel`. Two call sites already carry
`@missingRailsArgs inspect — PERMANENT` receipts naming the free-function shape
(`activesupport/src/duration/iso8601-parser.ts`,
`actionpack/src/action-controller/metal/implicit-render.ts`); those stay accurate
under the alias and would need rewording without it.

## Acceptance criteria

- [ ] All 22 call sites import from `@blazetrails/ruby-compat` directly, under
      the `rbInspect as inspect` / `rbObjAsString as toS` aliases.
- [ ] `packages/activesupport/src/core-ext/object/inspect.ts` is deleted, and
      the `export { inspect, toS }` line at `activesupport/src/index.ts:755`
      goes with it.
- [ ] `packages/activesupport/src/core-ext/object/blank.ts` is untouched — it
      mirrors a real Rails file (`activesupport/lib/active_support/core_ext/object/blank.rb`)
      and is measured by `parity:api` today.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` green; `parity:api:calls`,
      `:args`, `parity:api:extra:gate` and `parity:api:params` show no new rows.
