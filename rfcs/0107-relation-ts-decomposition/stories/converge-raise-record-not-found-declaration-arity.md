---
title: "raiseRecordNotFoundExceptionBang's Relation declaration has the wrong arity and parameter names"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6612
claim: "2026-08-16T20:33:34Z"
assignee: "collection-proxy-delegate-query-method-value-readers-to-scope"
blocked-by: null
closed-reason: null
---

## Context

The `Relation<T>` declaration-merge block in
`packages/activerecord/src/relation.ts:5462-5467` declares
`raiseRecordNotFoundExceptionBang` with a parameter list that matches neither
Rails nor the actual implementation:

```ts
raiseRecordNotFoundExceptionBang(
  message?: string,
  modelName?: string,
  primaryKey?: string,
  id?: unknown,
): never;
```

Rails (`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:417`):

```ruby
def raise_record_not_found_exception!(ids = nil, result_size = nil, expected_size = nil, key = primary_key, not_found_ids = nil)
```

and the implementation in
`packages/activerecord/src/relation/finder-methods.ts` is already faithful to
that — `(ids?, resultSize?, expectedSize?, key?, notFoundIds?)`, five
parameters, all with Rails' names and meanings.

So the declaration is wrong on arity (4 vs 5), on every parameter name, and on
every parameter meaning. It is a leftover from an older shape and nothing
caught it because every internal call site casts around it:
`(this as any).raiseRecordNotFoundExceptionBang(ids, records.length, expectedSize)`
in `finder-methods.ts` (`findOne`, `findSome`, `findSomeOrdered`, and the
`performFirstBang`/`performLastBang`/`performTakeBang` family). The `as any`
casts exist _because_ the declaration is wrong — with a correct one they can go.

Surfaced by the review of #6605, which moved `exists`/`include`/`member`/
`usingLimitableReflections` into `finder-methods.ts` and left this declaration
untouched as out of scope.

## Converged shape

Declare the Rails signature:

```ts
raiseRecordNotFoundExceptionBang(
  ids?: unknown,
  resultSize?: number,
  expectedSize?: number,
  key?: string,
  notFoundIds?: unknown[],
): never;
```

then delete the `as any` casts at the call sites, which should then type-check
directly against it.

## Acceptance criteria

- [ ] The `Relation<T>` declaration matches `finder_methods.rb:417` — five
      parameters, Rails' names, matching the implementation in
      `relation/finder-methods.ts`.
- [ ] The `(this as any).raiseRecordNotFoundExceptionBang(...)` casts in
      `relation/finder-methods.ts` are removed and the calls type-check against
      the declaration.
- [ ] Check `scripts/api-compare/arity-exclude.json` for a row covering
      `raise_record_not_found_exception!`; if the fix makes one stale, delete it
      by hand (only-shrink, no reseed).
- [ ] `pnpm parity:api` arity delta non-negative; `pnpm parity:api:calls` /
      `:args` green; `finder.test.ts` and `relation/finder-methods.test.ts`
      pass unchanged (no behavior change — types only).
