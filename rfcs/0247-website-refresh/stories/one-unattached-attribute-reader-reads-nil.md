---
title: "Attached::One: an unattached One reads null for Attachment/Blob attribute readers"
status: done
updated: 2026-11-24
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10685
claim: "2026-11-24T00:29:46Z"
assignee: "one-unattached-attribute-reader-reads-nil"
blocked-by: null
closed-reason: null
---

## Context

trails#10641 converged `Attached::One`'s `delegate_missing_to :attachment, allow_nil: true`
(`vendor/rails/v8.0.5.2/activestorage/app/models/active_storage/attached/one.rb:27`; nil arm in
`activesupport/lib/active_support/delegation.rb` `generate_method_missing`). On an unattached `One`, the Proxy trap
in `packages/activestorage/lib/attached/one.ts` walks `ActiveStorage.Attachment` / `ActiveStorage.Blob` prototypes:
a non-function member reads `null`, any other name answers `() => null`. Generated attribute readers
(`blobId`, `recordType`, `key`, `filename`…) are not on the prototype until the attribute methods are defined, so
before that point a read of one gets a function, not `null`. This was not verified.

## Acceptance criteria

- Check whether `Attachment` / `Blob` attribute readers are on the prototype when an unattached `One` is read.
- If they are not, an unattached `one.blobId` / `one.filename` reads `null` (Ruby: `nil`), with a test in
  `test/attached/one.trails.test.ts`.
