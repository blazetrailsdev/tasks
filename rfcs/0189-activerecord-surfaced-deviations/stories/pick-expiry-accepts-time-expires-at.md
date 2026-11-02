---
title: "pickExpiry and signedId accept a Time expiresAt"
status: draft
updated: 2026-11-02
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `expires_at:` takes a Time: `attachment_test.rb:145` passes `1.minute.from_now`, handled by `pick_expiry` (`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/metadata.rb`). `packages/activesupport/src/messages/metadata.ts` `pickExpiry` types `expiresAt` as `Temporal.Instant` and reads `epochNanoseconds`, so `Duration.minutes(1).fromNow()` raises `FloatDomainError`. `packages/activestorage/src/attachment.test.ts` uses `currentTimeInstant().add(...)` to get around it. The types in `activerecord/src/signed-id.ts` and `base.ts` `signedId` have the same restriction.

## Acceptance criteria

- `pickExpiry` and `signedId` accept the Time / TimeWithZone `Duration#fromNow` returns, as `pick_expiry` does.
- `attachment.test.ts`'s `expires_at` tests pass `Duration.minutes(1).fromNow()`.
