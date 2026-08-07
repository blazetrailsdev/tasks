---
title: "changeColumnDefault's descriptor arm is absorbed by | unknown; param is named options not defaultOrChanges"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 45
priority: null
pr: 6207
claim: "2026-08-07T22:32:42Z"
assignee: "abstract-adapter-role-shard-cast-hides-ruby-nomethoderror"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the comment half in PR #6199
(`converge-comment-or-changes-descriptor-spellings`), which made
`CommentOrChanges`'s change-descriptor arm require both keys to match Rails'
unwrap gate. The default half was explicitly out of that story's scope and is
still loose.

`SchemaStatements#changeColumnDefault`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:675-678`)
annotates its third parameter

```ts
options: { from?: unknown; to: unknown } | unknown,
```

A union with `unknown` collapses to `unknown`, so the descriptor arm is
decorative — it constrains nothing, and neither `from` nor `to` is actually
checked by the compiler at any call site. The parameter is also named `options`,
where Rails names it `default_or_changes`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`,
`def change_column_default(table_name, column_name, default_or_changes)`), which
CLAUDE.md's locals-and-parameters rule makes a free fidelity miss.

Note this arm genuinely cannot be narrowed the way the comment arm was. Rails'
`extract_new_default_value` only unwraps when the hash
`has_key?(:from) && has_key?(:to)` (`schema_statements.rb:1820-1827`), so a bare
`{ to: 1 }` **is** a literal structured default and must stay accepted — the
existing comment at `:679-681` says exactly this, and two live call sites depend
on it (`adapters/sqlite3/sqlite3-adapter.test.ts:127`,
`postgresql/schema-statements.test.ts:370`). The value arm is therefore
legitimately `unknown`; the fix is to spell the union so the descriptor arm is
real rather than absorbed.

## Converged shape

Rename the parameter to `defaultOrChanges` at every override
(`abstract/schema-statements.ts:675`, `abstract-mysql-adapter.ts:743`,
`postgresql/schema-statements-class.ts:888`, and
`changeColumnDefaultForAlter` at `abstract/schema-statements.ts:2405` /
`abstract-mysql-adapter.ts:768`), matching Rails' `default_or_changes`.

For the type, either drop the dead union to a bare `unknown` (honest: the
compiler cannot distinguish a descriptor from a structured literal default here,
and Rails makes that call at runtime) or introduce a `DefaultOrChanges` type
alias whose descriptor arm requires both keys and whose value arm is `unknown`,
placed next to `CommentOrChanges` at `abstract/schema-statements.ts:224-230`.
The first is smaller and matches what Rails actually guarantees; the second only
earns its keep if a call site can be shown to benefit. Do not narrow the value
arm — that would reject the `{ to: 1 }` literal-default calls Rails accepts.

## Acceptance criteria

- [ ] No `| unknown` union that silently absorbs its sibling arm remains on
      `changeColumnDefault` / `changeColumnDefaultForAlter`.
- [ ] The parameter is named `defaultOrChanges` at every override, per Rails'
      `default_or_changes`.
- [ ] `{ to: 1 }` without `:from` still typechecks and still reaches the column
      as a literal default (the two existing call sites stay green).
- [ ] `pnpm typecheck` clean; sqlite/PG/MariaDB schema-statement suites green.
