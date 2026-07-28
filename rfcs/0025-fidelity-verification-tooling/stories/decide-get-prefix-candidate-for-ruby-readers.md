---
title: "decide whether get#{Name} is a port candidate for a Ruby reader"
status: draft
updated: 2026-07-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

PR #5479 made `rubyMethodToTs` return `set#{Name}` as a second candidate for a Ruby
`name=` writer (after the bare camel name), on the grounds that a Rails writer
which blocks on I/O — `has_one`'s `#{name}=` persists the displacement inline,
`has_one_association.rb:59-84` — cannot be expressed by a synchronous JS
property setter but can by a promise-returning method.

That leaves the reader side asymmetric, and the asymmetry is now visible in the
extra-surface report: the `set*` half of each accessor pair scores as the port
while the `get*` half stays novel. Residual novel names after #5479:

- `actionview/helpers/sanitize-helper.ts` — 4 novel, all `getFullSanitizer` /
  `getLinkSanitizer` / `getSafeListSanitizer` / `getSanitizerVendor`
- `rack/utils.ts` — 4 novel, all `getDefaultQueryParser` /
  `getMultipartFileLimit` / `getMultipartTotalPartLimit` / `getParamDepthLimit`
- `activerecord/ar-config.ts` — the remaining 1 novel of the former 18

The decision is genuinely open and should NOT be assumed to mirror the writer
case. A Ruby reader does no I/O, so unlike the writer there is no fidelity
argument that `getX` is the _more_ faithful rendering — `getFullSanitizer` may
simply be a re-spelling of `full_sanitizer` that a bare `fullSanitizer` accessor
would render better, in which case leaving it novel is the correct signal and
the fix belongs in the ports, not the convention.

## Acceptance criteria

- [ ] Decide, with the Rails reader bodies as evidence, whether `get#{Name}` is
      a legitimate port spelling for a Ruby reader or a trails re-spelling that
      should stay novel. Record the decision and its reasoning in
      `explainConventions()` either way.
- [ ] If legitimate: add the candidate after the bare camel name (mirroring the
      writer ordering), regenerate `docs/ruby-ts-conventions.md`, and confirm
      `conventions-doc.ts --check` passes.
- [ ] If not: leave `rubyMethodToTs` alone and file the affected files' bare-name
      convergence as follow-up work.
- [ ] Either way, confirm the extra-surface totals move only in the intended
      direction and no unrelated Rails reader starts matching a `getX` that was
      never its port.
