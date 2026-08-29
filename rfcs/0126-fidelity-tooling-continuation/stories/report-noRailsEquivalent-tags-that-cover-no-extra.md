---
title: "Report @noRailsEquivalent tags that cover no extra"
status: draft
updated: 2026-08-29
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
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

`parity:api:extra` reports a `@noRailsEquivalent` tag as STALE when the tag
points at nothing, but its `matched` counter keys on `(package, tsFile, name)`
against the file's **TS name set**, not against the file's **extras**. So a tag
on a public name that is already in the allowed set — a receipt that covers no
extra surface — counts as `matched`, never lands in `tagged.stale`, and sits in
the tree indefinitely asserting a Ruby counterpart is absent when the scorer
already found one.

Found while landing `credit-ruby-hash-and-option-keys-as-ruby-surface`
(RFC 0126), on `packages/activesupport/src/xml-mini.ts`'s
`ToXmlOptions#skipInstruct`. Measured on `origin/main`'s extractor with only
that tag deleted:

```
activesupport novel 293 (unchanged), xml-mini.ts novel 8, allowlisted 0
skipInstruct absent from the extras list in BOTH runs
```

The tag was redundant before that PR and `tagged.stale` was `[]` in every run,
with and without it.

Relevant sites:

- `scripts/api-compare/extra-surface.ts` — the scoring loop
  (`if (allowed.has(name)) continue;` precedes the `tagKeys.has(allowKey)`
  check, so an allowed name never reaches the tag arm) and `matchedTagKeys` /
  the `tagged.stale` computation.
- `scripts/api-compare/extra-surface.test.ts` — the tag/stale cases.

## Acceptance criteria

- A `@noRailsEquivalent` tag on a public name that is in the file's ALLOWED set
  (i.e. covers no extra) is reported — as stale, or as its own
  "redundant receipt" class, whichever fits the existing report shape.
- The existing STALE class (a tag on a name absent from the file entirely)
  keeps behaving as it does today.
- A unit test covers a redundant tag and asserts it is reported; a second
  covers a tag that really does cover an extra and asserts it is not.
- Report the repo-wide count of redundant tags surfaced, and either delete them
  in this PR or file the burndown, whichever keeps the PR under its LOC ceiling.
  Do NOT widen an allowlist to absorb them.
