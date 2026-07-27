---
title: "rails-private-jsdoc gate silently no-ops when rails-api.json is absent"
status: in-progress
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 14
pr: 5423
claim: "2026-07-27T16:15:19Z"
assignee: "rails-privates-manifest-silently-empty-without-api-compare-output"
blocked-by: null
closed-reason: null
---

## Context

`pnpm lint` regenerates `eslint/rails-private-methods.json` from
`scripts/api-compare/output/rails-api.json`. Both paths are gitignored
(`.gitignore:26` and `.gitignore:5`), and `rails-api.json` only exists after
someone runs `pnpm api:compare` in that worktree.

When it is absent, `scripts/build-rails-privates-manifest.ts` prints
`missing; wrote empty manifest` and continues, so the
`blazetrails/rails-private-jsdoc` ESLint rule runs against an EMPTY name list
and reports nothing. The gate silently passes rather than failing loudly.

Observed while working PR #5298: `pnpm lint` was clean in a fresh worktree,
then after `pnpm api:compare` populated the manifest (604 files, 4975 names)
the same `pnpm lint` reported 3 real violations in a file that PR did not
touch:

```text
packages/activerecord/src/relation/delegation.ts
  338:1  error  `generatedRelationMethods` is private/protected in Rails...
  352:1  error  `includeRelationMethods` is private/protected in Rails...
  465:1  error  `relationClassFor` is private/protected in Rails...
```

So the rule's effectiveness depends on an untracked local artifact. Whether CI
is currently enforcing it at all needs checking — `main` is green, which
suggests the CI lint job runs without the artifact and therefore with an empty
manifest. Same failure mode likely applies to the sibling manifests built by
`build-rails-tosql-manifest.ts` and `build-rails-file-structure-manifest.ts`,
which print equivalent "missing" messages.

Related but distinct from `api:compare does not run the wide ratchet lint`.

## Acceptance criteria

- [ ] Determine whether the CI lint job has `rails-api.json` available; state
      the finding in the PR body.
- [ ] A missing `rails-api.json` fails loudly (non-zero exit with a message
      naming `pnpm api:compare`) instead of writing an empty manifest and
      letting the rule no-op — or, if an empty manifest is legitimate for some
      callers, the ESLint rule itself errors when its manifest is empty.
- [ ] Audit the sibling builders (`build-rails-tosql-manifest.ts`,
      `build-rails-file-structure-manifest.ts`,
      `build-rails-error-manifest.ts`) for the same silent-empty path.
- [ ] The 3 `relation/delegation.ts` violations above are either fixed with
      `@internal` tags or filed separately; do not leave the gate red.
