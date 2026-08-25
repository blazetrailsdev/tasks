---
title: "Converge Store#expanded_version's to_param receiver (bucket b)"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6424
claim: "2026-08-12T16:16:54Z"
assignee: "naming-burndown-2-ar-abstract-adapters-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

PR #6415 ported `Cache::Store#expanded_version` (cache.rb:994-1000) into
`packages/activesupport/src/cache/store.ts` and had to add one call-ARGUMENT
baseline row for it:

```text
activesupport  cache.ts  expanded_version  to_param  kind: args
```

Rails calls `to_param` on the receiver — `key.cache_version.to_param` and
`key.map { |element| expanded_version(element) }.tap(&:compact!).to_param`
(cache.rb:996-998). trails cannot monkey-patch `Object`/`Array` prototypes, so
the port calls the free `toParam(...)` helper from `hash-utils.ts` with the
receiver as argument 1 — RFC 0099 bucket (b).

This is the same bucket as the `payload_for` / `as_json` row in
`call-mismatches-exclude/activerecord/token-for.json` and the pre-existing
`expand_cache_key` / `to_param` row in the same activesupport shard, so it is
one instance of a repo-wide pattern rather than a one-off: whatever shape
retires bucket (b) should retire all three together.

## Converged shape

Whatever the RFC 0099 bucket-(b) resolution turns out to be — a `this`-typed
core-ext function assigned where Rails patches the prototype, or an accepted
normalization in the call-argument extractor so a receiver-as-argument-1 call
is not counted as a shape divergence. Not a per-row reword.

## Acceptance criteria

- The `expanded_version` / `to_param` row is DELETED from
  `scripts/api-compare/call-mismatches-exclude/activesupport/cache.json`
  (only-shrink; never `--write`), along with its bucket-(b) siblings if the
  chosen shape retires them.
- `pnpm parity:api:calls:args` green; cache suites green on all three lanes.
