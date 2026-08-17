---
title: "converge-exception-wrapper-traces-partition"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6669
claim: "2026-08-17T21:02:59Z"
assignee: "converge-exception-wrapper-traces-partition"
blocked-by: null
closed-reason: null
---

# Converge ExceptionWrapper#traces onto Rails' id-tagged trace partition

## Context

`ExceptionWrapper#traces` (exception_wrapper.rb:147-172) builds three arrays of
`{exception_object_id:, id:, trace:}` hashes — `application`, `framework`,
`full` — by walking `full_trace.each_with_index` and testing
`application_trace.include?(trace)` for each line. The debug view renders those
groups (and needs the per-line ids for its toggles).

trails' `traces` getter
(packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:194-202)
returns the raw split backtrace as `string[]`: it never partitions, never tags
ids, and so never calls `applicationTrace`/`include?`. `applicationTrace`,
`frameworkTrace` and `fullTrace` are ported alongside it, so the inputs exist.

Surfaced by RFC 0106 wave 3, which recorded the divergence as a per-row
justification in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/middleware/exception-wrapper.json`
(`traces | include?`) rather than converging it in that PR's scope.

## Acceptance criteria

- [ ] `traces` returns Rails' three-key structure with per-line ids, built from
      `fullTrace` with the `applicationTrace.includes(trace)` split, in Rails'
      branch order.
- [ ] Callers/renderers of `traces` updated to the new shape.
- [ ] The `traces | include?` row is deleted from
      `call-mismatches-exclude/actiondispatch/middleware/exception-wrapper.json`
      and marks lowered via `pnpm parity:api:calls:tighten` (no `--write`).
