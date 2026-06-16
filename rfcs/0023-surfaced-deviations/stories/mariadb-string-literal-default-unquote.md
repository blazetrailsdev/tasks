---
title: "MariaDB string/char/enum literal default quotes not stripped in columns() reflection"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While implementing `c2-defaults-mariadb-expression-reflection` (PR #3438), the
`columns()` information_schema reflection path was found to leave **string /
char / enum literal defaults single-quoted** on MariaDB.

MariaDB reports `information_schema.column_default` for a string literal
_quoted_ — e.g. `DEFAULT 'a varchar field'` comes back as the 17-char string
`'a varchar field'` (verified on mariadb:11), and enum defaults as `'x'`. The
trails reflection path (`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`,
`columns()`, ~line 553-580) does not strip/unescape those outer quotes for
plain string/char/enum columns, so the schema dumper emits:

```text
t.string("char2", { limit: 50, default: "'a varchar field'" });
```

instead of Rails':

```text
t.string("char2", { limit: 50, default: "a varchar field" });
```

(On MySQL 8 the same column reflects unquoted — `a varchar field` — so this is
MariaDB-specific.) The bug is latent today: `defaults.test.ts` only asserts the
`uuid`/`char2_concatenated` expression columns, not `char2`, so no test fails.

Rails has no information_schema columns() path — it reads SHOW FULL FIELDS
(`mysql/schema_statements.rb:189-219` `new_column_from_field`) where `Default`
is already unquoted, and only its `:text` branch (lines 201-203) strips quotes.
The trails info_schema path needs an analogous unquote for MariaDB
string/char/enum literal defaults (mirror the `:text` strip:
`default[1...-1].gsub("\\'", "'")`), gated so it does not disturb the MySQL 8
path (which already returns unquoted) or the expression-default branch added in
PR #3438.

## Acceptance criteria

- [ ] On MariaDB, a string/char/enum column with a literal default reflects with
      the surrounding single quotes stripped and `\'` unescaped, so the schema
      dump emits `default: "a varchar field"` (not `default: "'a varchar field'"`).
- [ ] MySQL 8 reflection (already unquoted) and the MariaDB expression-default
      branch (uuid()/concat(), PR #3438) are unaffected.
- [ ] Add an assertion for the `char2` literal default to `MysqlDefaultExpressionTest`
      in `defaults.test.ts` (matching the Rails canonical `defaults` shape) so the
      fix is covered on the MariaDB CI lane.
