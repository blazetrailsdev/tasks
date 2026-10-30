---
title: "Port Zeitwerk unload and reload"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-reload-generation-spike"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb` `unload`, `reload`, `unloadable_cpaths`; `run_on_unload_callbacks`, `unload_cref`. RFC 0213 § "Reload". Unload scope follows RFC 0213 open question 1.

## Acceptance criteria

- `reload` is async and keeps Zeitwerk's order: `unload`, `recompute_ignored_paths`, `recompute_collapse_dirs`, `setup`.
- Each reload is a generation under `?zeitwerk=N`, with the hook the spike chose.
- A `node` subprocess test shows no class surviving from the previous generation.
- `test_reloading.rb`, `test_unload.rb` and `test_on_unload.rb` are ported, generation assertions in subprocesses.
