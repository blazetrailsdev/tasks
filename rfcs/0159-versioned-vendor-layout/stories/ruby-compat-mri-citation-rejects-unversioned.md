---
title: "ruby-compat-mri-citation-rejects-unversioned"
status: draft
updated: 2026-09-25
rfc: "0159-versioned-vendor-layout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`version-the-mri-citation-lint-and-its-resolver` taught
`eslint/ruby-compat-needs-mri-citation.mjs` the versioned form
`vendor/ruby/<version>/<file>:<line>`: `CITATION` captures an optional
`v<digit>…` segment, a segment naming anything but the lockfile's active version
(`versionDir(sources.ruby.ref)` from `vendor/sources.ts`) reports `staleVersion`
naming `pnpm vendor:recite`, and `rel` is relative to the version directory.

It deliberately still ACCEPTS an unversioned citation (resolving it against the
active version), because ~1,260 ruby-compat citations are unversioned until the
three `recite-ruby-compat-citations-*-against-mri-v3-3-11` sweeps land, and the
rule is `error` in the `rails-comparison` job (`eslint/rails-private-jsdoc.config.mjs`)
and locally whenever `vendor/ruby/` is fetched — flipping it earlier reds main
and every individual sweep slice.

## Acceptance criteria

- After all three ruby-compat recite slices have merged, an unversioned
  `vendor/ruby/<file>:<line>` citation is an error in
  `ruby-compat-needs-mri-citation`, whose message names `pnpm vendor:recite`.
- The rule's header comment about the transitional unversioned arm, and its
  reference to this story, are removed.
- `ruby-compat-needs-mri-citation.test.mjs`'s "Unversioned still resolves" valid
  case moves to `invalid` with the new messageId; the no-vendor-tree tester still
  reports nothing.
- `pnpm lint` with `vendor/ruby/` fetched reports zero rule errors across
  `packages/ruby-compat/src`.
