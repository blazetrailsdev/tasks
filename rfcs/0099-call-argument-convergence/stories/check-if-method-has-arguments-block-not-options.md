---
title: "Converge checkIfMethodHasArgumentsBang to Rails' block instead of an invented options hash"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6358
claim: "2026-08-11T13:36:12Z"
assignee: "naming-burndown-arel-to-sql"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `call-args-tool-resolve-ruby-callee` (PR #6349). With
`__callee__` now resolved, three `check_if_method_has_arguments!` call sites still
flag on the argument gate, and they are bucket-(a) genuine divergence, not
comparator noise:

- `relation.ts:1004` `order` — Rails `(callee, args)` vs trails
  `("order", args, undefined, { orderArgs: true })`
- `relation.ts:1127` `reorder` — same shape
- `relation.ts:1545` `joins` — Rails `(callee, args)` vs trails
  `("joins", args, undefined, { normalize: false })`

Rails (`activerecord/lib/active_record/relation/query_methods.rb:2213`):

```ruby
def check_if_method_has_arguments!(method_name, args, message = nil)
  if args.blank?
    raise ArgumentError, message || "The method .#{method_name}() must contain arguments."
  else
    yield args if block_given?
    args.flatten!
    args.compact_blank!
  end
end
```

The per-caller variation is a **block**, not an options hash —
`query_methods.rb:657` / `753`:

```ruby
check_if_method_has_arguments!(__callee__, args) do
  sanitize_order_arguments(args)
end
```

and `joins` (`query_methods.rb:495`) passes no block at all; its bang variant does
its own flattening. trails instead grew a fourth `options?: { normalize?: boolean;
orderArgs?: boolean }` parameter on `Relation#checkIfMethodHasArgumentsBang`
(`packages/activerecord/src/relation.ts:5520`) whose two flags re-implement the
block arm and suppress the shared `flatten!` / `compact_blank!` — invented surface
carrying control flow Rails expresses at the call site.

## Acceptance criteria

1. `checkIfMethodHasArgumentsBang` takes Rails' three parameters
   (`methodName`, `args`, `message`) plus the Ruby block in the settled trails
   block idiom, and the `options` object with its `normalize` / `orderArgs` flags
   is deleted.
2. `order` / `reorder` pass the `sanitize_order_arguments(args)` block, mirroring
   `query_methods.rb:657` / `753`; the flatten + compact-blank arm runs once, in the
   helper, for every caller.
3. `joins` calls it exactly as Rails does (`query_methods.rb:495`, no block, no
   flags); whatever `normalize: false` was protecting is expressed where Rails
   expresses it — in `joins!` — or the behavioural difference is demonstrated by a
   Rails test.
4. The three `kind: "args"` rows for `check_if_method_has_arguments!` in
   `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` go stale
   and are deleted; `pnpm parity:api:calls:args` green with a strictly lower row
   count.
5. `pnpm parity:api:extra` does not gain a row (the deleted `options` parameter was
   part of an `@internal` surface, so nothing new should appear).
