---
title: "Golden images drift as the port tree moves"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`golden.test.ts` (added by #5815) asserts each target's generated JS against a
checked-in image. But the generated image is not a pure function of the Rails
source: `asyncMethodsForRailsFile`
(`scripts/prism-codegen/async-source.ts:130-144`) derives each method's
`async`/`await` shape by reading the live port tree at
`packages/activerecord/src`. Every merged ActiveRecord PR that changes a port
method's async-ness silently invalidates the images.

Measured during #5816: regenerating the goldens on a branch rebased onto
then-current `main` changed 83 lines, of which only 29 were that branch's
delegation work — the other 57 were pre-existing drift, i.e. `golden.test.ts`
was already failing on `main` with no branch involved. The split was confirmed
by stubbing `collectDelegations` to return an empty table, regenerating (57
lines), then regenerating normally (83).

The cost lands on unrelated authors: any prism-codegen PR inherits a red
golden test and must refresh images it did not cause, which both hides real
image changes in review and makes the snapshot diff a poor signal.

Note `golden.test.ts` skips itself when `vendor/` is absent
(`vendoredRailsPresent`), so the drift is only visible in the
`rails-comparison` CI job, not `unit-tests`.

## Acceptance criteria

- Decide and implement one of: (a) pin the async input so the image is a pure
  function of the Rails source plus a checked-in manifest, (b) drop the
  async/await layer from the golden image and assert it separately, or
  (c) make the drift self-healing (regenerate-and-diff in CI with a clear
  failure only for non-async changes).
- After the change, a no-op branch off `main` produces an empty golden diff.
- `pnpm vitest run scripts/prism-codegen/golden.test.ts` passes on `main` with
  no `-u`.
- Document in the story or a code comment why the chosen option keeps the
  image a meaningful review signal.
