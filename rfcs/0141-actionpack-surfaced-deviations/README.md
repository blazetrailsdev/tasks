---
rfc: "0141-actionpack-surfaced-deviations"
title: "actionpack surfaced deviations — the package's standing convergence bucket"
status: draft
created: 2026-09-08
updated: 2026-09-09
owner: "@deanmarano"
packages:
  - "actionpack"
clusters:
  - "action-controller"
  - "test-harness"
  - "http-middleware"
related-rfcs:
  - "0104-twitter-app-full-stack-integration"
  - "0142-trailties-surfaced-deviations"
  - "0139-actiondispatch-journey-parity"
  - "0140-actionview-rendering-core"
priority: 2
---

# RFC 0141 — actionpack surfaced deviations

## Summary

The standing convergence bucket for `packages/actionpack/**`: divergences
surfaced by porting work elsewhere, each one a named Rails `file:line` against a
named trails `file:line`. It runs no campaign of its own — it is the home a
surfaced actionpack deviation goes to when no active RFC owns its subsystem, and
it is the actionpack half of RFC 0104's sunset.

## Motivation

CLAUDE.md tells an agent that finds a new deviation to file it "against the
best-fit active RFC, else the `<package>-surfaced-deviations` bucket for the
package it is about". For arel and activemodel that instruction resolves
(`0124-arel-surfaced-deviations`, `0134-activemodel-surfaced-deviations`, both
now closed). **For actionpack it dead-ended.** No such bucket existed, so
findings went to whichever RFC the finding agent happened to be working under.

They went to RFC 0104. That RFC was chartered to make one application boot route
→ controller → view → HTML, and it did: `execute-tse-templates` (#7281) and
`wire-implicit-render-into-controller-dispatch` (#7305) closed the two
bottlenecks its README names, and 102 of its 188 stories are done. But the
integration work surfaced deviations faster than it consumed them, and with no
package bucket to file them in, 0104 reached 188 stories — past what one active
RFC can be scheduled as, and 74 of its 77 open stories were package fidelity
work rather than integration work.

### Evidence

Measured 2026-09-08 against trails `main` (`9c54a7962f`):

| Figure                                                    | Value  |
| --------------------------------------------------------- | ------ |
| RFC 0104 stories at sunset                                | 188    |
| — done                                                    | 102    |
| — open (`ready` + `draft` + `blocked`)                    | 77     |
| — open stories actually about an example application      | 3      |
| Open stories carried here                                 | 27     |
| Estimated LOC carried here (median-imputed for 2 unsized) | ~3,560 |
| Open actionpack stories with a falsified premise          | **0**  |

That last row is the load-bearing one. Every carried story was verified against
`main` before rehoming, and none had a stale premise, because 0104's own
`resweep-rfc-0104-story-context-against-main` (#7437) swept the set on
2026-09-03. This bucket inherits a live backlog, not a lapsed one.

## Design

### Scope

In scope: any divergence in `packages/actionpack/**` between a ported member and
its Rails counterpart — a missing arm, an invented helper, a wrong error class, a
collapsed registry, an eagerly-assigned ivar — where no active RFC owns the
subsystem.

Out of scope, because another active RFC owns them:

| Subsystem                                                           | Owner    |
| ------------------------------------------------------------------- | -------- |
| `action_dispatch/journey/**` and the routing layer feeding it       | RFC 0139 |
| ActionView rendering core, and anything in `packages/actionview/**` | RFC 0140 |
| Repo-wide arm/guard parity as a measured axis                       | RFC 0113 |
| Repo-wide error-class and message parity ledgers                    | RFC 0111 |
| A deviation blocked on an unported subsystem                        | RFC 0123 |

A story that would sit in one of those belongs there, not here. The boundary is
checked at filing time, not at claim time.

### Clusters

`cluster:` carries the theme, so `tasks next-bundle --cluster` still packs
coherent bundles out of a flat bucket. The three are drawn on Rails' own file
tree, not on convenience:

- **`action-controller`** (`action_controller/**`) — `Metal` and `Base`: the
  response surface, params, rendering, conditional-GET cache control, data
  streaming, helpers, cookies, `url_options`, `Live::Buffer`.
- **`test-harness`** (`action_controller/test_case.rb`,
  `action_dispatch/testing/**`) — the test-side ports and the invented
  assertions on them.
- **`http-middleware`** (`action_dispatch/http/**`, `middleware/**`) — the Mime
  registry, parameter parsing, `MiddlewareStack`, `DebugExceptions`,
  `ExceptionWrapper`.

### Carried in

27 stories carried from RFC 0104 on 2026-09-08 — 17 `action-controller`, 3
`test-harness`, 7 `http-middleware`.

The rehome batch, by cluster — these are the ids step 2 moves and step 3 stamps:

**`action-controller`** (17)

- `action-controller-cookies-returns-the-request-cookie-jar`
- `actioncontroller-middleware-stack-build-branches-on-a-non-string-action`
- `controller-url-options-ignores-the-request`
- `converge-metal-status-setter-onto-response-status`
- `helper-name-error-has-no-did-you-mean`
- `live-buffer-does-not-extend-response-buffer`
- `metal-body-and-header-accessors-are-invented`
- `metal-params-assigned-eagerly-in-dispatch`
- `model-response-cache-control-hash-for-expires-in-and-fresh-when`
- `port-action-controller-helpers-and-the-inherited-hook`
- `port-helper-attr`
- `port-mime-alltype-singleton`
- `port-the-controller-helper-proxy`
- `port-wrap-parameters-class-macro`
- `render-to-string-snapshots-the-response`
- `send-data-and-send-file-do-not-render`
- `send-file-headers-raises-typeerror-not-argumenterror`

**`test-harness`** (3)

- `integration-process-splits-host-with-invented-ipv6-helper`
- `remove-invented-integration-test-assertions`
- `test-case-process-rebuilds-the-request-instead-of-reusing-it`

**`http-middleware`** (7)

- `debug-exceptions-x-cascade-pass-branch-not-ported`
- `middleware-stack-build-instrumented-and-instrumentation-proxy-not-ported`
- `middleware-stack-use-drops-rails-block-argument`
- `mime-registry-splits-into-lookup-and-extension-lookup`
- `parse-formatted-parameters-guard-and-parser-key`
- `port-application-env-config-for-action-dispatch-keys`
- `source-fragment-resolves-against-cwd-not-rails-root`

Four 0104 stories were closed rather than carried, as duplicates. Each one's
unique acceptance criteria were folded into its survivor first:

| Closed                                                     | Survivor                                                |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| `port-application-env-config`                              | `port-application-env-config-for-action-dispatch-keys`  |
| `mime-type-register-collapses-lookup-and-extension-lookup` | `mime-registry-splits-into-lookup-and-extension-lookup` |
| `journey-route-verb-carries-all-sentinel`                  | 0139's `route-verb-all-sentinel-vs-empty-string`        |
| `journey-route-app-seated-after-construction`              | `routing-route-class-has-no-rails-counterpart` (→ 0139) |

## Non-goals

- **Driving actionpack to a parity percentage.** This is a deviation bucket, not
  a campaign; it has no headline number to move. A subsystem that deserves a
  push gets its own RFC, the way Journey got 0139.
- **Porting absent Rails files.** A file trails has never ported is a porting
  story, not a surfaced deviation; it belongs to whichever campaign owns that
  subsystem.
- **Rewriting the baselines.** `call-mismatches-exclude`, `arity-exclude` and
  the extra-surface marks are only-shrink ledgers owned by their own RFCs; a
  story here may retire a row it converges, never widen one.
- **Absorbing the ActionView helper campaign.** The two asset-helper stories
  from 0104 went to RFC 0140 as seeds; helpers are `packages/actionview/**`.

## Alternatives considered

- **Close RFC 0104 outright and drop the backlog.** Rejected: all 77 open
  premises verify against `main` today, and three carry in-code
  `CONVERGEABLE` receipts that would have to become `PERMANENT` — ratifying
  three deviations, which CLAUDE.md's "a documented deviation is debt, not
  permission" forbids.
- **Five successor RFCs, split by theme** (`actioncontroller-runtime`,
  `actiondispatch-http-and-middleware`, `trailties-boot`,
  `trailties-generators`, `actionview-helpers`). Rejected: the right partition
  at the wrong granularity — five new READMEs on top of ten active RFCs, one of
  them holding 2 stories. The themes survive as `cluster:` values instead, which
  is what `next-bundle` actually consumes.
- **One combined `actionpack + trailties` bucket.** Rejected: it reproduces
  0104's failure mode at half the size, and the two packages have disjoint
  reviewers, test lanes and Rails source trees.
- **A residual RFC 0104 keeping the example-app stories.** Rejected as a
  3-story RFC; those went to `0023-surfaced-deviations`.

## Rollout

This RFC ships no code. Its rollout is the 0104 sunset sequence:

1. **Filing (this PR).** Author this RFC and RFC 0142,
   both as package buckets; fold the four
   duplicates' criteria into their survivors; record the sunset in 0104's README.
2. **Verbs, from the main worktree after merge.** `tasks close` the 4
   duplicates; `tasks rehome` 73 stories — 27 here, 25 → 0142, 8 → 0139, 4 →
   0140, 6 → 0123, 3 → 0023.
3. **Clusters.** Set `cluster:` on the 27 carried stories by markdown PR.
4. **Close 0104.** `tasks status-set 0104-twitter-app-full-stack-integration closed`.

Ordinary story work begins at step 3; nothing here blocks a claim.

## Verification

- `pnpm tasks list --rfc <this rfc>` reports **27** stories immediately after
  step 2. The bucket is `status: draft`, so its stories do not surface in a
  ready queue until the owner flips it to `active`; `pnpm tasks ready --rfc
<this rfc>` is therefore expected to be **empty** until then.
- `pnpm tasks list --rfc 0104-twitter-app-full-stack-integration` reports **0**
  open stories, and 0104's status is `closed`.
- `pnpm validate` passes across all RFCs and stories.
- No open story in this bucket cites a Rails or trails `file:line` that does not
  resolve on `main` — the property `resweep-rfc-0104-story-context-against-main`
  (#7437) established and this RFC inherits.
- Burndown target: the bucket closes at **0 open stories with no new filing for
  a full campaign cycle**, the way 0124 and 0134 closed. It is explicitly not
  expected to reach zero on a schedule.

## Open questions

None. Two were resolved before filing, both by the RFC owner on 2026-09-08:

1. **Where do the two ActionView asset-helper stories go?** Resolved: **RFC
   0140**, as seeds for the helpers campaign its README anticipates, rather than
   here — they are `packages/actionview/**` and this bucket is actionpack.
2. **Where do the three example-app / CI stories go?** Resolved: **RFC 0023**,
   deliberately, rather than into the trailties bucket. 0023 is `postponed`, so
   they will not surface in a ready queue; that is the intended parking, and a
   single `tasks rehome` recovers them.

## Changelog

- 2026-09-08: initial RFC, filed as the actionpack half of RFC 0104's sunset.
