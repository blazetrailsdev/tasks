---
rfc: "0064-ar-test-infra-layout-fidelity"
title: "AR test-infra layout fidelity"
status: draft
created: 2026-07-08
updated: 2026-07-08
owner: "@your-handle"
packages: []
clusters: []
---

## Problem

Rails' AR test suite centralizes suite-wide setup in `activerecord/test/cases/helper.rb`
(required by every test file). In trails those responsibilities are **split across
multiple files** with a `test-setup-*` naming convention, and `test-setup-ar.ts` has
quietly become a _partial_ `helper.rb` mirror — it already ports specific helper.rb lines
(`:29` delegate-base ban, `:40` invert plural associations, `:42` raise-on-readonly, and
now `:98-102` encryption config, added in PR #4791 / RFC 0055).

This RFC scopes whether/how to align the AR test-infra layout with Rails' `test/cases/`
structure so the correspondence is discoverable and not ad hoc.

## Non-goals

- No behavior change to the test harness. Layout/organization only.
- Not a rename-for-rename's-sake: the first story is a spike that may conclude "leave as is."

## Notes

- Mechanism differs: trails uses vitest `setupFiles` (auto-run) vs Rails' explicit
  `require "cases/helper"`. Any layout mapping must account for that.
- Sibling convention exists: `test-setup-worker-db.ts`, `test-setup-mysql.ts`,
  `test-setup.ts` (the non-AR `other` project). A partial rename fragments it.
