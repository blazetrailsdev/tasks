---
title: "no-freeform-comments strips the reason off a single-line @noRailsEquivalent / @missingRailsCall receipt"
status: draft
updated: 2026-09-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

`blazetrails/no-freeform-comments` promises to keep "the repo's own JSDoc flags
— `@internal`, `@noRailsEquivalent`, `@missingRailsCall`, `@missingRailsArgs` —
together with the reason argument each requires" (`eslint/no-freeform-comments.mjs:11-15`).
In an enrolled package it does not: the fixer trims a single-line receipt down
to the bare tag, silently discarding the reason.

Observed in PR #7328 on `packages/rack-session/src/abstract/id.ts`. The tag was
written as

    /** @missingRailsCall call — PERMANENT: `@same_site.call(req, res)` (abstract/id.rb:407) is a JS function invocation; `fn.call(req, res)` would rebind `this` */

and `eslint --fix` rewrote it to

    /** @missingRailsCall call — PERMANENT */

Re-adding the reason and re-running the fixer reproduces it every time. A
reviewer then correctly flagged the bare tag as unreasoned, and the divergence
had to be moved into a `call-mismatches-exclude` baseline row instead — where
the `reason` field is a JSON string the rule cannot reach.

This inverts the two mechanisms. `parity:api:extra` and
`lint-missing-rails-call-reasons` read those reasons and treat them as reviewed
arguments; `scripts/api-compare/` prefers the in-file tag over a baseline row
precisely because a receipt "lives in the file you are already editing, so it
never conflicts the way a shared counter does" (CLAUDE.md). If an enrolled
package cannot hold a reasoned receipt, every deviation in it is pushed into the
shared baseline tree — the opposite of the direction RFC 0117 and RFC 0084 are
driving.

Distinct from `no-freeform-comments-rejects-a-lone-multiline-norailsequivalent`,
which is about a multi-line block being REJECTED. This one is a single-line
block that is ACCEPTED and silently trimmed.

## Acceptance criteria

- A single-line `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs`
  receipt keeps its reason text through `eslint --fix`, in an enrolled package,
  in both the `PERMANENT` and `CONVERGEABLE <story-id>` shapes.
- A rule test in `eslint/no-freeform-comments.test.mjs` pins each of the three
  tags with a reason as `valid` and unmodified by the fixer.
- Reasons the rule still strips (prose with no tag, `@param`/`@returns`) are
  unchanged — the fix narrows the trim to non-receipt text, it does not stop
  trimming.
- The `@missingRailsCall call` row in
  `scripts/api-compare/call-mismatches-exclude/rack-session/abstract/id.json`
  can then move back to an in-file receipt at
  `packages/rack-session/src/abstract/id.ts` `commitSession`, and the baseline
  row is deleted (the baseline is only-shrink; narrow the mark with
  `pnpm parity:api:calls:tighten`, never reseed).
