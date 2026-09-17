---
title: "Only-shrink marks accept an upward hand-edit"
status: draft
updated: 2026-09-17
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

Every only-shrink ratchet in the repo is enforced in ONE direction by code and
in the other direction by review. The gates ask "is the measurement at or under
the committed mark?" — so LOWERING a mark is checked (the measurement has to
have moved), while RAISING one is silently green, because a higher ceiling can
never be exceeded by a measurement that already passed.

Concretely, in `scripts/test-compare/assertion-ratchet.ts`:

- `violations()` (`:146`) flags `current[pkg][counter] > prior[counter]`.
- `nextMark()` (`:128`) takes `Math.min` per counter, so the `--write` path
  cannot raise one.
- Nothing compares the committed mark against its own previous value.

So `nextMark` guards the mark against the TOOL, and nothing guards it against a
text editor. Hand-editing `activerecord.kind` from 3117 to 4000 admits 883
counters of regression, passes the gate, and reads as a one-line diff. The same
shape holds for `scripts/api-compare/extra-surface-mark.json`,
`call-mismatches-wide-unreviewed/**`, the params marks and `arm-throw-mark.json`
— every register CONTRIBUTING.md describes as "only-shrink".

CONTRIBUTING.md states the rule repeatedly ("The mark in … only shrinks; it is
never raised to admit new debt", "never widen an allowlist to cover new work")
and CLAUDE.md calls the registers a burndown ledger. The rule is real and
load-bearing; it just has no mechanical enforcement.

Surfaced during trails#7857, which froze the assertion mark for RFC 0132's
duration. The freeze interlock refuses `--write` while a marker exists
(`loadFreeze`, `assertion-ratchet.ts`), and the PR body notes that an upward
hand-edit remains green — identical frozen or thawed, which is why it was left
out of that PR rather than folded in.

## Converged shape

A CI guard that reads each mark register at `origin/main` and at `HEAD`, and
fails when any committed counter ROSE, naming the register, the key and both
values. It is a diff-against-base check, not a measurement check, so it needs no
artifact and can live in the `rails-comparison` job beside the gates it
protects.

The only-shrink contract admits a small number of legitimate raises — RFC 0105
had to write six packages' marks UP by hand, once, when the scoping set was
removed and their `0/0/0` turned out to mean "never measured" rather than
"converged" (CONTRIBUTING.md, "Measuring progress"). So the guard needs an
explicit, reviewed override for that case — a one-line receipt in the PR, not a
standing allowlist, since a standing one recreates the hole.

## Acceptance criteria

- A PR that raises any counter in a gated mark register fails CI, naming the
  register, the key, and the before/after values.
- Lowering, adding a new key, and removing a key all stay green.
- The override path is exercised by a test and requires an explicit per-PR
  receipt; there is no standing allowlist.
- Covers at minimum `assertion-mismatch-mark.json` and
  `extra-surface-mark.json`; the register list is stated in one place so adding
  a register to it is a one-line change.
