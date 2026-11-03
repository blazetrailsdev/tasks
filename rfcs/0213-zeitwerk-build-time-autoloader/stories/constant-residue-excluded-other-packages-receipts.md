---
title: "constant-residue-excluded-other-packages-receipts"
status: blocked
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-03T13:56:40Z"
assignee: "constant-residue-excluded-other-packages-receipts"
blocked-by: "waiting on trails#9665 (seatable-only excluded lists) to merge; the 112-key set does not exist on main yet"
closed-reason: null
---

## Context

trails#9665 limited `scripts/api-compare/constant-residue.json`'s `excluded` lists to walked exports that `placement` can seat, which brought them to 112 keys, and converged activerecord's 6. The other packages' keys are still exempt through the base-record `before` set in `unreceiptedExclusions` (`scripts/api-compare/class-paths.ts`):

- actionpack (4)
- actionview (3)
- activesupport (51)
- arel (2)
- globalid (2)
- mail (1)
- mini-magick (3)
- msgpack (6)
- net-smtp (8)
- raabro (1)
- rack (1)
- rake (2)
- solid-cable (2)
- solid-queue (11)
- thor (1)
- trailties (8)

## Acceptance criteria

- Each key above is renamed or moved to the Rails constant it ports, deleted if it is invented and unused, or given a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt at its declaration.
- Once every package's keys carry a receipt, `unreceiptedExclusions` drops the `before` exemption, so every excluded key needs a receipt.
- `pnpm parity:class-paths --check` stays green.
