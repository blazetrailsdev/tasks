---
title: "WhereChain#associated/#missing key the where hash with a bare string, erasing Rails' Symbol-vs-String discriminator"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6711
claim: "2026-08-18T18:27:43Z"
assignee: "retire-relation-is-named-join-value-discriminator"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while sweeping `joins` call sites onto the colon Symbol spelling
(#6704, `sweep-joins-call-sites-onto-the-colon-symbol-spelling`). That PR
converged the _join_ arguments in `WhereChain#associated` / `#missing`; the
`where` hash **key** in the same two methods was left on the bare spelling and
is a separate, real divergence.

Rails deliberately keys the condition hash with **two different types**:

`activerecord/lib/active_record/relation/query_methods.rb:96-99` (`associated`)

```ruby
if reflection.options[:class_name]
  self.not(association => association_conditions)      # Symbol
else
  self.not(reflection.table_name => association_conditions)  # String
end
```

`activerecord/lib/active_record/relation/query_methods.rb:130-133` (`missing`)
is the same shape against `@scope.where!`.

A **Symbol** key means "this is an association name, resolve it through the
reflection"; a **String** key means "this is a table name, use it literally".
That is precisely the discriminator CLAUDE.md's "Symbols vs strings" rule is
about — Ruby gets it from the type, and trails encodes it as the leading colon.

trails currently passes a bare string in **both** branches
(`packages/activerecord/src/relation/query-methods.ts`, `associated` and
`missing`):

```ts
if (reflection.options.className) {
  this.not({ [association]: associationConditions }); // should be Symbol
} else {
  this.not({ [reflection.tableName]: associationConditions }); // correctly String
}
```

So the two branches are indistinguishable downstream, and the predicate builder
cannot tell an association name from a table name. Today this is masked because
the `class_name:` branch's association name usually also names a real table, but
it diverges as soon as they differ (a `class_name:`-based association whose
name is not its table).

## Converged shape

- `associated` / `missing`: key the `class_name:` branch with the Symbol
  spelling — the colonized caller argument, the same value #6704 now passes to
  `joins!` / `left_outer_joins!` (`isRubySymbol(association) ? association :
":" + association`). Leave the `else` branch a bare String; it is
  `reflection.table_name`, a String in Ruby too.
- Verify the predicate builder / `whereBang` actually honours a colon-prefixed
  key as an association reference and strips the colon where it resolves it —
  `associations/join-dependency.ts:933,952` is the existing precedent for
  stripping. If it does not, that resolution path is the real body of this
  story.

## Acceptance criteria

- [ ] The `class_name:` branch of both `associated` and `missing` passes the
      Symbol (colon) spelling as the `where` key; the `table_name` branch stays
      a plain String.
- [ ] A regression test covers a `class_name:`-based association whose name
      differs from its table name, asserting the generated SQL keys off the
      association rather than a same-named table. It must fail on the
      pre-change baseline.
- [ ] No change to generated SQL for the existing suites on sqlite/PG/MySQL.
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
