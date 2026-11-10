---
title: "benchmark-ips-held-results-json-and-share"
status: draft
updated: 2026-11-10
rfc: "0212-trailties-port"
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

## Context

`packages/benchmark-ips` (port-benchmark-ips-gem-for-generated-benchmarks) ports `Benchmark.ips`, `Job`, `Report`, `Stats::SD` and the stream/multi reports, but leaves out the parts that touch the filesystem or extra gems:

- `Job#hold`, `hold=`, `hold?`, `hold!`, `save!`, `run_single?`, `json?`, `json!`, `load_held_results`, `save_held_results`, `all_results_have_been_run?`, `clear_held_results`, `generate_json` (`vendor/benchmark-ips/v2.14.0/lib/benchmark/ips/job.rb:129-247,380-383`) and `Report#generate_json` (`ips/report.rb:182-192`).
- Their calls in `Benchmark::IPS#ips` (`ips.rb:49-73`), now receipted `@missingRailsCall ... CONVERGEABLE benchmark-ips-held-results-json-and-share` on `IPS` in `packages/benchmark-ips/lib/ips.ts`, plus the `SHARE` / `SHARE_URL` arm and `ips/share.rb`.
- `Stats::Bootstrap` (`ips/stats/bootstrap.rb`) and its `:bootstrap` arm of `Job#create_stats` (`job.rb:364-373`).
- `Job#run_warmup` / `#run_benchmark`'s `run_single?` / `@held_results` guards (`job.rb:269,307,314,360`).

The file I/O is async in trails, so `Benchmark.ips` has to await the held-results load and save.

## Acceptance criteria

- The listed `Job` and `Report` methods are ported at their gem names, using async fs, and `Benchmark.ips` calls them in the gem's order.
- The `@missingRailsCall` receipts on `IPS` are deleted.
- `test_json_output`, `test_json_output_to_stdout` and `test_hold!` from `test/test_benchmark_ips.rb` are ported.
