---
title: "resolveValue treats a bare string as a method reference; Rails returns it literally"
status: draft
updated: 2026-08-17
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`resolveValue` treats a **bare** (non-colon-prefixed) string as a method
reference whenever the record responds to it. Rails does not.

`vendor/rails/activemodel/lib/active_model/validations/resolve_value.rb:6-23`:

```ruby
case value
when Proc   then value.arity == 0 ? value.call : value.call(record)
when Symbol then record.send(value)
else
  value.respond_to?(:call) ? value.call(record) : value
end
```

A Ruby `String` falls to the `else` arm, does not respond to `:call`, and is
returned **literally**. Only a `Symbol` is sent to the record.

PR #6632 established the colon-prefixed Symbol spelling in this file
(`packages/activemodel/src/validations/resolve-value.ts:28-39`) and made that
arm raise `NoMethodError` unguarded, matching `resolve_value.rb:14-15`. The
bare-string arm at `resolve-value.ts:40-43` was deliberately left alone in that
PR because other validators' existing tests pass bare strings as method names,
and converging it there would have been out of scope.

That arm is the remaining deviation: `{ minimum: "minLength" }` calls
`record.minLength()` in trails, where Rails would compare the length against
the _string_ `"minLength"`.

## Converged shape

Delete the bare-string branch so `resolveValue` is exactly the three Rails
arms: Proc-by-arity, colon-prefixed Symbol via unguarded send, else literal.

Callers that rely on the bare-string spelling must move to `":name"`. Sweep
first — `packages/activemodel/src/validations/{comparison,numericality,format,length}.ts`
and their tests are the population; `grep -rn "resolveValue" packages/activemodel/src`
finds the call sites.

## Acceptance criteria

- `resolve-value.ts` has no bare-string method-reference branch; a non-colon
  string is returned literally, per `resolve_value.rb:16-21`.
- Every in-repo caller/test that named a method with a bare string uses the
  `":name"` spelling instead.
- `pnpm parity:test` and `pnpm parity:api` deltas non-negative; activemodel
  suite green.
