---
rfc: "0141-actionpack-surfaced-deviations"
title: "actionpack surfaced deviations — the package's standing convergence bucket"
status: active
created: 2026-09-08
updated: 2026-09-08
owner: "@deanmarano"
packages:
  - "actionpack"
clusters:
  - "action-controller"
  - "test-harness"
  - "http-middleware"
related-rfcs:
  - "0104-twitter-app-full-stack-integration"
  - "0139-actiondispatch-journey-parity"
  - "0140-actionview-rendering-core"
priority: 2
---

# RFC 0141 — actionpack surfaced deviations

## Summary

The standing convergence bucket for `packages/actionpack/**`: divergences
surfaced by porting work elsewhere, each one a named Rails `file:line` against a
named trails `file:line`. It owns no campaign of its own — it is the home a
surfaced actionpack deviation goes to when no active RFC is a better fit.

## Motivation

CLAUDE.md tells an agent that finds a new deviation to file it "against the best
-fit active RFC, else the `<package>-surfaced-deviations` bucket for the package
it is about". For arel and activemodel that instruction resolves
(`0124-arel-surfaced-deviations`, `0134-activemodel-surfaced-deviations`, both
now closed). **For actionpack it dead-ended**, and the findings went to whichever
RFC the agent happened to be working under.

They went to RFC 0104. That RFC was chartered to make one application boot route
→ controller → view → HTML, and it did: `execute-tse-templates` (#7281) and
`wire-implicit-render-into-controller-dispatch` (#7305) closed the two
bottlenecks its README names, and 102 of its 188 stories are done. But the
integration work surfaced deviations faster than it consumed them, and with no
package bucket to file them in, 0104 grew to 188 stories — far past what one
active RFC can be scheduled as.

This RFC is half of that sunset (RFC 0142 is the trailties half). It exists so
the next surfaced actionpack deviation has somewhere to go that is not the
largest open RFC.

## Scope

In scope: any divergence in `packages/actionpack/**` between a ported member and
its Rails counterpart — a missing arm, an invented helper, a wrong error class, a
collapsed registry, an eagerly-assigned ivar — where no active RFC owns the
subsystem.

Out of scope, because another active RFC owns them:

| Subsystem                                            | Owner    |
| ---------------------------------------------------- | -------- |
| `action_dispatch/journey/**` and the routing layer feeding it | RFC 0139 |
| ActionView rendering core, and anything in `packages/actionview/**` | RFC 0140 |
| Repo-wide arm/guard parity as a measured axis         | RFC 0113 |
| Repo-wide error-class and message parity ledgers      | RFC 0111 |

A story that would sit in one of those belongs there, not here.

## Clusters

`cluster:` carries the theme, so `tasks next-bundle --cluster` still packs
coherent bundles out of a flat bucket:

- **`action-controller`** — `ActionController::Metal` and `Base`: the response
  surface, params, rendering, conditional-GET cache control, data streaming,
  helpers, cookies, `url_options`, `Live::Buffer`.
- **`test-harness`** — `ActionController::TestCase` and
  `ActionDispatch::Integration::Session`: the test-side ports and the invented
  assertions on them.
- **`http-middleware`** — `ActionDispatch::Http` and `middleware/**`: the Mime
  registry, parameter parsing, `MiddlewareStack`, `DebugExceptions`,
  `ExceptionWrapper`.

## Carried in

27 stories carried from RFC 0104 on 2026-09-08, on that RFC's sunset. Every one
was verified against `main` (`9c54a7962f`) at carry-in: none had a falsified
premise, because 0104's own
`resweep-rfc-0104-story-context-against-main` (#7437) had swept them on
2026-09-03.

Four 0104 stories were closed rather than carried, as duplicates:
`journey-route-verb-carries-all-sentinel` (duplicate of 0139's
`route-verb-all-sentinel-vs-empty-string`), `port-application-env-config`
(subsumed by `port-application-env-config-for-action-dispatch-keys`),
`mime-type-register-collapses-lookup-and-extension-lookup` (merged into
`mime-registry-splits-into-lookup-and-extension-lookup`), and
`journey-route-app-seated-after-construction` (subsumed by
`routing-route-class-has-no-rails-counterpart`, which folds the class away).

## Done when

The bucket is never "done" in the way a campaign is — it is a standing home. It
closes when actionpack has no open surfaced deviation and no new one has been
filed for a full campaign cycle, the way 0124 and 0134 closed.
