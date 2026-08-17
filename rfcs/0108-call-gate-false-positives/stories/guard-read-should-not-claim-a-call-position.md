---
title: "A respond_to? guard's TS property read should not claim a call position"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6667
claim: "2026-08-17T20:12:59Z"
assignee: "converge-accessor-surfaced-call-set-rows-wave-2"
blocked-by: null
closed-reason: null
---

## Context

Triaged in PR #6657 while verifying that
`call-order-should-follow-ruby-argument-evaluation` was already discharged by
PR #6404 (both extractors record EVALUATION order now). It is: none of the 38
residual `order:` rows is an argument-evaluation artifact. But the triage
surfaced a DIFFERENT recording-order false positive with the same signature,
and its baselined reason currently misattributes it to a Ruby splat.

Rails guards an optional collaborator method with `respond_to?`:

```ruby
# railties/lib/rails/rack/logger.rb:23-24
env["rails.rack_logger_tag_count"] = if logger.respond_to?(:push_tags)
  logger.push_tags(*compute_tags(request)).size
```

The port spells the same guard as a property read of the method itself, which
is the only way to ask the question in TS:

```ts
// packages/trailties/src/rack/logger.ts:52-53
const tagCount = this.logger.pushTags
  ? this.logger.pushTags(...this.computeTags(request)).length
```

Ruby records `respond_to?` at that position; TS records a READ of `pushTags`.
So `pushTags` takes the guard's position on the TS side and lands ahead of
`computeTags`, while Rails evaluates `compute_tags` first — and
`compare.ts#reorderedCalls` reports
`order:pushTags,computeTags`. Verified directly against the extractor: the Ruby
side already emits `["new", "logger", "respond_to?", "compute_tags",
"push_tags", "size", "call_app"]`, i.e. evaluation order is correct on both
sides and the inversion is entirely the guard read.

The baselined row's reason blames a Ruby splat argument
(`logger.push_tags(*compute_tags(request))`) — that was true before PR #6404
and is now stale; the splat records in evaluation order.

The same shape recurs wherever Rails writes `respond_to?` / `defined?` around
an optional collaborator, so it is a class, not a one-off.

## Converged shape

Treat a property read that is the CONDITION of a guard (`x.foo ? x.foo(…)` /
`if (x.foo)` / `x.foo?.(…)`) as carrying no call position, the way
`ambiguousTsNames` already withholds a position from a name two Ruby calls
could both map to. The read stays in the call SET — it is the port's spelling
of Rails' `respond_to?` and should keep discharging it — but it must not claim
the guard's position in `callSeq`.

Then delete the `trailties/rack/logger.json` `call` `order:pushTags,computeTags`
row (only-shrink, by hand) and re-check the remaining `order:` rows for the same
class before closing.

## Acceptance criteria

- A TS body guarding an optional call with a property read of the same name
  produces the call order helper-then-call, matching Rails' `respond_to?`-guarded
  evaluation order; a unit test covers it.
- The `trailties/rack/logger.json` `order:pushTags,computeTags` row is deleted
  by hand (no `--write` reseed) and `pnpm parity:api:calls` stays green.
- The stale splat-argument reason is not carried forward onto any surviving row.
- No new `order:` rows appear elsewhere from the change.
