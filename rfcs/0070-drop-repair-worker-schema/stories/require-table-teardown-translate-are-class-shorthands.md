---
title: "require-table-teardown: translate PostgreSQL ARE class shorthands in regex sweep filters"
status: done
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5582
claim: "2026-07-29T18:04:13Z"
assignee: "require-table-teardown-translate-are-class-shorthands"
blocked-by: null
closed-reason: null
---

## Context

`posixRegexpSource` in `eslint/require-table-teardown.mjs` (added in #5578)
translates an anchored `~` / `~*` sweep filter from POSIX ERE to JS regex
source. It refuses any backslash escape of a word character:

```js
} else if (ch === "\\") {
  const next = pattern[i + 1];
  if (next === undefined || /\w/.test(next)) return null;
```

That blanket refusal covers two populations that are not alike:

- Back references (`\1`, `\2`). JS spells these identically but they mean
  something different once our `^(?:…)` wrapper adds a group, so refusing is
  correct and must stay.
- ARE class shorthands (`\d`, `\w`, `\s`, `\S`, `\W`, `\D`). PostgreSQL's regex
  engine is ARE, not bare POSIX ERE, and these mean exactly what they mean in
  JS — see the `~` / `~*` operators Arel emits from
  `visit_Arel_Nodes_Regexp` in
  `vendor/rails/activerecord/lib/arel/visitors/postgresql.rb`. Refusing them is
  deliberate under-accepting (documented in the rule header's KNOWN GAPS
  paragraph), so `~ '^ex_\d+'` credits nothing and its creates report
  `missingTeardown` as noise.

Translating the shorthands is a widening of what the rule accepts, so it needs
the same care the rest of #5578 took: a construct may only be accepted when its
JS meaning is identical to its PostgreSQL one, never when it merely looks
similar. `\b` is a word boundary in both but PostgreSQL also spells backspace
`\b` inside a bracket expression; `\A` / `\Z` / `\y` / `\m` / `\M` are ARE-only
and have no JS equivalent, so they stay refused.

## Acceptance criteria

- `~ '^ex_\d+'` and the other ARE class shorthands whose JS meaning is
  identical are translated rather than refused.
- An ARE-only escape with no JS equivalent (`\A`, `\Z`, `\y`, `\m`, `\M`) and a
  back reference (`\1`) each still yield no matcher.
- No matcher credits a name its filter does not select.
- Rule tests pin each newly accepted and each still-refused escape, and the
  KNOWN GAPS paragraph is updated to match what is actually read.
