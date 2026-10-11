---
title: "duck-type report: an instanceof list behind a same-file helper hides the pair"
status: draft
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:duck-types` (`scripts/api-compare/report-duck-type-instanceof.ts`) lists a pair whose
Rails body asks `respond_to?` / `acts_like?` and whose port guards with `instanceof`. The two halves
read different scopes:

- The "does the port call `rbObjRespondTo` / `actsLike`" half reads the TS skeleton stream with the
  pair's same-file helpers spliced in (`unportedDuckTests`, through `spliceHelperSkeletons`).
- The "does the port guard with `instanceof`" half (`declaresInstanceofGuard`) searches only the
  declaration named `tsName`.

So a body that moves its class list into a same-file helper drops out of the report. That happened on
trails#8791: `abstract/quoting.ts#quotedDate` asked a file-local `actsLikeTime(value)` (five
`instanceof` checks) where `connection_adapters/abstract/quoting.rb:185` asks `value.acts_like?(:time)`,
and the report stopped listing it once the body's own `instanceof` was gone, while the deviation was
still there. A reviewer caught it; the report did not.

## Acceptance criteria

- [ ] `declaresInstanceofGuard` also searches the same-file helpers the pair's skeleton splices in (`row.tsHelpers`), so an `instanceof` list behind a local helper keeps the pair listed.
- [ ] A test in `report-duck-type-instanceof.test.ts` covers a body whose only `instanceof` is in a spliced helper.
- [ ] The rows the change adds are hand-audited in the PR body; the report stays report-only (RFC 0113 tripwire).
