---
title: "Close RFC 0162 — remaining call baselines and residue"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "metal-base-call-baselines-to-zero",
    "strong-parameters-missing-methods-and-invented-surface",
    "port-request-forgery-protection-skips-token-storage",
    "port-small-metal-test-files",
    "port-redirect-send-file-and-metal-remainders",
    "port-params-wrapper-tests",
    "port-caching-test-skips",
    "port-base-flash-and-log-subscriber-skips",
    "port-helper-test",
    "port-filters-test-remainder",
    "port-respond-to-test-remainder-and-accept-format",
    "port-api-controller-tests",
    "port-render-test-etag-head-and-http-cache",
    "port-http-token-and-digest-authentication-tests",
    "port-new-base-bare-metal-base-and-middleware-tests",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the other stories, these call baseline shards under
`scripts/api-compare/call-mismatches-exclude/actioncontroller/` remain:
`metal/strong-parameters.json` (17), `metal/params-wrapper.json` (3) and one row
each in `metal/data-streaming.json`, `metal/flash.json`,
`metal/mime-responds.json` and `metal/redirecting.json`, plus whatever the
request-forgery test stories leave in `metal/request-forgery-protection.json`.

## Acceptance criteria

- Each row is converged in the TS body and deleted by hand; marks are tightened.
  No reseed.
- A row that cannot converge carries a `PERMANENT` receipt only where CLAUDE.md
  already ratifies the shortcoming; anything else is filed as a story first.
- Every Verification bullet in the RFC README holds.
