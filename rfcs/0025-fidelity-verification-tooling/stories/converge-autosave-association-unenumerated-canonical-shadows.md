---
title: "Converge the autosave-association canonical shadows no pass enumerates"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while verifying PR #5249 (pass 3 of the
`converge-autosave-association-bespoke-registermodel-canonical-shadows`
burndown).

Arming the guard by temporarily adding
`import "./test-helpers/canonical-model-index.js"` to
`packages/activerecord/src/autosave-association.test.ts` leaves these names still rejected
(on top of main plus that PR) by `guardCanonicalNameShadow`
(`packages/activerecord/src/associations.ts:284`):

    Company, Customer, Eye, Firm, Owner, Parrot, Person, Pirate,
    PostWithAfterCreateCallback, Ship, User

The final pass, `converge-autosave-association-remaining-canonical-shadows-arm-guard`,
enumerates only Company / Client / Customer / Order / Person / Reference /
Widget / Owner / Profile / User. So **Eye, Firm, Parrot, Pirate, Ship and
PostWithAfterCreateCallback are in no pass's site list** — the final pass will
not be able to meet its own acceptance criterion of importing the canonical
model index and staying green.

Note that Pirate / Ship / Parrot still collide even though
`converge-autosave-association-pirate-ship-bird-parrot-shadows` is done, so that
pass's site list was also incomplete rather than these being new regressions.

`PostWithAfterCreateCallback` is a canonical model
(`test-helpers/models/post.ts:875`) registered one line below the habtm site
converged by #5249; it was left alone there to keep that PR scoped to its own
story.

## Acceptance criteria

- Re-derive the live collision list by arming the guard, rather than trusting
  the line numbers above.
- Each remaining site uses the canonical model (read the corresponding Rails
  test in `vendor/rails/activerecord/test/cases/autosave_association_test.rb`
  first; do NOT rename tests), or a distinct non-canonical name where no
  canonical model fits.
- Watch for derived-name fallout when renaming: `associationForeignKey`
  (`reflection.ts:1106`) derives the join-table column from `className`, and a
  habtm rename silently breaks the join against the canonical table unless the
  option is made explicit (this bit #5249 on `Category`).
- Existing tests stay green.
- Either fold this into
  `converge-autosave-association-remaining-canonical-shadows-arm-guard` or land
  it before that story, which cannot finish without it.
- 500 LOC ceiling; single PR from `main`, no stacking.
