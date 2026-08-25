---
title: "B6: converge the non-AR package residual"
status: closed
updated: 2026-08-08
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Out of scope: RFC 0084 rescoped to activerecord and its dependencies (activerecord, arel, activesupport); actiondispatch and actioncontroller dropped from the RFC's packages list. The non-AR call-set burndown is still real work — refile under an RFC that owns actionpack if it is wanted."
---

## Context

Residual entries outside activerecord: `actiondispatch/routing/mapper.ts`
(~81), `actiondispatch/routing/route-set.ts`, `actioncontroller/base.ts` (~66),
`actioncontroller/metal/strong-parameters.ts` (~41),
`activesupport/callbacks.ts`, plus small counts in rack, actionview, trailties,
globalid and abstractcontroller.

Lowest priority in the RFC: these packages are far from method parity overall
(trailties is at 27%, actionpack packages are mid-port), so wide call-shape
fidelity is not the binding constraint on their quality. Sequenced last so it
does not compete with AR work.

## Acceptance criteria

- Re-measure with `--report` before planning.
- Confirm the target file is actually ported far enough for call-shape fidelity
  to be meaningful — an entry against a stub or a partial port should be closed
  as premature, not converged.
- Split into ~4 PRs by package, non-overlapping files, registered as follow-up
  stories.
- Each converged body verified against its vendored Rails counterpart and the
  corresponding Rails test file.

- **Check for an existing owner before claiming any slice.** The 2026-07-30
  survey found that 42% of open fidelity stories already own a file the wide
  list flags. If an open story in another RFC owns the file, the wide row
  belongs there as an acceptance criterion — not in a second campaign against
  the same file.
