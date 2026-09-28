---
title: "Close RFC 0164 (HTTP) — call baselines, arm-throw row and residue"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "request-mixin-bodies-onto-their-rails-files",
    "response-invented-iterators-buffer-and-missing-members",
    "request-utils-param-encoders-and-deep-munge",
    "content-security-policy-and-http-moved-names",
    "parse-formatted-parameters-guard-and-parser-key",
    "port-request-test-skips",
    "port-response-test-skips",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the other stories, these rows remain on files this RFC owns, under
`scripts/api-compare/call-mismatches-exclude/actiondispatch/`:
`http/request.json` (4), `http/param-builder.json` (3), `http/cache.json` (2),
`http/filter-parameters.json` (2), `http/content-disposition.json` (1),
`http/query-parser.json` (1) and `request/session.json` (1).

`scripts/api-compare/arm-throw-mark.json` holds one actiondispatch row,
`http/request.ts`: a body that drops a `raise` Rails makes. It is gated
(`pnpm parity:api:arms:throws`, only-shrink).

## Acceptance criteria

- Each call row is converged in the TS body and deleted by hand; marks are
  tightened. No reseed.
- The `http/request.ts` arm-throw row is converged and the mark tightened with
  `pnpm parity:api:arms:throws:tighten`, taking actiondispatch's arm-throw total
  to 0.
- Every Verification bullet in the RFC README holds.
