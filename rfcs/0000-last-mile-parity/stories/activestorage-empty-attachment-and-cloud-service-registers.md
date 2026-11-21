---
title: "activestorage: port the empty-attachment errors and register the cloud-service tests"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: small-packages
packages: [activestorage, scripts]
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

Three "error when attachment's empty" tests are parked because a miss on
`nil` is a JS `TypeError`. `resolve_asset_source` rescues `NoMethodError` into
`ArgumentError` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:621-622`),
and `packages/activemodel/lib/attribute-mutation-tracker.ts:165` already reads
a `TypeError` as Ruby's `NoMethodError`. **Needs the operator's ruling on that
precedent (RFC open question 2).** If refused, the three are PERMANENT.

The S3 / GCS / Azure tests (4 skipped, 3 missing) in
`direct_uploads_controller_test.rb`, `blobs/redirect_controller_test.rb` and
`service/configurator_test.rb` are out of scope by RFC 0209 and the owner ruling
of 2026-10-28.

## Acceptance criteria

- [ ] The three empty-attachment tests run and pass with the rescue receipted `@inventedArm` — or, if the operator refuses, are `PERMANENT-SKIP:` citing the ruling.
- [ ] The 7 cloud-service tests are unported `tests:` rows citing RFC 0209, and their skips are removed.
- [ ] `parity:test` shows activestorage at 100% of portable.

## Verification

```sh
pnpm parity:test --missing --package activestorage
```
