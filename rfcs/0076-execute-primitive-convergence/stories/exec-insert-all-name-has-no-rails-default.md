---
title: 'exec_insert_all invents a "SQL" default for a required Rails parameter'
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: 6337
claim: "2026-08-10T14:13:28Z"
assignee: "complete-frags-doc-orphaned-onto-julian-epoch-date"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing every `name` parameter default against Rails for PR
[#6325] (`uncached-sql-payload-name-nil-passthrough`). That PR converged the
`nil`-defaulted and `"SQL"`-defaulted params; `exec_insert_all` is the one
member of the family whose Rails signature has **no** default at all, so it
fell outside that PR's inventory and was left as-is.

Rails:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:176
def exec_insert_all(sql, name) # :nodoc:
  internal_exec_query(sql, name)
end
```

`name` is **required**. Calling `exec_insert_all(sql)` is an `ArgumentError`.

trails invents a default:

```ts
// packages/activerecord/src/connection-adapters/abstract/database-statements.ts:688
export function execInsertAll(
  this: DatabaseStatementsHost & {
    internalExecQuery(sql: string, name?: string | null): Promise<Result>;
  },
  sql: string,
  name: string = "SQL",
): Promise<Result> {
  return this.internalExecQuery(sql, name);
}
```

The declaration on the adapter interface is looser still —
`packages/activerecord/src/connection-adapters/abstract-adapter.ts:576` has
`execInsertAll(sql: string, name?: string)`, i.e. optional.

So a caller that forgets the label silently logs `"SQL"` where Rails would have
raised. The single production caller does pass one
(`packages/activerecord/src/insert-all.ts:142` passes `message`), so this is
latent rather than active — but the invented default is what makes it possible
to add a nameless caller without noticing, and `"SQL"` is exactly the value the
rest of #6325's work stopped fabricating.

## Converged shape

```ts
export function execInsertAll(
  this: DatabaseStatementsHost & {
    internalExecQuery(sql: string, name?: string | null): Promise<Result>;
  },
  sql: string,
  name: string,
): Promise<Result> {
  return this.internalExecQuery(sql, name);
}
```

…with `abstract-adapter.ts:576` tightened from `name?: string` to
`name: string` to match, so an omitted label is a compile error — the closest TS
gets to Ruby's `ArgumentError` for a missing required positional.

## Acceptance criteria

- [ ] `execInsertAll`'s `name` parameter has no default, matching
      `database_statements.rb:176`.
- [ ] `AbstractAdapter`'s `execInsertAll` declaration
      (`abstract-adapter.ts:576`) makes `name` required, not optional.
- [ ] `insert-all.ts:142` and any other caller still compile — they already pass
      a label, so no call site should need changing.
