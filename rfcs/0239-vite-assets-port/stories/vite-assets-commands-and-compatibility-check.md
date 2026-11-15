---
title: "vite-assets-commands-and-compatibility-check"
status: in-progress
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10144
claim: "2026-11-15T19:23:19Z"
assignee: "dev-server-proxy-streaming-default-in-constructor"
blocked-by: null
closed-reason: null
---

## Context

Split from `vite-assets-builder-commands-runner` to stay under the PR LOC ceiling. That PR ports `Builder`, `Build`, `Runner` and `IO`. Two files are still unported, both in `vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/`:

- `commands.rb`: `build_from_task`, `build`, `clobber`, `install_binstubs`, `legacy_npm_version?`, `legacy_yarn_version?`, `verify_install`, `print_info`, `with_node_env` and `ensure_log_goes_to_stdout`.
- `compatibility_check.rb`: `verify_plugin_version`, `raise_unless_satisfied` and `compatible_plugin?`. `Config#initialize` (`config.rb:126-129`) calls `verify_plugin_version(root) unless skip_compatibility_check`, which in trails goes at the end of `Config.resolveConfig`.

`compatible_plugin?` needs `Gem::Requirement` (`vendor/ruby/v3.3.11/lib/rubygems/requirement.rb:9`: `OPS`, `PATTERN`, `parse` at `:103-117`, `initialize` at `:131-141`, `satisfied_by?` at `:242-246`). It also needs `Gem::Version#bump` (`version.rb:247-256`) and `#release` (`:326-334`). None of these exist in `packages/ruby-compat/lib/gem/` yet.

`print_info`'s `framework_libraries` loop is tracked separately in `vite-assets-framework-libraries-reads-loaded-packages`.

Upstream tests are `vendor/vite_ruby/v3.11.1/test/commands_test.rb` and `compatibility_check_test.rb`. `stub_builder` (`test_helper.rb:70-80`) is already ported, with `stale:`, in `packages/vite-assets/test/support/test-helper.ts`.

## Acceptance criteria

- `packages/vite-assets/lib/commands.ts` and `compatibility-check.ts` are ported under their Rails names and seated on `ViteAssets` (`commands()`, `ViteAssets.commands`).
- ruby-compat gains `Gem::Requirement` and `Version#bump` / `#release`.
- `Config.resolveConfig` runs the compatibility check.
- `commands.test.ts` and `compatibility-check.test.ts` are ported under their upstream test names.
