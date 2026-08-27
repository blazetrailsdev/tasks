---
title: "reload_schema_from_cache dropped Rails' recursive parameter"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `reload_schema_from_cache` takes a `recursive` flag:

```ruby
def reload_schema_from_cache(recursive = true)
  ...
  if recursive
    subclasses.each { |descendant| descendant.send(:reload_schema_from_cache) }
  end
end
```

(`vendor/rails/activerecord/lib/active_record/model_schema.rb:553-571`.)

trails' port
(`packages/activerecord/src/model-schema.ts`, `reloadSchemaFromCache`) dropped
the parameter and always recurses into `subclasses`. No caller can ask for the
scoped reset, so any site needing to clear only its own memos has to inline the
field nil-outs instead.

Surfaced by PR #7117, which hit exactly that: the cold-cache "incomplete load"
branch of `loadSchema` needs to drop only its own `@columns_hash` placeholder —
running the full recursive reset there also cleared `@default_attributes`, which
`_default_attributes` is mid-build of (`attributes.rb:241-252`). That branch now
assigns `this._columnsHash = undefined` directly; with the parameter ported it
could say what it means.

Note the trails port also nils a different field set than Rails' (see the
existing `@noRailsEquivalent CONVERGEABLE` receipt on the
`@attribute_names`/`@column_names` handling in the same file) — that half is
separate and not in scope here.

## Converged shape

`reloadSchemaFromCache(this: SchemaHost, recursive = true)`, with the subclass
walk guarded by the flag, exactly as `model_schema.rb:566-570`. The recursive
call itself passes no argument, so it keeps the default, as Ruby's
`descendant.send(:reload_schema_from_cache)` does.

## Acceptance criteria

- [ ] `reloadSchemaFromCache` takes Rails' `recursive` parameter with its
      `true` default, and the `subclasses` walk is inside `if (recursive)`.
- [ ] `loadSchema`'s cold-cache branch expresses its scoped reset through the
      parameter rather than a hand-inlined field assignment, if that stays the
      right semantics.
- [ ] activerecord suites green on all adapter lanes; parity deltas
      non-negative.
