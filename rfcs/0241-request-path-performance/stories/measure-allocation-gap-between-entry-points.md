---
title: "Explain the 108 KB versus 267 KB per-request allocation gap between profiles"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [examples]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The two allocation profiles in this RFC disagree by a factor of 2.5:

- **First profile (2026-11-13):** about 108 KB per request, on trails
  `094dec8aa8`, through a direct `perry/main.ts` entry at 3,000 users.
- **Second profile (2026-11-16):** about 267 KB per request, on trails
  `8dc7d65058`, through `trails server` at 4,000 users.

The entry point, the trails commit and the load all changed between them.
Stories compare their before and after numbers against one of these profiles,
so it has to be known which one is right.

## Acceptance criteria

- [ ] On one rig, take the allocation pass on one trails commit through both
      entry points at the same load, and record the KB per request for each.
- [ ] If the entry point explains the gap, the README says which number stories
      compare against. If it does not, file a story for the cause with its
      measured share.

## Verification

Run the allocation pass of the slim profile harness, as described in the RFC
README's "Slim profile harness" section, twice on one commit: once through `trails
server` and once through a direct entry. Record both numbers in the PR body.
