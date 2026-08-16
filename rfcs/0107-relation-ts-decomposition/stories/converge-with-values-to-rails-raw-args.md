---
title: "converge-with-values-to-rails-raw-args"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6607
claim: "2026-08-16T20:17:36Z"
assignee: "converge-query-method-stores-with-values-and-references"
blocked-by: null
closed-reason: null
---

## Context

Rails stores `with_values` as the **raw args** — a flat list of one-key hashes
`{name => value}` — and resolves them to Arel only at build time:

```ruby
def with!(*args) # :nodoc:
  args = process_with_args(args)
  self.with_values |= args
  self
end

def process_with_args(args)
  args.flat_map do |arg|
    raise ArgumentError, "Unsupported argument type: #{arg} #{arg.class}" unless arg.is_a?(Hash)
    arg.map { |k, v| { k => v } }
  end
end
```

(`query_methods.rb:500-504`, `:2254-2259`)

```ruby
def build_with(arel)
  return if with_values.empty?
  with_statements = with_values.map { |with_value| build_with_value_from_hash(with_value) }
  @with_is_recursive ? arel.with(:recursive, with_statements) : arel.with(with_statements)
end
```

(`query_methods.rb:1913-1921`)

Note also that recursion is a single relation-level flag, `@with_is_recursive`,
not a per-entry one.

trails instead resolves eagerly in `with!` and stores
`{ name: string, expression: Nodes.Node, recursive: boolean }`
(`packages/activerecord/src/relation/query-methods.ts`, `withBang` /
`resolveCteEntry` / `upsertCte`).

That divergence became load-bearing in PR #6602, which converged `Merger#merge`
onto Rails' generic `NORMAL_VALUES` loop (`merger.rb:57-66`). The loop does
`relation.with!(*with_values)` — which round-trips cleanly in Rails because
`with_values` holds the same shape `with!` accepts, but in trails feeds
already-resolved entries back into a method that expects user hashes. #6602
handled it with a duck-type check, `isCteEntry`, that distinguishes a
fed-back entry from a user hash purely by shape.

A reviewer flagged the residual ambiguity: a user hash whose keys are literally
`name` / `expression` / `recursive`, with an Arel node under `expression` and a
boolean under `recursive`, is misclassified as a round-tripped entry rather than
three CTE definitions. It is contrived (before #6602 that hash raised
`ArgumentError` from `resolveCteEntry`, since a boolean is neither a string nor
a `toSql`-responder), but Rails has no such ambiguity at all, and the only
tag-free way to remove it is to converge the storage shape.

## Acceptance criteria

- `with_values` holds Rails' raw one-key hashes, resolved at `build_with` time
  (`query_methods.rb:1913-1927`), not eagerly in `with!`.
- `with!` is `process_with_args` + `self.with_values |= args`
  (`query_methods.rb:500-504`), and `process_with_args` mirrors `:2254-2259`
  including its `ArgumentError` message.
- Recursion is the relation-level `@with_is_recursive` flag Rails uses, not a
  per-entry `recursive` boolean.
- `isCteEntry` (`relation/query-methods.ts`) is deleted — the Merger loop's
  `with` step round-trips without a shape check.
- `upsertCte`'s last-write-wins-by-name is replaced by Rails' `|=` union
  (already partly corrected in #6602; `merging.test.ts:538` pins it).
- `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative; green on SQLite, PostgreSQL and MySQL/MariaDB.
