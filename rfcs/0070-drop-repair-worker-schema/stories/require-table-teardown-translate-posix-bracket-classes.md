---
title: "require-table-teardown: translate a POSIX character class inside a bracket expression"
status: done
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5611
claim: "2026-07-29T22:24:48Z"
assignee: "require-table-teardown-translate-posix-bracket-classes"
blocked-by: null
closed-reason: null
---

## Context

`bracketSource` (`eslint/require-table-teardown.mjs:527`) refuses a bracket
expression outright the moment a member opens a POSIX class, collating element
or equivalence class:

```js
if (ch === "[" && ":.=".includes(pattern[i + 1] ?? "")) return null;
```

So `~ '^ex_[[:digit:]]'` and `SIMILAR TO 'ex_[[:alnum:]]%'` credit nothing and
their creates are reported as `missingTeardown` noise — the same
under-acceptance PR #5597 removed for a literal bracketed backslash.

The character-class half is provable by the argument already recorded in the
`ARE_SHORTHANDS` doc block (`eslint/require-table-teardown.mjs`): ARE's class
shorthands ARE the POSIX classes (`\d` is `[[:digit:]]`, `\w` is
`[[:alnum:]_]`, `\s` is `[[:space:]]`), which a non-C database locale can
extend beyond ASCII, while JS's `\d`/`\w` stay ASCII. So the JS spelling is a
subset and under-accepts at worst — never wider, which is the invariant that
matters (a wider matcher credits a name the filter does not select). The same
reasoning licenses `[[:digit:]]` -> `\d` exactly as it licensed `[\d]` -> `\d`
in PR #5593.

The complements and locale-extending ones must stay refused for the same
reason `\D`, `\W` and `\s` are refused today. Collating elements (`[.ch.]`)
and equivalence classes (`[=a=]`) have no JS spelling at all and stay refused.

## Acceptance criteria

- A POSIX character class whose JS shorthand cannot be the wider of the two
  translates inside a bracket expression; the licensed set is enumerated with
  its proof next to `ARE_SHORTHANDS`.
- Every other `[:...:]` name, plus `[. .]` and `[= =]`, still refuses, with the
  reason recorded at the call site.
- Rule tests pin the accepted names AND a name the filter does not select, and
  fail against the rule on the merge base.
- No matcher credits a name its filter does not select.
