---
title: "no-freeform-comments leaves orphaned comment fragments"
status: draft
updated: 2026-09-03
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The package sweep (#7461, story
`enroll-remaining-packages-in-no-freeform-comments`) found two shapes
`blazetrails/no-freeform-comments` does not delete, both of which leave the
file worse than either keeping or deleting the whole comment. Neither is
reported by the rule, so `pnpm lint` is green with the fragment in place and
the next sweeper inherits it.

**1. A `//` run loses its neighbours and keeps its middle line.**
On the pre-sweep tree,
`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:126-128`
was a three-line run:

```ts
// Rails-name alias: `AbstractController::Railties::RoutesHelpers.with(...)`.
// Exported under the bare name so `parity:api` matches; the descriptive
// `withRoutesHelpers` remains the recommended import for consumers.
export { withRoutesHelpers as with };
```

`--fix` deleted lines 126 and 128 and kept 127, leaving a dangling half
sentence ending in "the descriptive". #7461 removed it by hand.
`groupLineComments` (`eslint/no-freeform-comments.mjs`) is where the run is
assembled; something splits this one into three groups and only reduces two of
them.

**2. A trailing `//` on a member is not seen at all.**
`packages/activerecord-cli/src/generate-manifest.ts:15` survived the sweep
untouched:

```ts
  isDefault: boolean; // exported as `export default class` vs a named export
```

`onlyCommentOnItsLine` is false for it, which is what keeps it out of a run —
but nothing then reports it on its own account, so a trailing comment is a
silent opt-out from the policy anywhere in the repo. #7461 removed this one by
hand; a repo-wide grep for the shape is part of this story.

Both were found by reading the sweep diff, which is the only reason they are
known — the rule reports neither.

## Acceptance criteria

- [ ] A `//` run reduces as a unit: either the whole run goes or the kept lines
      are a complete comment, never a middle line whose neighbours were deleted.
      Regression test in `eslint/no-freeform-comments.test.mjs` built from the
      `routes-helpers.ts` shape above.
- [ ] A trailing `//` after code on the same line is reported and deleted like
      any other freeform comment, with a test for the kept-directive case
      (`x; // eslint-disable-line`) alongside it.
- [ ] The repo is swept for both shapes under the enrolled trees; `pnpm lint`
      clean afterwards with no new exclusion row.
