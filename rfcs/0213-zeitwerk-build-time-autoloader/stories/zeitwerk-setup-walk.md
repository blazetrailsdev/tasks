---
title: "Port Zeitwerk setup walk in process"
status: in-progress
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-loader-config-and-helpers"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9581
claim: "2026-11-01T18:46:41Z"
assignee: "zeitwerk-setup-walk"
blocked-by: null
closed-reason: null
---

## Context

`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:461` `define_autoloads_for_dir`, through `autoload_file`, `autoload_subdir`, `promote_namespace_from_implicit_to_explicit` and `define_autoload` (`:542`). RFC 0213 § "The ratified deviation". `Module#autoload` is replaced by a recorded row.

## Acceptance criteria

- `setup` fills `autoloads` and `namespace_dirs` as the Ruby walk does.
- Shadowed files and `raise_if_conflicting_directory` are ported.
- `all_expected_cpaths` and `cpath_expected_at` are ported with their tests.
- `test_conflicting_directory.rb` and `test_all_expected_cpaths.rb` are ported.
