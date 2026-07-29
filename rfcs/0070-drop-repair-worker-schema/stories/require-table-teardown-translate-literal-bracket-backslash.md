---
title: "require-table-teardown: translate a literal backslash inside a SIMILAR TO bracket expression"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-29T19:40:14Z"
assignee: "require-table-teardown-translate-literal-bracket-backslash"
blocked-by: null
closed-reason: null
---

## Context

PR #5593 settled the `SIMILAR TO` `ESCAPE`-vs-bracket interaction: PostgreSQL
consumes the escape character inside a bracket expression and hands the pair to
the underlying ARE, so `bracketSource` (`eslint/require-table-teardown.mjs`)
now takes the escape character and translates a bracketed `ARE_SHORTHANDS`
member.

It left one case deliberately refused rather than translated: a backslash that
is NOT the pattern's escape character. Verified on PostgreSQL 17.7:

```sql
'ex_5' SIMILAR TO 'ex_[\d]%' ESCAPE '#'  -> f
'ex_d' SIMILAR TO 'ex_[\d]%' ESCAPE '#'  -> t
'ex_\' SIMILAR TO 'ex_[\d]%' ESCAPE '#'  -> t
```

So the class is the two literals `{\, d}`, which JS spells exactly as
`[\\d]`. The translation is provable, not a guess — PR #5593 refused it only
because emitting the backslash unescaped (what the code did before) would have
made the JS class the wider of the two, and refusing was the safe fix inside
that PR's scope.

Refusing here under-accepts: a sweep filtered on such a pattern credits
nothing and its creates are reported as `missingTeardown` noise.

## Acceptance criteria

- `bracketSource` emits a doubled backslash for a literal backslash inside a
  bracket expression (i.e. when the backslash is not `escapeChar`) instead of
  refusing the whole expression.
- The range interaction is settled the same way the shorthand one was: a
  literal backslash as a range endpoint either translates with proof or
  refuses with the reason recorded at the call site.
- Rule tests pin the accepted names AND a name the filter does not select, and
  fail against the rule on `main`.
- No matcher credits a name its filter does not select.
