---
title: "Table#checkConstraintExists' overload rejects the positional args Rails accepts"
status: in-progress
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: 7213
claim: "2026-08-29T17:33:51Z"
assignee: "param-drift-relation-new-alias-scored-as-constructor"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Table#check_constraint_exists?(*args, **options)`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:949`)
forwards `@base.check_constraint_exists?(name, *args, **options)`, so it accepts
positional args — `t.check_constraint_exists?("price > 0")` is legal Ruby.

The TS overload set added by PR #7182 does not:

`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1557`

```ts
async checkConstraintExists(...args: []): Promise<boolean>;
async checkConstraintExists(
  ...args: [...unknown[], { name?: string; expression?: string }]
): Promise<boolean>;
```

The first overload is the empty tuple, so a lone positional (`("price > 0")`)
matches neither overload and is a compile error, even though the implementation
body handles it correctly (it pops a trailing object and forwards the rest).

PR #7202 converged the two siblings Rails gives the same `(*args, **options)`
shape — `Table#foreignKeyExists` and `Table#removeCheckConstraint`
(`schema_definitions.rb:920,938`) — and hit exactly this: the `[]` overload
rejected the single-string call sites in
`schema-definitions.trails.test.ts:831` and
`command-recorder.trails.test.ts:190`, so those two use `...args: string[]`
instead. That leaves the three siblings spelled inconsistently for no Rails
reason.

## Acceptance criteria

- `Table#checkConstraintExists`'s first overload accepts positional args
  (`...args: string[]`, matching the two siblings converged in #7202) so a lone
  positional compiles, as `check_constraint_exists?("price > 0")` does in Ruby.
- All three `Table` wrappers over a Rails `(*args, **options)` method —
  `checkConstraintExists`, `foreignKeyExists`, `removeCheckConstraint` — carry
  the same overload spelling.
- No behaviour change: the implementation bodies already handle every argument
  shape and are not touched.
- `parity:api` methods/arity/params unmoved; `parity:api:calls`,
  `parity:api:calls:args`, `parity:api:extra:gate` gain no row.
