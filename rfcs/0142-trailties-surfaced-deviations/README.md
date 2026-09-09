---
rfc: "0142-trailties-surfaced-deviations"
title: "trailties surfaced deviations — boot, railties and the generators"
status: active
created: 2026-09-08
updated: 2026-09-08
owner: "@deanmarano"
packages:
  - "trailties"
clusters:
  - "boot"
  - "generators"
related-rfcs:
  - "0104-twitter-app-full-stack-integration"
  - "0123-blocked-convergence-holding"
priority: 2
---

# RFC 0142 — trailties surfaced deviations

## Summary

The standing convergence bucket for `packages/trailties/**`: the application
boot path (`Engine`, `Trailtie`, `Application`, the framework railties and their
initializers) and the generator/CLI surface (`trails new`, `trails generate`,
`trails server`). Like RFC 0141 it owns no campaign — it is the home a surfaced
trailties deviation goes to.

## Motivation

The same gap RFC 0141 documents, on the other package. CLAUDE.md routes a
surfaced deviation to `<package>-surfaced-deviations`; no trailties bucket
existed, so trailties findings accumulated in RFC 0104 alongside the actionpack
ones until that RFC reached 188 stories.

trailties is where the accumulation was least visible, because most of these
stories are one initializer or one generator template deep — `Engine#app`
declared on `Application` instead of `Engine`, `active_record.set_configs`
hand-listing five of the config keys Rails applies by `send`, a `Trailtie`
subclass registry that is transitive where Ruby's `Class#subclasses` is direct.
Individually small; collectively the difference between a booted app that
matches Rails and one that only looks like it does.

## Scope

In scope: any divergence in `packages/trailties/**` between a ported member and
its Rails counterpart in `vendor/rails/railties/**` (or a vendored gem's
railtie), plus the generated output of `trails new` / `trails generate` measured
against the Rails template it mirrors.

Out of scope:

| Subsystem                                                    | Owner    |
| ------------------------------------------------------------ | -------- |
| Deviations blocked on an unported subsystem (Zeitwerk, ActionMailer, `I18n::Railtie`, `ActiveRecord::TestFixtures`) | RFC 0123 |
| `packages/actionpack/**`                                     | RFC 0141 |
| Repo-wide arm/guard and error-parity ledgers                 | RFC 0113 / 0111 |

The RFC 0123 line matters here: six 0104 stories are blocked on a subsystem
trails has not ported at all, and they went to the holding epic rather than to
this bucket, so this RFC's queue is pickup-able all the way down.

## Clusters

- **`boot`** — `Engine`, `Trailtie`, `Application`, `Railtie::Configuration`, the
  framework railties (`active_record`, `active_model`, `action_controller`,
  `global_id`), `load_defaults`, the routes reloader, `trails server`.
- **`generators`** — `Rails::Generators` lookup and invocation, `class_option`
  plumbing, the app / model / authentication / `db:system:change` generators and
  their emitted templates, and the generator testing assertions.

Example-app and CI hygiene stories are **not** carried here; they went to RFC
0023 on 0104's sunset (see below).

## Carried in

25 stories carried from RFC 0104 on 2026-09-08, on that RFC's sunset — 16
`boot` and 9 `generators`. The 3 example-app and CI stories in the same sweep
went to RFC 0023 rather than here. Every carried story was verified against `main`
(`9c54a7962f`) at carry-in and none had a falsified premise; 0104's
`resweep-rfc-0104-story-context-against-main` (#7437) had already swept the set
on 2026-09-03.

`empty-the-generated-new-and-edit-actions-once-implicit-render-lands` arrives
**newly actionable**: its stated blocker,
`wire-implicit-render-into-controller-dispatch`, landed in #7305, so the explicit
`render({ action: "new" })` calls the authentication generator emits can go back
to the empty Rails bodies.

## Done when

A standing home, closed the way 0124 and 0134 closed — when trailties has no open
surfaced deviation and none has been filed for a campaign cycle.
