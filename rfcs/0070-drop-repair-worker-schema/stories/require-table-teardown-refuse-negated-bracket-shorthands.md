---
title: "require-table-teardown: refuse an ARE shorthand inside a negated bracket expression"
status: closed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5619
claim: null
assignee: null
blocked-by: null
closed-reason: "abandoned: user dropped the require-table-teardown lint-rule work"
---

## Context

`bracketSource` (`eslint/require-table-teardown.mjs`) translates a bracketed
`ARE_SHORTHANDS` member (`[\d]`, `[\w]`, `[\S]`) on the argument recorded next to
`ARE_SHORTHANDS`: JS's `\d`/`\w` stay ASCII while ARE's are the POSIX classes a
non-C locale can extend, so the JS spelling is a _subset_ and under-accepts.

That argument does not survive negation. Under `[^\d]` the complement of a
subset is a _superset_: a name containing a non-ASCII digit is matched by JS
`[^\d]` but excluded by ARE's, so the matcher credits a name the filter does not
select — exactly the invariant the rule exists to keep. PR #5611 added that
negation refusal for `POSIX_CLASS_SOURCES` (see the `negated` flag) but
deliberately left the shorthand branch alone, because two existing accepted
cases pin the current behaviour (`~ '^ex_[^\d]+'` and `~ '^ex_[^-\d]+'`, in the
valid list of `eslint/require-table-teardown.test.mjs`) and flipping them is a
behaviour change of its own.

## Acceptance criteria

- A bracketed `ARE_SHORTHANDS` member refuses under a negating `^`, with the
  subset/complement reason recorded at the call site (the `POSIX_CLASS_SOURCES`
  branch already states it — share one comment rather than duplicating it).
- The two existing valid cases move to the invalid list with their
  `missingTeardown` expectation, and the doc blocks that describe brackets under
  negation are updated to match.
- No matcher credits a name its filter does not select.
