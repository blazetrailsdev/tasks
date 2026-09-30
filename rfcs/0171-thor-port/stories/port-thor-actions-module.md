---
title: "Port Thor::Actions' instance half (behavior, destination stack, inside / in_root, run, run_ruby_script, thor)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-invocation",
    "port-thor-shell-module-basic-output-and-terminal",
    "ruby-compat-fileutils-cd-block-restores-on-settle",
    "ruby-compat-kernel-system-and-open3-capture2e",
  ]
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions.rb` (340 lines). trails#8269 ported `ClassMethods` (`source_paths`,
`source_root`, `source_paths_for_search`), the instance `source_paths` /
`find_in_source_paths`, and `relative_to_original_destination_root` into
`packages/trailties/src/thor/actions.ts`. The rest is here:

- `attr_accessor :behavior`; `add_runtime_options!` (`:48-60`); `initialize` (`:72-85`), with
  `config[:behavior]` → `:invoke` / `:revoke` and `_cleanup_options_and_set`;
- `action(instance)` (`:89-95`); `destination_root` / `destination_root=` (`:99-109`, the
  `@destination_stack`);
- `inside` (`:170-196`) and `in_root` (`:200-202`);
- `run` (`:248-277`), `run_ruby_script` (`:285-288`), `thor` (`:308-319`);
- protected `_shared_configuration` (adds `destination_root:`) and `_cleanup_options_and_set`
  (`:329-338`).

`relative_to_original_destination_root` today reads a `cwd` field
(`thor/actions.ts`, `Pick<ActionsHost, "cwd">`). With the destination stack ported, it reads
`@destination_stack[0]` as Thor does. `GeneratorBase` has one `cwd` field and no stack
(see the rehomed `action-methods-inside-chmod-shebang-delegates-unported`).
`generator-base-has-no-thor-runtime-options` (done, trails#8221) added the four runtime
options by hand to `GeneratorBase`; `add_runtime_options!` replaces that.

## Fidelity traps (predicted at authoring)

- [ ] **`inside` is async** and restores both `@destination_stack` and the process directory
      when the block settles (`FileUtils.cd` from
      `ruby-compat-fileutils-cd-block-restores-on-settle`). `block.arity == 1 ?
yield(destination_root) : yield`.
- [ ] **`inside` under `pretend`** never creates the directory and never `cd`s.
- [ ] **`run`**: `return unless behavior == :invoke`, `return if options[:pretend]` (after the
      status line), `with:` prefix, `env:` splat, `capture:` → `Open3.capture2e`, and
      `abort if !success && config.fetch(:abort_on_failure, self.class.exit_on_failure?)`.
      `fetch`, not `??`: an explicit `abort_on_failure: nil` means don't abort.
- [ ] **`run_ruby_script`** passes `with: Thor::Util.ruby_command` (the JS runtime; see
      `port-thor-util`).
- [ ] **`thor(command, *args)`** builds `Thor::Options.to_switches(config)` and runs
      `with: :thor`. The `thor` executable is the Runner, which is unported, so the command it
      builds is still asserted, and running it is the Runner's non-goal.
- [ ] **`File.expand_path(root || "")`** in `destination_root=`: a `nil` root expands to the
      process directory.

## Acceptance criteria

- [ ] `actions.rb` reads complete in `parity:api --package thor`, except `apply`
      (`port-thor-actions-apply`).
- [ ] The RSpec port is `port-thor-actions-spec`.
