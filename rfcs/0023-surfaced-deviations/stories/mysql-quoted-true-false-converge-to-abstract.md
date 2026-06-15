---
title: "MySQL quoted_true/quoted_false return 1/0 but vendored Rails 8.0.2 MySQL inherits abstract TRUE/FALSE (no override)"
status: done
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 3363
claim: "2026-06-15T15:29:09Z"
assignee: "mysql-quoted-true-false-converge-to-abstract"
blocked-by: null
---

## Context

In the pinned Rails 8.0.2 checkout the MySQL adapter does **not** override
`quoted_true` / `quoted_false`; it inherits
`AbstractAdapter` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:166-178`):

```ruby
def quoted_true   = "TRUE"
def quoted_false  = "FALSE"
def unquoted_true  = 1
def unquoted_false = 0
```

(MySQL accepts `TRUE`/`FALSE` as aliases for `1`/`0`.)

trails deliberately **overrides** them
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:363-364`)
to return `"1"`/`"0"`:

```ts
override quotedTrue = mysqlQuotedTrue;   // "1"
override quotedFalse = mysqlQuotedFalse; // "0"
```

with a comment (`:350-362`) justifying it: without the override, `quote(true)`
(which routes booleans through `unquoted_true` → `1`) and `quotedTrue()` (→
`"TRUE"`) would disagree. So this is a **tracked deviation, not a bug** — but
per the "always converge, never ratify" rule it should be reconciled with the
vendored Rails, not left diverging.

The convergence is not a blind delete: dropping the override surfaces the
`quote(true)` vs `quotedTrue()` disagreement the comment describes. The story
must converge to Rails' shape (inherit abstract `TRUE`/`FALSE`) **and** resolve
that tension the way Rails does — confirm how Rails' MySQL `quote`/casting emits
booleans (via `unquoted_true`/`_false` = `1`/`0` for binds, `TRUE`/`FALSE` for
the quoted literal) so both paths are self-consistent and match Rails output.

## Acceptance criteria

- [ ] MySQL `quotedTrue`/`quotedFalse` match the vendored Rails 8.0.2 abstract
      behavior (no MySQL-specific `1`/`0` override), i.e. inherit
      `quoting.rb:166-178`.
- [ ] The `quote(true)` / `quotedTrue()` consistency the current comment guards
      is preserved by matching Rails' own split (`unquoted_*` for binds,
      `quoted_*` for the literal) — document the resolution inline; do not
      reintroduce the override to paper over it.
- [ ] Read the Rails `quoting`/`adapter` test covering boolean quoting and
      mirror its name verbatim; verify emitted SQL on MySQL 8 + MariaDB.
- [ ] api:compare / test:compare delta non-negative.
