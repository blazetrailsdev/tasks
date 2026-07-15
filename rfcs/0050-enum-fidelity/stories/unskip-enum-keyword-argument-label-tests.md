---
title: "Un-skip the two enum keyword-argument label tests (stale seeding skip)"
status: draft
updated: 2026-07-15
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR 4890 (converge-cat-enum-declaration-to-array-form) while
answering a reviewer question about Rails' `enum(name, values = nil, **options)`
keyword form.

`packages/activerecord/src/enum.test.ts:964,967` skips two `enum_test.rb` ports:

- `enum labels as keyword arguments` (`vendor/rails/activerecord/test/cases/enum_test.rb:895`)
- `option names can be used as label` (`vendor/rails/activerecord/test/cases/enum_test.rb:906`)

Their skip comments blame an in-memory DB-default seeding gap ("`new K()` doesn't
seed `status` -> 0 -> \"active\" through EnumType#cast"). That gap was fixed by
`enum-db-default-on-new` (PR 4411): `books.status` carries `default: 0`
(`vendor/rails/activerecord/test/schema/schema.rb`, books table), and the seeding
now works. The skips are stale, not blocked.

Verified on merged main via a throwaway probe riding `fixtures(["books"])`:

- `new K().isActive()` is `true` and `isArchived()` is `false` for
  `this.enum("status", { active: 0, archived: 1 })` on `_tableName = "books"`.
- The option-name-collision case also passes: `this.enum("status", { default: 0,
scopes: 1, prefix: 2, suffix: 3 })` yields `statuses === { default: 0, scopes: 1,
prefix: 2, suffix: 3 }` with `isDefault`/`isScopes` defined.

Note the Ruby-side `values, options = options, {} unless values`
(`vendor/rails/activerecord/lib/active_record/enum.rb:217`) needs no port: it undoes a Ruby
parser artifact (kwargs vs positional hash), and TS binds `this.enum("status",
{ active: 0 })` straight to `values`. This story is only about un-skipping.

## Acceptance criteria

- Both tests un-skipped in `enum.test.ts`, names unchanged (verbatim Rails names).
- Bodies port the Rails assertions (predicate true/false), riding canonical `Book`
  fixtures rather than a bespoke table.
- If either genuinely still fails, that is the finding: record the real cause in
  the skip comment instead of the stale seeding one.
