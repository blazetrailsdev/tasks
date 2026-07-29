---
title: "require-table-teardown: read SIMILAR TO and regex sweep filters"
status: ready
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sweepPrefixMatchers` in `eslint/require-table-teardown.mjs` now reads `LIKE`
and `ILIKE` filters (#5555, #5561). Its KNOWN GAPS paragraph still lists two
further spellings of the same catalogue filter, both under-accepting (a real
sweep goes unrecognised and its creates report `missingTeardown` — noise, not
a leak):

- `SIMILAR TO` — PostgreSQL's SQL-standard regex filter. It keeps `%` and `_`
  as LIKE wildcards but ALSO gives regex meaning to `|`, `*`, `+`, `()`, `[]`,
  `{}` — so it CANNOT be routed through `likePrefixMatcher` unchanged: a
  pattern like `SIMILAR TO '(ex|tmp)_%'` would compile to the literal prefix
  `(ex|tmp)` and credit nothing, and a pattern using `*` would be read as a
  literal asterisk. It needs its own translation, or a deliberate decision to
  accept only the metachar-free subset.
- The regex match operators `~` / `~*` (and negated `!~` / `!~*`). These are
  anchored differently — `~ '^ex_'` is a prefix only because of the explicit
  `^`, and an unanchored `~ 'ex_'` matches mid-name, so it is NOT a prefix
  filter and must credit nothing. `~*` is case-insensitive (the `i` flag, as
  `ILIKE` now gets); the negated forms must yield no matcher exactly as
  `NOT LIKE` / `NOT ILIKE` do.

Arel emits all of these from the same node family as `LIKE` —
`visit_Arel_Nodes_Matches` / `visit_Arel_Nodes_Regexp` in
`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb`, tests in
`vendor/rails/activerecord/test/cases/arel/visitors/postgres_test.rb`.

As with `ILIKE`, no file in the tree uses either spelling for a teardown sweep
today, so this is pre-emptive: file it before someone writes one and is told to
hand-maintain a DROP list.

## Acceptance criteria

- `sweepPrefixMatchers` recognises `SIMILAR TO` and the `~` / `~*` operators,
  or documents in the rule header why a given one is deliberately left out.
- Regex filters credit a prefix ONLY when anchored with `^`; an unanchored
  pattern yields no matcher.
- `~*` compiles case-insensitively; `!~`, `!~*` and `NOT SIMILAR TO` yield no
  matcher, as the `NOT LIKE` / `NOT ILIKE` path already does.
- `SIMILAR TO` metacharacters are either translated or make the filter
  unreadable — never silently mis-read as literals.
- Rule tests pin each accepted and each rejected spelling; the header's KNOWN
  GAPS paragraph is updated to match what is actually read.
