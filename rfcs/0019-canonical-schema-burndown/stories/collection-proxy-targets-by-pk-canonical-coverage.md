---
title: "collection-proxy-targets-by-pk-canonical-coverage"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3759
claim: "2026-06-21T01:19:26Z"
assignee: "collection-proxy-targets-by-pk-canonical-coverage"
blocked-by: null
---

## Context

PR for `hm-collection-proxy-delete-transaction-rollback-test` rewrote
`packages/activerecord/src/associations/collection-proxy.test.ts` from scratch
on canonical schema (`Author has_many :posts`) and dropped its
`require-canonical-schema-exclude.json` entry. The original file's second
`describe` — `CollectionProxy#targetsByPrimaryKey — non-default primary keys`
(old collection-proxy.test.ts:446-537) — was NOT ported in that PR to keep it
under the 500 LOC ceiling. It covered `targetsByPrimaryKey()` across:

- a composite primary key target (`CpkTag`, PK `[region, code]`),
- a custom single-column PK target (`UuidTag`, PK `uuid`),
- a composite new record whose key parts are unassigned (skipped).

These three cases currently have NO canonical coverage. The bespoke models
(`CpkOwner`/`CpkTag`/`UuidTag`) must be replaced with canonical equivalents —
e.g. the `cpk_*` composite-PK models in `test-helpers/models/cpk.ts` and a
canonical custom-string-PK model — under `defineSchema`-free canonical setup
(`useHandlerFixtures` + canonical `TEST_SCHEMA`).

## Acceptance criteria

- [ ] Re-add the three `targetsByPrimaryKey()` non-default-PK tests to
      `collection-proxy.test.ts` using canonical composite-PK and custom-PK models
      (no bespoke tables; canonical `TEST_SCHEMA` only).
- [ ] Test names preserved verbatim from the originals where they existed.
- [ ] File stays within the 500 LOC PR ceiling.
