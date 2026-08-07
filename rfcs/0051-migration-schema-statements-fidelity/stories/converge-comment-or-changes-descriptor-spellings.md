---
title: "converge-comment-or-changes-descriptor-spellings"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6199
claim: "2026-08-07T20:32:46Z"
assignee: "converge-comment-or-changes-descriptor-spellings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #6195
(`mysql-change-column-null-and-comment-pass-empty-type`), which typed
`extractNewCommentValue` as `(CommentOrChanges) => string | null`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2364`)
and removed two `as string | null` casts in
`postgresql/schema-statements-class.ts`.

The reviewer flagged that the type is still not accurate for one JS-only input.
`CommentOrChanges`
(`abstract/schema-statements.ts:225`) is

```ts
export type CommentOrChanges = string | null | { from?: string | null; to?: string | null };
```

so `{ from: "old", to: undefined }` typechecks, and
`extractNewDefaultValue`'s `"from" in v && "to" in v` check treats the key as
present and returns `undefined` — which the alias's return type calls
`string | null`. Ruby cannot have this input at all (there is no `undefined`),
and it is unreachable through the DSL: `Migration#changeColumnComment` /
`#changeTableComment` route through `_extractNewCommentValue`
(`migration.ts:85-100`), which rejects `to: undefined` with
`ArgumentError("change_column_comment / change_table_comment requires a :to value")`.
So this is a type-accuracy gap on a direct-to-adapter call, not a live bug.

The faithful fix is to make the change-descriptor arm's keys **required**,
because Rails' unwrap branch tests both:

```ruby
if default_or_changes.is_a?(Hash) && default_or_changes.has_key?(:from) && default_or_changes.has_key?(:to)
  default_or_changes[:to]
else
  default_or_changes
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1820-1827`,
`alias :extract_new_comment_value :extract_new_default_value`). With
`{ from: string | null; to: string | null }`, `to: undefined` stops typechecking
and the cast becomes honest.

PR #6195 attempted exactly this and backed it out: the descriptor is hand-rolled
at **five** more sites with three different spellings, and each one has to move
in the same commit or the override signatures stop being assignable —

- `abstract/schema-statements.ts:1870` — `{ from?: string; to?: string }` (no `null`)
- `postgresql/schema-statements-class.ts:957,971`
- `postgresql-adapter.ts:4645,4650`
- `abstract-mysql-adapter.ts:693` — `string | Record<string, string | null>`
  (no `null` arm at all)

That is a wider convergence than the MySQL change-column story owned, so it was
left for this one. All comment call sites already pass both keys; the partial
`{ to: 1 }` call sites found in the tree
(`adapters/sqlite3/sqlite3-adapter.test.ts:127`,
`postgresql/schema-statements.test.ts:370`) are `changeColumnDefault`, which
takes `unknown`, not `CommentOrChanges`, and is out of scope here.

## Acceptance criteria

- [ ] `CommentOrChanges`'s change-descriptor arm requires both `from` and `to`,
      matching `schema_statements.rb:1821`.
- [ ] All six hand-rolled `commentOrChanges` parameter spellings listed above use
      `CommentOrChanges`; no adapter re-declares the shape inline.
- [ ] `extractNewCommentValue` no longer needs `as string | null` internally, or
      the remaining cast is justified at the call site with the Rails cite.
- [ ] `pnpm typecheck` clean across activerecord and trailties (the
      `trailties/src/database.ts:516` adapter assignment is sensitive to this
      parameter's variance), MySQL/PG comment suites green.
