---
title: "converge-preloader-reflection-scope-arity-and-lazy-memo"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6399
claim: "2026-08-12T03:06:02Z"
assignee: "converge-preloader-reflection-scope-arity-and-lazy-memo"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review on PR #6395 (RFC 0084,
`converge-reshaped-association-order-rows-remainder`).

`Preloader::Branch#preloaders_for_reflection`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/branch.rb:91-105`)
computes `reflection_scope` only for an INSTANCE-DEPENDENT scope:

```ruby
if reflection.scope && reflection.scope.arity != 0
  reflection_scope = reflection.join_scopes(klass.arel_table, klass.predicate_builder, klass, record).inject(&:merge!)
end
```

`packages/activerecord/src/associations/preloader/branch.ts:199` drops the
arity half of that guard and runs `joinScopes` for EVERY scoped reflection, so a
record-independent scope is grouped per record instead of landing in one group.

The guard cannot be added in isolation. Rails leaves `reflection_scope` nil for
an arity-0 scope because `Preloader::Association` recomputes it lazily —
`association.rb:290-292`,
`@reflection_scope ||= reflection.join_scopes(klass.arel_table, klass.predicate_builder, klass).inject(klass.unscoped, &:merge!)`
— and `build_scope` / `associate_records_from_unscoped` then key on
`reflection_scope.empty_scope?` (`association.rb:220,301`). trails'
`preloader/association.ts` has no such memo: it stores the constructor argument
as `this.reflectionScope ?? null` (`:50`), falls back at `:366-371` to calling
the raw `reflection.scope(scope)` lambda rather than `joinScopes`, and its
`associateRecordsFromUnscoped` guard is `this.reflectionScope != null` (`:206`)
where Rails' is `!reflection_scope.empty_scope?`.

Adding only the arity guard on the branch.ts side was measured on PR #6395: 20
failures across `eager.test.ts` (`preloading readonly association`, `preload has
many with association condition and default scope`, `eager with has many through
join model with conditions on top level`, `preloading has many through with
custom scope`, …), `associations.test.ts` and the `preloader/` suites — the
arity-0 reflection scope is silently dropped from the preload query. The two
bodies have to converge together.

Note trails' arity offset: a trails scope lambda takes the relation as its first
parameter where Ruby's takes none (`invokeScopeLambda`,
`associations/association-scope.ts:20-49`), so Ruby `arity != 0` is TS
`scope.length > 1`. The canonical test models confirm it — 167 declarations are
`scope: (q) => …` (Ruby arity 0) and 5 are `scope: (q, record) => …`
(instance-dependent).

## Acceptance criteria

- [ ] `Preloader::Association` grows Rails' lazy `reflectionScope` memo
      (`association.rb:290-292`) and its `buildScope` /
      `associateRecordsFromUnscoped` arms key on the empty-scope predicate as
      Rails does, dropping the raw-lambda fallback at
      `preloader/association.ts:366-371`.
- [ ] `Branch#preloadersForReflection` restores the `arity != 0` half of the
      guard (`branch.rb:95`), spelled `scope.length > 1` with the offset cited
      at the call site.
- [ ] The AR eager/preloader/associations suites pass on all three adapter
      lanes; no new `call-mismatches-exclude` row.
