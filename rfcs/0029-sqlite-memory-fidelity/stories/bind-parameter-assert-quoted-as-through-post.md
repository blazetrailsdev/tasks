---
title: "bind-parameter-assert-quoted-as-through-post"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5502
claim: "2026-07-28T13:36:45Z"
assignee: "bind-parameter-assert-quoted-as-through-post"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #5499 (RFC 0029,
`sqlite3-adapter-siblings-ambient-connection`).

Rails' `SQLite3Adapter::BindParameterTest`
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/bind_parameter_test.rb:9-44`)
declares `fixtures :posts` and drives every case through a private
`assert_quoted_as(expected, value, match: 0)` helper (`:36-44`) that asserts
the **rendered SQL** of `Post.where("title = ?", value)`:

```ruby
assert_equal(
  %{SELECT "posts".* FROM "posts" WHERE (title = #{expected})},
  relation.to_sql,
)
```

…and then asserts `relation` is empty (or matches `match:` rows). The point of
the suite is how each Ruby value type renders into the bind position — integer
`0` renders `0`, `false` renders `0`, `BigDecimal(0)` renders `0.0`,
`Rational(0)` renders `0/1`.

trails' `packages/activerecord/src/adapters/sqlite3/bind-parameter.test.ts`
keeps the six Rails test names but the bodies do something different: they
`INSERT` a string into `topics` and assert the row count comes back as 1. They
never render SQL, never touch `Post`, and never exercise the value-type
rendering the Rails suite exists to pin. PR #5499 added
`fixtures(["topics"])` to match the bodies; the divergence predates it.

## Acceptance criteria

- [ ] Port `assert_quoted_as` as a file-local helper asserting
      `Post.where("title = ?", value).toSql()` against the Rails expectation
      string, plus the empty/`match:` row assertion.
- [ ] Suite declares `fixtures(["posts"])`, matching Rails' `fixtures :posts`.
- [ ] All six cases pass their Rails value: `"Welcome to the weblog"` (match 1),
      `0`, `0.0`, `false`, decimal `0`, rational `0`. Where trails has no
      analogue for a Ruby wrapper (`BigDecimal`, `Rational`), justify the chosen
      stand-in at the call site rather than dropping the case.
- [ ] Test names unchanged.
- [ ] `topics` is no longer referenced by this file.
