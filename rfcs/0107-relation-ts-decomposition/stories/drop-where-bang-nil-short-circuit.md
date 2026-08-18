---
title: "Drop whereBang's nil short-circuit — where! has no guard"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6681
claim: "2026-08-18T00:47:59Z"
assignee: "converge-date-time-receiver-threaded-call-args"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while moving the where family into `relation/query-methods.ts`
(PR #6677), which moved `whereBang` alongside its `where` caller but did not
touch its body.

`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1043-1046`:

```ruby
def where!(opts, *rest) # :nodoc:
  self.where_clause += build_where_clause(opts, rest)
  self
end
```

Three lines, no guard. trails' `whereBang`
(`packages/activerecord/src/relation/query-methods.ts`, immediately after
`where`) opens with a nil short-circuit Rails does not have:

```ts
function whereBang(this: QueryMethodsHost, opts: any, ...rest: unknown[]): any {
  if (opts == null) return this;
  ...
}
```

Rails puts the blank handling in `where` (`:1036`,
`args.length == 1 && args.first.blank?`), NOT in `where!` — which is exactly
what trails' `where` also does (`isBlankArgument`). So the guard is dead for
every call arriving through `where`, and live only for a direct `whereBang`
call, where it silently no-ops what Rails would route into
`build_where_clause` (which raises `ArgumentError` on an unsupported argument
type).

## Converged shape

Delete the `opts == null` line so `whereBang` is `build_where_clause` +
`where_clause +=` + `return this`, matching `:1043-1046` exactly.

Check `whereBang`'s direct callers before deleting — the internal call sites
that reach it without going through `where` are the ones whose behavior the
guard is currently masking; any that genuinely pass `null` should stop doing so
rather than have the guard preserved.

## Acceptance criteria

- `whereBang`'s body is the three-line `query_methods.rb:1043-1046` port.
- No direct caller passes `null`/`undefined` to it.
- `relation/where.test.ts`, `where-chain.test.ts`, `composite-where.test.ts`,
  `merging.test.ts`, `relations.test.ts` pass.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
