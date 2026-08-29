---
title: "Report-only structural detection of ruby-compat primitives re-implemented under an unrecognised name"
status: draft
updated: 2026-08-29
rfc: "0000-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["no-ruby-compat-reimplementation-lint"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The completing half of Gate 3. `no-ruby-compat-reimplementation` matches on
NAMES, so it catches every duplicate the RFC inventoried and nothing under a name
nobody has thought of. This story asks whether a structural check can close that
gap, and answers it with a measurement rather than a design argument.

Approach: normalize each exported ruby-compat function body to a shape-only form
(identifiers erased, literals preserved where they carry meaning — the
`/[.*+?^${}()|[\]\\]/g` character class in `regexpEscape` is the whole signal for
that one) and compare it against every candidate declaration in `packages/*/src`.

The reason this is report-only and separate: **the false-positive rate is
unknown until it runs.** A `key in hash ? hash[key] : d` shape is three tokens
long and will match unrelated code; a normalized `<=>` is a two-branch ternary.
A gate seeded on an unmeasured signal is a gate that gets disabled. Run it, count
the hits, classify them by hand, and let that number decide whether it can ever
gate — and if it cannot, say so and close the question.

Do not widen `no-ruby-compat-reimplementation`'s exclude JSON to accommodate
anything found here; a finding is either a real duplicate (converge it, or file a
story) or a false positive (a detector problem).

## Acceptance criteria

- A report command producing every structural match, grouped by ruby-compat
  export, with `file:line` for each candidate.
- Every hit hand-classified in the PR body as real duplicate / false positive,
  with counts and a precision figure.
- A stated recommendation, backed by that figure: gate it, keep it report-only,
  or abandon it — and if abandoned, the RFC's Gate 3 section updated to record
  that the name-based rule is the final answer and why.
- Real duplicates found are filed as stories against this RFC with their
  `file:line` (`pnpm tasks new 0000-ruby-compat <slug> --body-file …`), not
  fixed in this PR.
- Report-only: no gate turns red, no baseline or mark moves, `pnpm lint` and
  every `parity:*` command unchanged.
