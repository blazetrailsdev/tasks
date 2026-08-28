---
title: "no-freeform-comments rejects a multi-line block whose only tag is @noRailsEquivalent"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while working #7153 (RFC 0113). `blazetrails/no-freeform-comments`
(`eslint/no-freeform-comments.mjs`) rejects a multi-line JSDoc block whose
ONLY tag is `@noRailsEquivalent`, while accepting the same receipt in both
other spellings. Isolated on `packages/arel/src/nodes/node.ts` by adding each
shape and running `npx eslint` on the file:

| shape                                                              | result      |
| ------------------------------------------------------------------ | ----------- |
| `/** @noRailsEquivalent PERMANENT */` (one line)                   | 0 errors    |
| `/**`<br>`* @noRailsEquivalent PERMANENT`<br>`*/`                  | **1 error** |
| `/**`<br>`* @internal`<br>`* @noRailsEquivalent PERMANENT`<br>`*/` | 0 errors    |

The error is the generic "English-language comment. trails carries none: only
the repo's JSDoc flags with their permanence token, and tool directives",
pointing at the block's opening line — so it reads as if the reason prose were
at fault rather than the block's shape.

This matters because the lone multi-line `@noRailsEquivalent` is the natural
spelling for a receipt on a **public** member, which is the normal case for
extra surface: `@internal` is exactly what such a member must NOT carry, so the
two-tag form that happens to pass is unavailable. The single-line form is the
only legal spelling and nothing says so, so the author's first instinct fails
with a message that does not name the real cause.

`KEPT_TAG_RE` (`^[\s*]*@(internal|noRailsEquivalent|...)\b`) does match
`* @noRailsEquivalent PERMANENT`, so the tag itself is recognised; the bug is
in how a block's non-tag lines (`/**`, `*/`) are judged when no other kept tag
is present. `eslint/no-freeform-comments.test.mjs` is the place to pin it.

## Converged shape

Accept a multi-line JSDoc block whose only content is one or more kept tags and
their permanence tokens, regardless of which kept tag it is. If the single-line
form is instead the deliberate house style for a lone receipt, the rule should
say so in its message rather than reporting it as English prose — but the
current asymmetry (legal with `@internal`, illegal without) is not a style, it
is an accident.

## Acceptance criteria

1. A multi-line block containing only `@noRailsEquivalent PERMANENT` (or
   `CONVERGEABLE`) passes, matching the single-line and two-tag forms.
2. A case in `eslint/no-freeform-comments.test.mjs` covers all three spellings
   for a lone receipt, so the asymmetry cannot come back.
3. Genuine prose next to a kept tag still errors — the rule must not become a
   blanket exemption for any block that contains a tag.
4. `pnpm lint` clean; no autofix churn in files that already carry receipts.
