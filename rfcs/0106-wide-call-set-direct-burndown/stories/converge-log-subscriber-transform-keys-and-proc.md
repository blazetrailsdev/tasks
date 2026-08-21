---
title: "converge-log-subscriber-transform-keys-and-proc"
status: claimed
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T17:50:30Z"
assignee: "converge-log-subscriber-transform-keys-and-proc"
blocked-by: null
closed-reason: null
---

# `Subscriber.add_event_subscriber` passes a lambda where Rails passes the Subscriber

## Context

Surfaced by the leading-underscore call candidate (PR #6825). The sibling half
of this cluster — `LogSubscriber.set_event_levels` calling `transform_keys`
(`log_subscriber.rb:123`) — converged in that PR by teaching `transformKeys`
(`hash-utils.ts`) the `Map` spelling of a Ruby Hash, so only the Proc question
is left.

Rails (`activesupport/lib/active_support/subscriber.rb:94`):

```ruby
subscriber.patterns[pattern] = notifier.subscribe(pattern, subscriber)
```

Notifications invokes the Subscriber OBJECT through Ruby's `#call` protocol.
trails (`packages/activesupport/src/subscriber.ts:163`) passes
`(e) => sub.call(e)` because a JS notifier takes a callable and JS has no
object-answers-to-`call` protocol.

This is a language shortcoming with precedent — the same substitution is already
ratified for `log-subscriber.ts silenced? -> call` — and it is baselined that way
in `scripts/api-compare/call-mismatches-exclude/activesupport/subscriber.json`.
The story is to rule on it ONCE for the cluster rather than leaving two rows
each carrying their own local argument: either make trails' Notifications accept
an object with a `call` method (which is what Ruby's contract actually is, and
would converge both rows), or ratify the substitution deliberately at both call
sites.

## Acceptance criteria

- [ ] One ruling covering both `subscriber.ts add_event_subscriber -> subscribe`
      and `log-subscriber.ts silenced? -> call`.
- [ ] If Notifications grows the object-call contract, both baseline rows are
      deleted and the shard marks tightened.
