---
title: "Wave 4f (cont. 2): the activesupport cache, encrypted-file and callbacks call-set residue"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

# Wave 4f (cont. 2): the activesupport cache / encrypted-file / callbacks residue

## Context

`wave-4f-activesupport-residue-rest` shipped a first slice (PR pending): it
converged seven sites and wrote reviewed per-site reasons for a further eleven,
then stopped short of the LOC ceiling's useful boundary. Converged there:

- `execution-context.ts` — the private `store` reader is now ported over
  `IsolatedExecutionState` (`execution_context.rb:47-49`).
- `html-safe-translation.ts` — the private helper is spelled
  `htmlSafeTranslation`, so `translate` registers the call
  (`html_safe_translation.rb:38`).
- `broadcast-logger.ts` — the constructor calls `broadcastTo(...loggers)`
  (`broadcast_logger.rb:82-87`).
- `cache/entry.ts` — `dupValueBang` reads `isCompressed()`
  (`cache/entry.rb:107`).
- `cache/file-store.ts` — `modifyValue` opens with `mergedOptions(options)`
  (`cache/file_store.rb:223`).
- `number-helper/number-to-human-size-converter.ts` — `conversionFormat` goes
  through `translateNumberValueWithDefault`
  (`number_helper/number_to_human_size_converter.rb:32`).
- `core-ext/string/output-safety.ts` — `chr` and `safeConcat` call the ported
  `isHtmlSafe` (`core_ext/string/output_safety.rb:59-68`).

What is left, all still holding the seeded placeholder reason:

    scripts/api-compare/call-mismatches-exclude/activesupport/cache.json            5
      expanded_key->to_param, handle_invalid_expires_in->report,
      key_matcher->call, merged_options->merge, normalize_version->try
    scripts/api-compare/call-mismatches-exclude/activesupport/encrypted-file.json   5
      initialize->new, read->exist?, read_key_file->exist?,
      writing->chomp, writing->create
    scripts/api-compare/call-mismatches-exclude/activesupport/callbacks.json        4
      __update_callbacks->descendants, __update_callbacks->prepend,
      merge_conditional_options->build, merge_conditional_options->concat
    plus the remaining single-row shards:
      actionable-error, configuration-file, current-attributes (3),
      error-reporter, log-subscriber (silenced?->call),
      message-pack/serializer

Note on `cache.json`: the shard's `tsFile` is `cache.ts`, but the bodies the
rows name (`expanded_key`, `merged_options`, `normalize_version`,
`key_matcher`, `handle_invalid_expires_in`) actually live in
`packages/activesupport/src/cache/store.ts` — `cache.ts` is a thin re-export
module (135 lines). Check whether the compare's file mapping is the real
divergence before writing per-site reasons against `cache/store.ts` bodies.

## Acceptance criteria

- [ ] Every remaining `kind: "set"` row under
      `scripts/api-compare/call-mismatches-exclude/activesupport/**` is either
      converged against the Rails source line or carries a reviewed one-line
      per-site reason. No seeded placeholder text left.
- [ ] Rows retired by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` per shard. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new novel surface.
