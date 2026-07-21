---
title: "arel-select-manager-join-string-literal-case"
status: claimed
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-21T12:40:15Z"
assignee: "arel-select-manager-join-string-literal-case"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #5025, which converged `Arel::Table#join` to
`vendor/rails/activerecord/lib/arel/table.rb:38-47`.

`SelectManager#join` (`packages/arel/src/select-manager.ts`) has the same
divergence that `Table#join` had. Rails' `select_manager.rb:102-111`:

```ruby
def join(relation, klass = Nodes::InnerJoin)
  return self unless relation

  case relation
  when String, Nodes::SqlLiteral
    raise EmptyJoinError if relation.empty?
    klass = Nodes::StringJoin
  end

  @ctx.source.right << create_join(relation, nil, klass)
  self
end
```

Trails' version wraps a string relation in `SqlLiteral` and pushes an
`InnerJoin`. It does neither the `EmptyJoinError` check nor the `StringJoin`
promotion, and it has no `return self unless relation` guard. It also does not
route through `createJoin`.

PR #5025 fixed the `Table#join` entry point (which promotes before delegating), so
paths through `Table` are correct. Calling `SelectManager#join` directly with a
string or `SqlLiteral` is still lossy.

## Acceptance criteria

- `SelectManager#join` mirrors `select_manager.rb:102-111`: nil guard, the
  `String`/`SqlLiteral` case with the emptiness check (`String#empty?` — length,
  not `trim()`) and `StringJoin` promotion, and dispatch through `createJoin`.
- Rails' `select_manager_test.rb` join tests ported/converged; the
  `SqlLiteral` arm needs a trails-only pin as in `table.trails.test.ts`,
  since TS has no String subtyping.
- Each new test fails on the pre-fix `select-manager.ts`.
- Remove any wide-baseline entries that converge (`join -> create_join`).
  Re-run `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before
  `pnpm api:calls:wide`.
