---
title: "Rack::Multipart::UploadedFile has no tempfile or filename reader — port method_missing delegation instead"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

Surfaced by PR #7145 (RFC 0121 enrollment of `rack`).

`packages/rack/src/multipart/uploaded-file.ts` publishes two readers that
`Rack::Multipart::UploadedFile` does not declare, and PR #7145 had to give each
a `@noRailsEquivalent CONVERGEABLE` receipt to enrol the package:

- `get tempfile()` — Rack reaches `@tempfile` through `method_missing`
  (`vendor/rack/lib/rack/multipart/uploaded_file.rb:39`), which forwards every
  unknown call to the tempfile object. There is no `tempfile` reader; calling
  `uf.tempfile` in Ruby would forward to `@tempfile.tempfile` and raise
  `NoMethodError`.
- `get filename()` — the class exposes `original_filename` only
  (`uploaded_file.rb:10`, `attr_reader :original_filename`). The TS getter is
  documented in-tree as a "compat shim for callers that read `filename`
  directly (e.g. the existing Rack tests)".

Both receipts are debt, not permission (CLAUDE.md, "A documented deviation is
debt, not permission").

## Converged shape

- Port `method_missing` with the settled trails idiom so `@tempfile` delegation
  works the way `uploaded_file.rb:35-41` does (`respond_to?` + `method_missing`
  forwarding), and delete the `tempfile` getter.
- Delete the `filename` getter and move its callers to `originalFilename`.
  `packages/rack/src/request.test.ts:1196` is the one site that reads it off an
  `UploadedFile`; the many other `.filename` reads in `multipart.test.ts` and
  `request.test.ts` are on the plain params hash `MimePart#getData` builds
  (`vendor/rack/lib/rack/multipart/parser.rb:123`), which legitimately has a
  `filename` key and is not affected.
- Remove both `@noRailsEquivalent` tags. Re-run
  `pnpm exec tsx scripts/api-compare/extra-surface.ts` (exit 0, no STALE tag)
  and the two RFC 0121 rules over `packages/rack/src/**/*.ts`.

## Acceptance criteria

- [ ] No `@noRailsEquivalent` remains in
      `packages/rack/src/multipart/uploaded-file.ts`.
- [ ] Delegation to the underlying tempfile mirrors `uploaded_file.rb:35-41`.
- [ ] `extra-surface.ts` exits 0 and `parity:api` deltas are non-negative.
