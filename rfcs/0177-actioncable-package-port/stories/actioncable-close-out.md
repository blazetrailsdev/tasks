---
title: "Close out the Action Cable port: verify every file, case and gate against the RFC"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "trailties", "scripts"]
deps:
  [
    "trails-new-scaffolds-action-cable-by-default",
    "trails-dev-server-forwards-upgrade-requests-to-rack-handler",
    "actioncable-browser-client-interop-and-non-port-record",
    "port-actioncable-client-test-disconnect-and-restart-cases",
    "port-actioncable-postgresql-adapter-tests-and-ci-lane",
    "port-actioncable-redis-adapter-live-tests-and-ci-service",
    "port-actioncable-channel-base-and-rejection-tests",
    "port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests",
    "port-actioncable-channel-stream-test",
    "port-actioncable-channel-test-case-test",
    "port-actioncable-connection-test-case-test",
    "port-actioncable-connection-base-authorization-and-forgery-tests",
    "port-actioncable-connection-identifier-and-callbacks-tests",
    "port-actioncable-connection-subscriptions-test",
    "port-actioncable-connection-client-socket-and-stream-tests",
    "port-actioncable-server-base-and-health-check-tests",
  ]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last story. It ships no port; it checks the RFC's "Verification" section
line by line against `main` and fixes or files what does not hold.

- `pnpm parity:api --package actioncable`: every file at 100%, apart from
  the members in `SCOPED_SKIP_GROUPS`.
- `pnpm parity:test`: every case in the RFC's test table credited;
  `javascript_package_test.rb` unported with its reason.
- Every gate at zero for actioncable, with no baseline row, exclude shard or
  mark above zero: list the gates from
  `enroll-actioncable-in-compare-tooling-and-parity-gates` and run each.
- Every `@missingRailsCall` / `@missingRailsArgs` / `@noRailsEquivalent`
  receipt under `packages/actioncable/src` is `PERMANENT`, sits in one of
  the files the CLAUDE.md section names (or in an adapter story's listed call),
  and cites that section. A `CONVERGEABLE` receipt means an open story:
  check it exists.
- The three Tier 2 files' receipts are counted and the count is written into
  the RFC's Changelog, so the next port can compare.
- `packages/actioncable/README.md` and the root README's package list
  describe the package.
- The RFC's story count and est-loc are compared with the shipped PRs
  (additions + deletions, the ceiling's exclusions), and the comparison is
  added to the RFC's Changelog. Each story added after the seed is listed
  there with the Rails line the seed missed.

## Fidelity traps (predicted at authoring)

- [ ] **A force-refreshed compare.** Run `API_COMPARE_FORCE=1 pnpm parity:api --calls` before reading any gate; a warm cache under-reports.
- [ ] **Closing a story that code cites reds `stale-story-references`.** Check no receipt in the tree cites a story of this RFC that is done.
- [ ] **RFC status is a `tasks` verb**, not a markdown edit.

## Acceptance criteria

- [ ] Each line of the RFC's "Verification" section is checked and its result recorded in the PR.
- [ ] Anything that does not hold is fixed here if it fits, or filed as a story under this RFC with its Rails `file:line`.
- [ ] The RFC's Changelog carries the receipt count and the seed-versus-actual comparison.

## Definition of done

Raising a mark, adding a baseline row, or rewording a receipt to make a gate pass does not close this story.

## Verification

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable
pnpm parity:test && pnpm parity:test:assertions
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
grep -rnE '@(missingRailsCall|missingRailsArgs|noRailsEquivalent)' packages/actioncable/src | grep -v PERMANENT   # expect no output
```
