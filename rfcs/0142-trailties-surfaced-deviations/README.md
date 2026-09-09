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
  - "0141-actionpack-surfaced-deviations"
  - "0123-blocked-convergence-holding"
priority: 2
---

# RFC 0142 — trailties surfaced deviations

## Summary

The standing convergence bucket for `packages/trailties/**`: the application
boot path (`Engine`, `Trailtie`, `Application`, the framework railties and their
initializers) and the generator/CLI surface (`trails new`, `trails generate`,
`trails server`). Like its actionpack sibling (RFC 0141) it runs no campaign — it is the
home a surfaced trailties deviation goes to, and the trailties half of RFC
0104's sunset.

## Motivation

The same gap RFC 0141 documents, on the other package: CLAUDE.md
routes a surfaced deviation to `<package>-surfaced-deviations`, no trailties
bucket existed, and trailties findings accumulated in RFC 0104 alongside the
actionpack ones until that RFC reached 188 stories.

trailties is where the accumulation was least visible, because each of these
stories is one initializer or one generator template deep — `Engine#app`
declared on `Application` where Rails declares it on `Engine`
(`engine.rb:515-524`); `active_record.set_configs` hand-listing five keys where
Rails `send`s every key of `app.config.active_record` (`railtie.rb:295-336`); a
`Trailtie.subclasses()` that is transitive where Ruby's `Class#subclasses` is
direct children only, worked around inside `Trailties#all` with two
`Object.getPrototypeOf` filters Rails does not have. Individually small;
collectively the difference between a booted app that matches Rails and one that
only looks like it does.

### Evidence

Measured 2026-09-08 against trails `main` (`9c54a7962f`):

| Figure                                                | Value  |
| ----------------------------------------------------- | ------ |
| Open stories carried here                             | 25     |
| — `boot`                                              | 16     |
| — `generators`                                        | 9      |
| Estimated LOC carried (median-imputed for 13 unsized) | ~3,090 |
| Blocked stories carried here                          | **0**  |
| Open trailties stories with a falsified premise       | **0**  |

The zero-blocked row is deliberate: six 0104 trailties stories are blocked on a
subsystem trails has not ported at all, and they went to RFC 0123 rather than
here, so this bucket's queue is pickup-able all the way down.

## Design

### Scope

In scope: any divergence in `packages/trailties/**` between a ported member and
its Rails counterpart in `vendor/rails/railties/**` (or a vendored gem's
railtie), plus the generated output of `trails new` / `trails generate` measured
against the Rails template it mirrors.

Out of scope:

| Subsystem                                                                                                           | Owner           |
| ------------------------------------------------------------------------------------------------------------------- | --------------- |
| Deviations blocked on an unported subsystem (Zeitwerk, ActionMailer, `I18n::Railtie`, `ActiveRecord::TestFixtures`) | RFC 0123        |
| `packages/actionpack/**`                                                                                            | RFC 0141        |
| Repo-wide arm/guard and error-parity ledgers                                                                        | RFC 0113 / 0111 |
| Example-app and CI hygiene                                                                                          | RFC 0023        |

### Clusters

- **`boot`** — `Engine`, `Trailtie`, `Application`, `Railtie::Configuration`,
  the framework railties (`active_record`, `active_model`, `action_controller`,
  `global_id`), `load_defaults`, the routes reloader, `trails server`.
- **`generators`** — `Rails::Generators` lookup and invocation, `class_option`
  plumbing, the app / model / authentication / `db:system:change` generators and
  their emitted templates, and the generator testing assertions.

### Carried in

25 stories carried from RFC 0104 on 2026-09-08. Every one was verified against
`main` before rehoming and none had a falsified premise;
`resweep-rfc-0104-story-context-against-main` (#7437) had swept the set on
2026-09-03.

One arrives **newly actionable**:
`empty-the-generated-new-and-edit-actions-once-implicit-render-lands`. Its
stated blocker, `wire-implicit-render-into-controller-dispatch`, landed in
#7305, so the explicit `render({ action: "new" })` calls the authentication
generator emits can go back to the empty bodies Rails' templates carry
(`sessions_controller.rb.tt:5-6`).

## Non-goals

- **Porting ActionMailer, Zeitwerk, or `I18n::Railtie`.** Each is a package-
  sized decision of its own. The six 0104 stories that need them are held in
  RFC 0123 with their blocker notes intact, and unblock there.
- **Making `trails new` output a production-ready application.** The bucket
  converges the generator against Rails' templates; whether the resulting app is
  deployable is RFC 0136's question, not this one.
- **Driving trailties to a parity percentage.** A deviation bucket has no
  headline number; a subsystem deserving a push gets its own RFC.
- **Example-app and CI hygiene.** Routed to RFC 0023 at sunset.

## Alternatives considered

- **Close RFC 0104 outright.** Rejected on the same grounds as RFC 0141: no open premise is stale, and closing would ratify deviations by
  deletion.
- **Fold trailties into one combined bucket with actionpack.** Rejected: it
  reproduces 0104's failure mode at half the size, and the two packages have
  disjoint reviewers, test lanes and Rails source trees.
- **Split `boot` and `generators` into two RFCs.** Rejected: ~1,790 and ~1,300
  LOC respectively, too small to schedule separately, and they share the
  `trails new` → boot integration seam that several stories sit across. They are
  clusters instead.
- **A residual RFC 0104 keeping the example-app stories.** Rejected as a
  3-story RFC; those went to RFC 0023.

## Rollout

Shares the 0104 sunset sequence with RFC 0141:

1. **Filing (this PR).** Both buckets authored `status: active`; the four
   duplicates' criteria folded into survivors; the sunset recorded in 0104's
   README.
2. **Verbs, from the main worktree after merge.** `tasks close` the 4
   duplicates; `tasks rehome` 73 stories — 25 here, 27 → 0141, 8 →
   0139, 4 → 0140, 6 → 0123, 3 → 0023.
3. **Clusters.** Set `cluster:` on the 25 carried stories by markdown PR.
4. **Close 0104.**

## Verification

- `pnpm tasks list --rfc <this rfc>` reports **25** stories after step 2, and
  `pnpm tasks ready --rfc <this rfc>` is **non-empty**.
- **0** stories in this bucket carry `status: blocked` — the property that makes
  its queue pickup-able, and the reason the six blocked ones went to RFC 0123.
- `pnpm validate` passes across all RFCs and stories.
- Burndown target: closes at **0 open stories with no new filing for a full
  campaign cycle**, the way 0124 and 0134 closed.

## Open questions

None. The two open at proposal time were resolved by the RFC owner on
2026-09-08: the ActionView asset-helper stories go to RFC 0140, and the
example-app / CI stories go to RFC 0023 (`postponed`, so deliberately parked
rather than queued; one `tasks rehome` recovers them).

## Changelog

- 2026-09-08: initial RFC, filed as the trailties half of RFC 0104's sunset.
