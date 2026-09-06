---
title: "AbstractAdapter#execute declares sqlite3's backward-compatibility return shape"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7552 (`sqlite3-execute-substitutes-empty-array-for-rails-nil`),
which dropped sqlite3 `execute`'s `?? []` and had to widen the whole chain to
do it.

Rails' abstract `execute`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`)
forwards to `internal_execute`, whose value is whatever `raw_execute` /
`cast_result` produced — an `ActiveRecord::Result` for the adapters that build
one. Only sqlite3 narrows it to arrays of hashes, and it does so in its OWN
file, for stated backward compatibility
(`sqlite3/database_statements.rb:53-57`: "SQLite3Adapter was refactored to use
ActiveRecord::Result internally but for backward compatibility we have to keep
returning arrays of hashes here").

trails inverts that. The `AbstractAdapter` interface declares

```ts
execute(
  sql: string,
  name?: string | null,
  kwargs?: { allowRetry?: boolean },
): Promise<Record<string, unknown>[] | undefined>;
```

(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:671-675`),
i.e. sqlite3's backward-compatibility return shape is hoisted onto EVERY
adapter, while the abstract function body
(`abstract/database-statements.ts:326-333`) honestly returns
`Promise<unknown>`. The two disagree, and the declaration is the one every
caller sees — which is why #7552 had to widen `abstract-adapter.ts` to land a
change whose Rails counterpart is confined to `sqlite3/database_statements.rb`.

The consequence is visible in that PR's diff: ~100 call sites carry a non-null
assertion for a nullish arm only sqlite3's `super&.to_a` can produce.

## Converged shape

`AbstractAdapter#execute`'s declared return type follows the abstract body
(`Promise<unknown>`, or the `Result` the adapters actually build), and the
arrays-of-hashes narrowing lives only on `SQLite3Adapter`, where Rails puts it.
Call sites then read the shape their own adapter returns rather than sqlite3's.

Expect the diff to be mostly call-site retyping; check whether the PG and MySQL
`execute` call sites want `Result` or rows before choosing between the two.

## Acceptance criteria

- [ ] `AbstractAdapter#execute`'s declaration matches the abstract body it
      declares, not sqlite3's override.
- [ ] The `Record<string, unknown>[] | undefined` shape appears only on the
      sqlite3 seat, cited to sqlite3/database_statements.rb:53-57.
- [ ] Non-null assertions added in #7552 for the nullish arm are re-examined —
      the ones on non-sqlite3 adapters should not survive.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
