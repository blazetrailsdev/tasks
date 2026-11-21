---
title: "activestorage-empty-attachment-error-ruling"
status: blocked
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-21T21:31:42Z"
assignee: "action-pack-assertions-park-criterion-drops-builder-three"
blocked-by: "operator decision: read a JS TypeError as NoMethodError in resolve_asset_source (RFC 0255 open question 2)"
closed-reason: null
---

## Context

Split from `activestorage-empty-attachment-and-cloud-service-registers` (whose cloud-service
half landed). Three activestorage "error when attachment's empty" tests stay parked because a
call on `nil` is a JS `TypeError`. `resolve_asset_source` rescues `NoMethodError` into
`ArgumentError` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:621-622`),
and `packages/activemodel/lib/attribute-mutation-tracker.ts:165` already reads a `TypeError`
as Ruby's `NoMethodError`. Needs the operator's ruling on that precedent (RFC 0255 open question 2).

## Acceptance criteria

- [ ] The operator rules on reading `TypeError` as `NoMethodError` in `resolve_asset_source`.
- [ ] If accepted, the three tests run and pass with the rescue receipted `@inventedArm`; if refused, they are `PERMANENT-SKIP:` citing the ruling.
