---
title: "Relation#isStrictLoading is Rails' strict_loading_value"
status: draft
updated: 2026-08-05
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' `Preloader::Association#cascade_strict_loading` reads the relation's
`strict_loading_value`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb:310-312`):

```ruby
def cascade_strict_loading(scope)
  preload_scope&.strict_loading_value ? scope.strict_loading : scope
end
```

trails spells that reader `isStrictLoading`, so the ported body reads
`this.preloadScope?.isStrictLoading`
(`packages/activerecord/src/associations/preloader/association.ts:369-371`).
The value is read at the right place with the right semantics — only the name
differs — but the wide call-set ratchet flags the missing
`strict_loading_value` call, and PR #6130 had to baseline it:

```text
scripts/api-compare/call-mismatches-wide-exclude/activerecord/associations/preloader/association.json
  cascade_strict_loading -> strict_loading_value
```

The reader lives on `Relation`, not on the preloader, which is why #6130 did
not converge it in place — the rename is a `Relation`-surface change with its
own call-site sweep.

`strict_loading_value` is a plain Rails attribute reader returning a value, not
a predicate: per `docs/ruby-ts-conventions.md` it should be `strictLoadingValue`,
not `isStrictLoading`. The `is` prefix is reserved for Ruby `?` predicates.

## Converged shape

Rename the `Relation` reader `isStrictLoading` → `strictLoadingValue`, sweep
every call site, and delete the baseline row above (the wide baseline only
shrinks — remove the one row by hand, do not `--write`).

## Acceptance criteria

- `Relation#strictLoadingValue` is the reader's name; `isStrictLoading` is gone
  (not aliased — an alias is new extra surface).
- `cascadeStrictLoading` reads it, and the
  `cascade_strict_loading -> strict_loading_value` row is deleted from
  `call-mismatches-wide-exclude/activerecord/associations/preloader/association.json`.
- `pnpm parity:api:extra --package activerecord` does not gain a row.
- `pnpm typecheck`, `pnpm lint`, and the preloader / strict-loading suites pass.
