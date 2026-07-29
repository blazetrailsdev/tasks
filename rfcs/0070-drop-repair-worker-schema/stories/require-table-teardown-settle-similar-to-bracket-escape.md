---
title: "require-table-teardown: settle the SIMILAR TO ESCAPE / bracketed-backslash interaction"
status: done
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5593
claim: "2026-07-29T19:10:12Z"
assignee: "require-table-teardown-settle-similar-to-bracket-escape"
blocked-by: null
closed-reason: null
---

## Context

PR #5589 gave `bracketSource` (`eslint/require-table-teardown.mjs`) an
`areEscapes` flag so the `~` / `~*` path translates a bracketed
`ARE_SHORTHANDS` member (`[\d]`, `[\w]`, `[\S]`). The `SIMILAR TO` path
(`similarPrefixMatcher`) deliberately did NOT set it: that grammar carries its
own `ESCAPE` character, and how that character composes with a backslash
inside a bracket expression was not settled, so widening the shared helper
would have been a guess rather than a proof.

So `tablename SIMILAR TO 'ex_[\d]%'` still credits nothing today and its
creates report `missingTeardown` as noise — under-accepting in the same way the
`~` path was before #5589.

The question to settle: inside a `SIMILAR TO` bracket expression, does the
`ESCAPE` character (backslash by default — `sanitize_sql_like`,
`vendor/rails/activerecord/lib/active_record/sanitization.rb:132`) apply at
all, and does PostgreSQL read a bracketed backslash there under ARE rules or
under the SQL-standard `SIMILAR TO` grammar? Only if the answer proves the JS
character class is no wider than the SQL one may the flag be set. Refusing
remains correct for anything that cannot be settled.

Arel emits the operators at
`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb:7` (LIKE/ILIKE
ESCAPE) and `:29`, `:34` (regexp).

## Acceptance criteria

- The `ESCAPE`-vs-bracketed-backslash interaction is settled against
  PostgreSQL's documented `SIMILAR TO` grammar, and the finding is recorded at
  the call site.
- Either `similarPrefixMatcher` passes `areEscapes` (with the proof) or it
  keeps refusing (with the reason narrowed to what is actually unknown).
- Rule tests pin whichever answer lands, including the case where the pattern's
  `ESCAPE` character is itself a backslash.
- No matcher credits a name its filter does not select.
