---
title: "PredicateBuilder#resolveColumn is invented — Rails normalizes dotted keys instead"
status: draft
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PredicateBuilder#resolveColumn` (`relation/predicate-builder.ts`) has **no Rails
counterpart** — there is no `resolve_column` anywhere in
`vendor/rails/activerecord/lib/` (verified by grep). It is a trails invention that
splits a `"table.column"` key and resolves the attribute, called from five build
paths in the same class.

Rails never splits a dotted key at attribute-resolution time. It normalizes first:
`convert_dot_notation_to_hash` (`predicate_builder.rb:165-180`) rewrites
`"table.column" => v` into a nested `{ "table" => { "column" => v } }` on the way
into `expand_from_hash`, and the table part then flows through `associated_table`.
Attribute resolution itself is just `table.arel_table[key]`.

PR #4889 removed the **static** `PredicateBuilder.resolveColumn` (unreachable once
the instance method intercepted every dotted key) and pointed the instance
method's dotted branch at `resolveArelAttribute`, so it now lands where Rails
lands. The invented method itself remains.

Prerequisite note: the dotted branch delegates to `resolveArelAttribute`, whose
no-context fallback is the subject of
`predicate-builder-table-is-arel-table-not-tablemetadata` — sequence after that
one to avoid churn.

## Acceptance criteria

- [ ] `resolveColumn` is gone; its five callers read the attribute the way Rails'
      `expand_from_hash` does.
- [ ] Dotted keys are normalized by `convertDotNotationToHash` only
      (`predicate_builder.rb:165-180`), not re-split at resolution time.
- [ ] No test name changes. api:compare / test:compare delta non-negative.
