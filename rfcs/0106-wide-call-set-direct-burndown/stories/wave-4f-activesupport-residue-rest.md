---
title: "wave-4f-activesupport-residue-rest"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6734
claim: "2026-08-19T01:18:03Z"
assignee: "wave-4d-associations-residue-part-3"
blocked-by: null
closed-reason: null
---

# Wave 4f (cont.): the activesupport residue outside the time cluster

## Context

`wave-4f-activesupport-residue` shipped the time cluster
(`time-with-zone.ts`, `values/time-zone.ts`) plus `security-utils.ts` and
`environment-inquirer.ts` in one PR and stopped at the LOC ceiling. Re-measured
after that PR, `scripts/api-compare/call-mismatches-exclude/activesupport/**`
still carries **74 `kind: "set"` rows**, of which **43 still hold the seeded
placeholder** `"Baseline (RFC 0047): ... pending per-cluster burndown review."`.

The remaining seeded rows, by shard:

    cache.json                       5   (expanded_key->to_param, handle_invalid_expires_in->report,
                                          key_matcher->call, merged_options->merge, normalize_version->try)
    encrypted-file.json              5   (initialize->new, read->exist?, read_key_file->exist?,
                                          writing->chomp, writing->create)
    callbacks.json                   4   (__update_callbacks->descendants/prepend,
                                          merge_conditional_options->build/concat)
    current-attributes.json          3   (attribute->generate, attribute->merge, set->with)
    inflector/inflections.json       3   (human/plural/singular -> prepend)
    broadcast-logger.json            2   (initialize->broadcast_to, stop_broadcasting_to->delete)
    core-ext/string/output-safety.json 2 (chr->html_safe?, safe_concat->html_safe?)
    html-safe-translation.json       2   (translate->call, translate->html_safe_translation)
    log-subscriber.json              2   (silenced?->call, subscribe_log_level->merge)
    + 15 shards with 1 row each (actionable-error, benchmarkable, cache/entry,
      cache/file-store, cache/memory-store, configuration-file, duration,
      error-reporter, execution-context, message-pack/serializer,
      notifications/fanout, number-helper/number-to-human-size-converter,
      number-helper/rounding-helper)

Findings from the shipped slice that carry over:

- `Array#prepend` is Ruby's alias for `unshift`, so the three
  `inflector/inflections` rows are name-only and want a per-site reason, not a
  code change — but confirm at each site first
  (`vendor/rails/activesupport/lib/active_support/inflector/inflections.rb:151-165,220-222`).
- `ExecutionContext.set -> store`: Rails' private `store` reader is
  `IsolatedExecutionState[:active_support_execution_context] ||= {}`
  (`execution_context.rb`); trails reads a module-level `_store` Map directly
  (`packages/activesupport/src/execution-context.ts:9`). Converging means
  porting the reader, not adding a call.
- `hash-utils.ts` has no `merge` port (Ruby core `Hash#merge`, not an AS
  extension), so every `-> merge` row is a JS-spread equivalence — verify per
  site rather than class-wide.

## Acceptance criteria

- [ ] Every remaining `kind: "set"` row under
      `scripts/api-compare/call-mismatches-exclude/activesupport/**` is either
      converged (TS body makes the call Rails makes, verified against the Rails
      source line) or carries a reviewed one-line per-site reason — no seeded
      placeholder text left.
- [ ] Rows retired by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` per shard. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Split across more than one PR if the LOC ceiling demands it.
