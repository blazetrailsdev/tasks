---
title: "Nested joins hash KEYS still use the bare spelling where Rails has Symbols"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6720
claim: "2026-08-18T20:31:56Z"
assignee: "wave-4c-ar-core-residue-attributes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6711
(`retire-relation-is-named-join-value-discriminator`), which deleted
`Relation#_isNamedJoinValue` and moved the join-value Symbol/String
discrimination onto the leading-colon spelling.

`sweep-joins-call-sites-onto-the-colon-symbol-spelling` (#6704) and #6711
together colonized the _scalar_ and _value_ positions of every `joins` /
`leftJoins` / `leftOuterJoins` argument. The **hash keys** were left bare:

```ts
Author.leftJoins({ posts: ":comments" }); // key still bare
Post.joins({ comments: ":post" });
Post.leftJoins({ comments: ":post" }).first(10);
```

In Ruby both halves are Symbols — `joins(posts: :comments)` — and
`JoinDependency#walk_tree` keys the tree by `associations.to_sym`
(`activerecord/lib/active_record/associations/join_dependency.rb:55-56`), so
the key is an association name exactly as the value is.

This is currently harmless: `join-dependency.ts:933,952` strips a leading colon
where it resolves a spec, and a bare key resolves identically. But it leaves the
convention half-applied — the same string position is spelled two different ways
in the same literal — and a reader cannot tell from the call site whether a key
is a Symbol (association) or a String (raw). That is precisely the ambiguity the
colon convention exists to remove, and the one #6711 removed everywhere else.

Note `selectAssociationList` (`query_methods.rb:1810-1823`) accepts a Hash
wholesale via `isPlainObject`, so the keys never reach the Symbol test; the
discrimination happens inside `walk_tree`. Any change here must keep the bare
spelling working, since `where` hash keys are genuinely table-name Strings in
Rails and share the same literal syntax.

## Converged shape

- Sweep nested join-spec hash **keys** onto the colon spelling:
  `joins({ ":comments": ":post" })`, matching the existing
  `symbol-association-join-spec.trails.test.ts` cases.
- Keep `walk_tree`'s colon-stripping as the resolution point; do not add a
  second normalization layer.
- Leave `where` hash keys alone — those are `reflection.table_name` Strings in
  Rails (`query_methods.rb:99`, `:133`) except in the `class_name:` branch,
  which #6711 already colonized.

## Acceptance criteria

- [ ] Nested join-spec hash keys use the colon spelling at every call site in
      `packages/activerecord/src` (source and tests).
- [ ] Generated SQL is unchanged on sqlite/PG/MySQL.
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
