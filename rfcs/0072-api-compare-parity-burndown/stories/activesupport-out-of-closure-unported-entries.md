---
title: "Exclude out-of-AR/AM-closure activesupport files via UNPORTED_FILES"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6411
claim: "2026-08-12T13:06:04Z"
assignee: "activesupport-out-of-closure-unported-entries"
blocked-by: null
closed-reason: null
---

## Context

Audit `~/.btwhooks/data/github/blazetrailsdev/trails/audits/activesupport-ar-gaps-20260810T143915Z.md` (2026-08-10): of activesupport's 1,217 missing API members (parity:api at main 5c54182f1), 699 fall **outside** the `require "active_support/…"` closure of `vendor/rails/activerecord/lib` + `vendor/rails/activemodel/lib` (62 direct requires expanded through the umbrellas `active_support.rb`, `rails.rb`, `core_ext/{array,module,numeric,range,digest}.rb`, `time.rb`, `json.rb`). Current scope policy is AR/AM-necessary activesupport only.

Add `UNPORTED_FILES` entries (pattern + testFile, `package: "activesupport"`, reason "outside the AR/AM require closure; deferred until actionpack/railties port needs it") for the out-of-closure families:

- `cache/` — redis_cache_store.rb 31, strategy/local_cache.rb 23 + middleware 5, mem_cache_store.rb 17, file_store.rb 8, memory_store.rb 7, cache.rb residue 12
- `reloader.rb` 20, `execution_wrapper.rb` 14, `dependencies/interlock.rb` 10
- `file_update_checker.rb` 10, `evented_file_update_checker.rb` 4
- `xml_mini*` family ~50 (xml_mini.rb 15, libxmlsax 10, nokogirisax 10, jdom 9, rexml 8, libxml 1) — check existing partial ports before excluding files that exist
- `testing/parallelize_executor.rb` 14, `testing/parallelization/{server,worker}.rb` 16, `testing/parallelization.rb` 7
- `encrypted_configuration.rb` 8, `code_generator.rb` 5, `fork_tracker.rb` 5, `railtie.rb` 3, `syntax_error_proxy.rb` 3, `concurrency/share_lock.rb` 13, `log_subscriber/test_helper.rb` 10 (test-infra for AS's own suite; AR's log_subscriber tests need it — verify before excluding)

**Target file: `scripts/parity/unported-files/activesupport.ts`** — PR #6340 (open, `0097-parity-output-sharding/unported-files-split-per-package`) splits the old single array into per-package shards; branch from main after it merges, or rebase onto its layout. Precedent for this kind of entry: the existing "activesupport `core_ext/*` tail with no trails counterpart (RFC 0072)" block.

Side effect to declare in the PR body: activesupport's parity:api denominator shrinks from 2,292 by several hundred, so `api_compare_stats.percent` in the stats DB jumps discontinuously — note the date so dashboard trends stay interpretable.

## Acceptance criteria

- Every excluded file carries a reason naming the require-closure rationale; no in-closure file (the 64-file list in the audit) is excluded.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative; activesupport totals drop by the excluded member counts.
- No deviation-ledger (call-mismatches) rows are touched — this is scope declaration via the sanctioned register only.
