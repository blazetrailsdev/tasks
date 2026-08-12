---
title: "Inline has_one replace's transaction block so the RecordNotSaved raise lives where Rails writes it"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6436
claim: "2026-08-12T19:56:51Z"
assignee: "converge-pg-supports-optimizer-hints-memo"
blocked-by: null
closed-reason: null
---

## Context

`has_one_association#replace` carries a call-set baseline row for `new`
(`scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-one-association.json`),
added by PR #6431 when the extractor stopped letting a `x.constructor` read
satisfy Ruby `new`.

Rails raises the error inside `replace`'s OWN transaction block
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:68-84`,
the `raise RecordNotSaved.new(...)` at :76). trails extracts that whole block
into a private `persistImmediate`
(`packages/activerecord/src/associations/has-one-association.ts:148-174`)
because the save must be awaited, so the construction lives one method away —
a decomposition Rails does not have (CLAUDE.md: "One Rails method is one TS
method").

## Converged shape

`replace` (or its awaitable writer) holds the `transactionIf` block inline, as
has_one_association.rb:68-84 does, and `persistImmediate` disappears. The
baseline row `replace / new` is then deleted by hand (only-shrink; never
`--write`).

## Acceptance criteria

- [ ] The `transaction_if` block body lives in the same method that opens it,
      matching has_one_association.rb:68-84.
- [ ] `persistImmediate` is gone, or its remaining callers are justified at the
      call site.
- [ ] The `replace / new` row is deleted; `pnpm parity:api:calls` green.
