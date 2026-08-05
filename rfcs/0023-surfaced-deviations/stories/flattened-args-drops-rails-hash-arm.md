---
title: "flattened-args-drops-rails-hash-arm"
status: draft
updated: 2026-08-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm codegen:score` scores `active_record/relation/query_methods.rb ::
flattenedArgs` as divergent; the `conformance-triage-burndown` triage verified it
as a real deviation.

Rails (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2077-2079`):

```ruby
def flattened_args(args)
  args.flat_map { |e| (e.is_a?(Hash) || e.is_a?(Array)) ? flattened_args(e.to_a) : e }
end
```

trails (`packages/activerecord/src/relation/query-methods.ts:1580-1585`) drops
the Hash arm entirely:

```ts
export function flattenedArgs(args: unknown[]): unknown[] {
  return args.flatMap((e) => (Array.isArray(e) ? flattenedArgs(e) : e));
}
```

The call-site comment justifies the omission ("hashes pass through untouched so
`with({ cte: rel })` keeps its definition hash intact"), which is a ratification,
not a convergence: Rails flattens a Hash to its `to_a` pairs here, and every
caller of `flattened_args` sees pairs where trails sees the object.

## Acceptance criteria

- `flattenedArgs` ports both arms of Rails' predicate, recursing through the
  `to_a` pair form for plain objects.
- Whatever `with({ cte: … })` actually needs is handled where Rails handles it,
  not by dropping the arm here — check the Rails callers before changing shape.
- The `…query_methods.rb::flattenedArgs::divergent` baseline row is deleted.
