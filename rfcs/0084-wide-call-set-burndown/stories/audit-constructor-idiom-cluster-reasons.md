---
title: "audit-constructor-idiom-cluster-reasons"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6374
claim: "2026-08-11T19:33:34Z"
assignee: "audit-constructor-idiom-cluster-reasons"
blocked-by: null
closed-reason: null
---

## Context

Seven `call-mismatches-exclude` rows carry this reason verbatim:

> Constructor idiom: Ruby `X.new` ports to TS `new X()`, which extractCalls
> records as a construction/type reference rather than a named call. The
> construction is present in the port. Cluster-vetted: representative entries in
> this cluster were read against the vendored Rails body; the rest share the same
> mechanism and were classified by it, not line-diffed individually.

**The mechanism it names does not exist.** `extract-ts-api.ts:2919-2921` records
`constructor` for every `new X(...)` it walks, and `rubyMethodToTs("new")` is
`["constructor"]` — so a TS body that constructs what Rails constructs already
satisfies the flag. A row that survives therefore means the construction is
NOT in that body, which is the opposite of what the reason asserts.

Confirmed on one: `activemodel/attribute-methods.json`
`generated_attribute_methods`. Rails (`activemodel/lib/active_model/attribute_methods.rb:400-402`)
builds `Module.new.tap { ... }`; the port
(`packages/activemodel/src/attribute-methods.ts:467-469`) is
`return this._generatedMethods` — no construction at all. That is convergeable
work wearing a permanent-equivalent justification, exactly the hazard RFC 0080's
`audit-existing-tags-for-convergeable-surface` exists for.

The cluster was classified by mechanism rather than line-diffed ("the rest share
the same mechanism"), so the whole cluster is suspect, not just this row.

Rows (7, across 5 files):

- `actiondispatch/http/request.json` — `GET`, `POST`, `initialize`
- `actiondispatch/middleware/exception-wrapper.json` — `build_backtrace`
- `actiondispatch/system-testing/driver.json` — `initialize`
- `activemodel/attribute-methods.json` — `generated_attribute_methods`
- `activerecord/connection-adapters/abstract/query-cache.json` — `query_cache`

## Acceptance criteria

- Every row line-diffed against its vendored Rails body, individually — the
  cluster's own "classified by mechanism" shortcut is what this story undoes.
- Rows whose TS body really is missing the construction CONVERGE (make the body
  construct what Rails constructs), or, if a convergence is too big for this PR,
  get a story of their own with the Rails `file:line` and a corrected reason.
  Do NOT re-baseline one under the current wording.
- Any row that survives carries a reason naming the ACTUAL mechanism; the
  "extractCalls records a construction rather than a named call" sentence is
  deleted repo-wide, since it is false.
- `parity:api:calls` row count strictly shrinks; `parity:api:reasons` and
  `parity:api:detached` stay green.
