---
title: "decide whether get#{Name} is a port candidate for a Ruby reader"
status: ready
updated: 2026-07-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 10
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

## Decision (owner, 2026-07-30): NO — a sync reader is a native JS getter

`get#{Name}` is not a legitimate port spelling. The writer case earns `set#{Name}`
because a Rails writer can block on I/O and a JS property setter cannot return a
promise; a reader that does no I/O has no such excuse. **A synchronous Ruby
reader ports to a native JS getter** — `fullSanitizer`, not `getFullSanitizer`.

So `rubyMethodToTs` is left alone, the affected names stay novel (that is the
correct signal), and the fix belongs in the ports.

## Acceptance criteria

- [ ] `rubyMethodToTs` is NOT given a `get#{Name}` candidate. Record the decision
      and the sync-reader/native-getter rule in `explainConventions()`, and
      regenerate `docs/ruby-ts-conventions.md` so the rule is documented where
      the writer rule already is; confirm `conventions-doc.ts --check` passes.
- [ ] Convert the synchronous readers to native getters (bare camel name), or
      file that conversion per file if it does not fit the LOC ceiling:
      `actionview/helpers/sanitize-helper.ts` (`getFullSanitizer`,
      `getLinkSanitizer`, `getSafeListSanitizer`, `getSanitizerVendor`),
      `rack/utils.ts` (`getDefaultQueryParser`, `getMultipartFileLimit`,
      `getMultipartTotalPartLimit`, `getParamDepthLimit`), and the remaining
      novel name in `activerecord/ar-config.ts`.
- [ ] Any reader that turns out NOT to be synchronous is called out explicitly
      rather than converted — the rule is scoped to sync readers.
- [ ] Confirm the extra-surface totals move only in the intended direction and
      no unrelated Rails reader starts matching a name that was never its port.

## Re-verified 2026-08-17 (ready sweep)

Related to the writer-pairing bug closed into
`precise-call-pairing-key-for-owner-static-and-accessor` in the draft sweep the
same day: that story fixes which member a Ruby writer pairs with, this one
decides whether readers gain a `get`-prefixed candidate at all. Sequence this
after it — the pairing fix may remove the motivating asymmetry.
