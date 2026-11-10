---
title: "Port rack's spec_static dot-segment admin-header tests"
status: done
updated: 2026-11-10
rfc: "0228-small-gem-tail-parity"
cluster: null
packages:
  - "rack"
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: trails#9965
claim: "2026-11-10T20:19:53Z"
assignee: "rack-static-dot-segment-admin-header-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.2.8/test/spec_static.rb` "applies admin header rules for a
dot-segment path" (:333), "…for a fully encoded dot-segment path" (:339),
"…for a mixed encoded dot-segment path" (:345) and "…when dot segments are
percent-encoded" (:351) are unported. They are rack 3.2's path-normalisation
hardening, so they may expose a missing `Rack::Static` arm, which is the risk
in this estimate.

## Acceptance criteria

- [ ] The four tests are ported by name in `packages/rack/test/static.test.ts`.
- [ ] A failing test is fixed in `packages/rack/lib/static.ts` when the fix is a
      ported Rack arm under 100 LOC. Otherwise the test stays `it.skip` with a
      `BLOCKED:` line naming a new story filed in this RFC, and this story closes.
