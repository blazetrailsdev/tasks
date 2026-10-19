---
title: "Closing sweep: every actionpack parity row is 100%, owned, or a cited PERMANENT-SKIP"
status: in-progress
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-integration-and-caching-tests-blocked-on-html-document",
    "actionpack-api-port-residue",
    "api-extractor-credits-actionpack-alias-and-define-property-members",
    "block-param-burndown-actiondispatch",
    "assertion-burndown-actionpack-residue",
    "pin-actionpack-method-bodies",
    "call-mismatch-baseline-actiondispatch-residue",
    "enroll-actionpack-in-naming-gate",
    "headers-merge-bang-single-each-dispatch",
    "url-generation-error-empty-corrections-test",
    "naming-residue-burndown-actiondispatch-last",
    "integration-test-answers-assert-select",
    "param-builder-make-params-is-hash-with-indifferent-access",
    "request-encoder-response-parsers-match-rails",
    "ruby-assertion-extractor-counts-one-ruby-version-arm",
    "screenshot-helper-relative-image-path-uses-relative-path-from",
    "test-case-instance-assert-bumps-own-assertions",
  ]
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9085
claim: "2026-10-19T18:05:13Z"
assignee: "actionpack-parity-closing-sweep"
blocked-by: null
closed-reason: null
---

## Context

RFC 0167's goal is actionpack at its ceiling on every parity script. This is the closing measurement after the other open 0167 stories land.

Baseline, trails `main` @ `87094a5097`:

- `parity:api`: actiondispatch 1799/1809 methods, files 82/83, inheritance 68/70, arity 1092/1094. actioncontroller 851/854. abstractcontroller 176/178, inheritance 3/4.
- `parity:test`: actiondispatch 1612/1670 (32 skipped, 26 unported in the five `dispatch/session/*` and `rack_cache` files), actioncontroller 1894/1949 (55 skipped), abstractcontroller 52/52.

## Acceptance criteria

- Re-run `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:test`, plus `parity:test:assertions`, `parity:api:blocks`, `parity:api:calls` and `parity:api:pins`, for the three actionpack packages.
- Every remaining non-100% row is one of:
  - a `PERMANENT-SKIP` / receipt citing a CLAUDE.md platform rule
  - a skip or missing row naming an open story in another RFC (0123, 0141, 0154, 0168, …)
  - a new story filed by this sweep
- No row is left unexplained.
- Record the final figures in the RFC changelog, then close the RFC with `pnpm tasks rfc-status 0167-actionpack-parity-gates closed`.
