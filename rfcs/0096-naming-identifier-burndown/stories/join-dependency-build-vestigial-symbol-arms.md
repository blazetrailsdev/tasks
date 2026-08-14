---
title: "Drop the vestigial JS-Symbol arms in JoinDependency#build and inspectArelValue"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6493
claim: "2026-08-13T20:57:11Z"
assignee: "converge-hash-to-message-construction-order"
blocked-by: null
closed-reason: null
---

## Context

PR #6478 converged `JoinDependency.walkTree` to the colon-string Ruby Symbol
model, so the join tree it builds no longer has JS `Symbol` keys. Two
now-vestigial JS-Symbol readers survive downstream:

- `packages/activerecord/src/associations/join-dependency.ts:391` —
  `const name = typeof key === "symbol" ? (key.description ?? String(key)) : String(key);`
  inside `build`. Rails' `build` is
  `activerecord/lib/active_record/associations/join_dependency.rb:228-240`
  (`associations.map do |name, right| ... find_reflection base_klass, name`) —
  it just passes the key to `find_reflection`, with no type unwrapping.
- `packages/activerecord/src/relation/ruby-inspect.ts:84` —
  `if (typeof value === "symbol") return value.description ?? value.toString();`
  A Ruby Symbol already renders through `inspect` with its colon, which is
  exactly why the colon-string model was chosen.

## Converged shape

`build` reads `String(key)` (Rails passes the key through untouched), and the
tree hash types drop `PropertyKey` for `string`. `inspectArelValue` renders a
colon-string as-is rather than unwrapping a JS `Symbol`.

## Acceptance criteria

- [ ] No JS `Symbol` arm remains in `join-dependency.ts` or `ruby-inspect.ts`.
- [ ] `ruby-inspect.test.ts:82` covers `":name"` instead of `Symbol("name")`.
- [ ] `associations/**` and `relation/**` pass on all three adapters.
