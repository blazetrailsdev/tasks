---
title: "except/only go through relation_with values.except/slice instead of a per-key reset"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6571
claim: "2026-08-15T17:45:08Z"
assignee: "except-only-go-through-relation-with-values"
blocked-by: null
closed-reason: null
---

# `except`/`only` reset value keys instead of `relation_with values.except/slice`

## Context

`vendor/rails/activerecord/lib/active_record/relation/spawn_methods.rb:59-73`:

```ruby
def except(*skips)
  relation_with values.except(*skips)
end

def only(*onlies)
  relation_with values.slice(*onlies)
end

private
  def relation_with(values)
    result = spawn
    result.instance_variable_set(:@values, values)
    result
  end
```

`packages/activerecord/src/relation.ts`'s `except`/`only` instead `_clone()` and
call a trails-only private `_resetExceptValue(rel, key)` per key — for `except`
the named keys, for `only` the complement of `EXCEPT_ONLY_KEYS`. `relationWith`
exists in `relation/spawn-methods.ts` but has no writable `@values` to hand it:
`Relation#values()` (relation.ts) builds a fresh read-only snapshot object out of
~24 typed fields, so a `values`-hash round trip cannot be spelled.

This is what keeps three `kind: "set"` rows alive in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
(`except`/`relation_with`, `only`/`relation_with`, `only`/`slice`), each now
carrying a verified per-site reason from PR #6566 — a burndown ledger row, not a
settled decision.

## Converged shape

Give `Relation` a real `@values` hash the readers project from (or a
`setValues`-style writable counterpart to `values()`), so `except`/`only` read:

```ts
except(...skips) { return relationWith(this, except(this.values(), ...skips)); }
only(...onlies) { return relationWith(this, slice(this.values(), ...onlies)); }
```

and `_resetExceptValue` disappears. This is the same gap `valuesForQueries`
(relation.rb:1286) already reads around, so scope the story to whether the
projection can be made bidirectional before committing to the field rewrite —
if it cannot, `pnpm tasks block` it with the specific blocker rather than
re-justifying the ledger rows.

## Acceptance criteria

- [ ] `except`/`only` are the two Rails one-liners over `relation_with`.
- [ ] `_resetExceptValue` is gone (no trails-only per-key reset switch).
- [ ] The three `relation.json` rows above are deleted by hand via
      `serializeBaseline`, then `pnpm parity:api:calls:tighten
activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PG, MySQL/MariaDB green.
