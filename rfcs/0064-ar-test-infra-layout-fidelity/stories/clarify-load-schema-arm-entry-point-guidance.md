---
title: "Make loadAdapterSpecificSchema's arm-cover carve-out unmissable"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 5695
claim: "2026-07-31T00:57:04Z"
assignee: "clarify-load-schema-arm-entry-point-guidance"
blocked-by: null
closed-reason: null
---

## Context

`loadAdapterSpecificSchema` (`packages/activerecord/src/support/load-schema-helper.ts:544`)
carries a docstring warning that "reaching for this arm alone is exactly how
the two halves of `load_schema` drifted apart before", followed by a carve-out
noting it "is exported for the trails-only tests that pin the arm's own
content".

The warning reads as an unconditional ban and the carve-out is easy to miss.
PR #5676 acted on the warning and rewrote
`packages/activerecord/src/support/load-schema-helper-uuid-default.trails.test.ts`
to call `loadSchema` instead — which broke it. That cover proxies `createTable`
to capture emitted DDL _without_ laying anything on the shared per-worker
database, so `loadSchema` running `loadCanonicalSchema` first means the tables
are never really created and the first canonical statement referencing one dies
with `StatementInvalid: relation "1_need_quoting…" does not exist`.

PR #5688 reverted it to `loadAdapterSpecificSchema`. The trap is expensive to
diagnose because it is PG-lane-only: the unit lane stays green, and the
signature-correct-but-wrong intermediate (`loadSchema(probe)` instead of
`loadSchema(async () => probe)`) typechecks cleanly, so only CI catches it.

## Acceptance criteria

- The docstring leads with the carve-out condition rather than the ban, so a
  reader can tell in one pass which entry point a given test needs. Concretely:
  a test that stubs or proxies a DDL emitter to assert on emitted SQL must call
  the arm directly; only a test that really lays schema calls `loadSchema`.
- The rule is discoverable from the call site, not just the definition — either
  a short note in the arm-cover tests themselves or a lint rule that flags
  `loadSchema` in a file that stubs `createTable`.
- No behavior change to `loadSchema` or `loadAdapterSpecificSchema`.
