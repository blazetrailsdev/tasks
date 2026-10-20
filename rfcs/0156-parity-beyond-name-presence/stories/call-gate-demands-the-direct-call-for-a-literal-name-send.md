---
title: "parity: the call gate demands the direct call for a literal-name rbFSend"
status: draft
updated: 2026-10-20
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "A dispatch by name is spelled directly (`send`, `public_send`)" (merged
trails#9143) makes the direct member call the ported shape wherever the send's name is known
where the call is written. trails#9143 enforced that with a count ratchet
(`pnpm parity:api:sends`), which freezes the per-file count but never demands the direct call.

The call gate could demand it. `collectCalls`
(`scripts/api-compare/extract-ts-api.ts`, the `SEND_CALLEES` arm) credits
`rbFSend(recv, "literalName", …)` as a call to `literalName`, so a literal-name send is
indistinguishable from the direct call. Dropping that credit makes `parity:api:calls` red
until the body spells the call.

Measured on trails#9143's branch (forced compare, built workspace): 43 → 54 methods omitting a
Rails call, +11 rows. Ten are real divergences; one is permanent.

- `rbFSend(this.app, "call", env)` ×4 — `ShowExceptions#renderException`, trailties
  `Rack::Logger#callApp`, `Rack::Builder#toApp` and `#newFromString`, `Rack::Recursive#include`.
  Already owned by `constraints-call-dispatches-app-call` and
  `middleware-constructors-accept-call-able-app`. NOTE: `app.call(env)` is NOT the direct
  spelling for a bare function — that is `Function.prototype.call` with `env` as `thisArg` —
  which is why ruby-compat's send is there. Those two stories have to settle the typed shape
  first.
- `DatabaseTasks#migrate` — `database-tasks-migrate-sends-migration-write`.
- `AbstractAdapter#isWarningIgnored` — `abstract-adapter-warning-ignored-sends-is-match`.
- `CoreExt#toMsgpack` ×2 — `msgpack-core-ext-to-msgpack-sends-with-packer`.
- `DataStreaming#sendFileHeadersBang` — converged in trails#9143 (`stringDelete`).
- `DisableJoinsAssociationRelation#first`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/disable_joins_association_relation.rb:17-23`)
  is `records.limit(limit).first`. `records` is an Array with no `limit`, so the send is what
  raises the `NoMethodError` Rails raises; it is permanent and needs its receipt back.

This **supersedes** `call-gate-credits-rb-f-send-of-a-literal-name-as-that-call` (trails#8436),
which added the credit deliberately — its stated motivation was deleting exactly that receipt.
The owner ruled on trails#9143 against discharging the surfaced rows with
`call-mismatches-exclude` rows, so the flip cannot land until the sites above are converged.

## Converged shape

`collectCalls` does not credit a literal-name send as a call to that name; a computed name
stays Ruby's own `send` / `publicSend` (dropped by `SKIP_CALLS`).
`DisableJoinsAssociationRelation#first` carries `@missingRailsCall limit — PERMANENT` citing
the CLAUDE.md section. No new `call-mismatches-exclude` rows.

## Acceptance criteria

- [ ] The `SEND_CALLEES` arm of `collectCalls` no longer pushes the literal name; its
      `extract-ts-api.test.ts` case asserts the name is absent.
- [ ] `DisableJoinsAssociationRelation#first` carries the `PERMANENT` receipt.
- [ ] `pnpm parity:api:calls` is green with **no** rows added to `call-mismatches-exclude/`,
      which means the deps below have landed first.
- [ ] The doc comment on `SEND_CALLEES` and the closing paragraph of the CLAUDE.md section are
      updated: the call SET no longer credits the literal name.
- [ ] `call-gate-credits-rb-f-send-of-a-literal-name-as-that-call` (RFC 0179, closed) is noted as superseded in this story's closing comment.
