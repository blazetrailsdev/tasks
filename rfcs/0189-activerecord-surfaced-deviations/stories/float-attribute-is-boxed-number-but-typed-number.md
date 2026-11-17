---
title: "A float column's value is a boxed Number at runtime but trails-tsc types it number"
status: draft
updated: 2026-11-17
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

At trails 1d8d3725a3, a `float` column's value comes back from a record as a boxed `Number` object (`typeof row.percent === "object"`, `String(row.percent)` is `"90"`, and a view's `<%= %>` prints `90.0`). trails-tsc still types the attribute `number` (`--schema db/statsSync_schema.ts`, `t.float("percent")`). Found in trailmap#151, where `/packages` started printing `90.0%`.

The boxing gives Ruby's `Float#to_s` (`90.0`), which is right for output. The type is wrong:

- `row.percent === 90` is `false`, and `typeof` checks fail;

- nothing at compile time warns about either.

Rails: `ActiveModel::Type::Float#cast_value` (`activemodel/lib/active_model/type/float.rb`) returns a Ruby `Float`, which is one type. JS has no float primitive, so the boxing is language-forced. The declared type must say so.

## Converged shape

trails-tsc types a `float` attribute as the boxed type the cast returns (or a branded `Float` from ruby-compat that is `Number`-like), so `===` against a primitive is a type error, and callers unbox explicitly (`Number(x)`, `+x`).

## Acceptance criteria

- A model with a `float` column has the attribute typed as the boxed/branded type, and a test pins it.

- `typeof`/`===` comparisons against the attribute are type errors, or the cast returns a primitive and `to_s` formatting happens elsewhere. Pick one and cite `float.rb`.
