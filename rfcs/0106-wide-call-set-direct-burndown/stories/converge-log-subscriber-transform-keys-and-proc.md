---
title: "converge-log-subscriber-transform-keys-and-proc"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `LogSubscriber.set_event_levels` / `Subscriber.add_event_subscriber` diverge on the Hash and the Proc

## Context

Two rows surfaced by the leading-underscore call candidate (PR #6825), both in
the same cluster.

1. `set_event_levels` (`activesupport/lib/active_support/log_subscriber.rb:121-125`)
   is `subscriber.event_levels = log_levels.transform_keys { |k| "#{k}.#{namespace}" }`.
   trails (`packages/activesupport/src/log-subscriber.ts:161-173`) rebuilds the
   collection in a loop because `logLevels` is a JS `Map` and trails'
   `transformKeys` (`hash-utils.ts:217`) is object-only. Either `logLevels`
   becomes a plain object (which is what Ruby's `class_attribute` Hash is), or
   `transformKeys` grows the Map arm.
2. `add_event_subscriber` (`activesupport/lib/active_support/subscriber.rb:86-95`)
   is `notifier.subscribe(pattern, subscriber)` — Notifications invokes the
   Subscriber object through `#call`. trails passes `(e) => sub.call(e)`, the
   same Proc-vs-callable substitution already baselined for
   `log-subscriber.ts silenced? -> call`. This one may be a genuine language
   shortcoming; the story is to decide that deliberately rather than by default.

Baselined meanwhile in
`scripts/api-compare/call-mismatches-exclude/activesupport/log-subscriber.json`
and `.../activesupport/subscriber.json`.

## Acceptance criteria

- [ ] `set_event_levels` calls `transform_keys`, by whichever of the two routes
      above is the faithful one.
- [ ] The Proc substitution in `add_event_subscriber` is either converged or
      ratified once, at the call site, for the whole cluster.
- [ ] Both baseline rows are deleted and the shard marks tightened.
