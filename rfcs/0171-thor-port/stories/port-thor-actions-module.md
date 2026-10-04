---
title: "Port Thor::Actions' instance half (behavior, destination stack, inside / in_root)"
status: done
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-util",
    "port-thor-shell-module-basic-output-and-terminal",
    "ruby-compat-fileutils-cd-block-restores-on-settle",
  ]
deps-rfc: []
est-loc: 400
priority: 2
pr: trails#8495
claim: "2026-10-04T19:03:50Z"
assignee: "port-thor-actions-module"
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
- protected `_shared_configuration` (adds `destination_root:`) and `_cleanup_options_and_set`
  (`:329-338`).

This story does not wait on `port-thor-invocation`. Its only coupling to Invocation is
`_shared_configuration`, whose base definition is Invocation's. Port Actions' override as
`super.merge!(destination_root:)` over whatever `super` resolves to today; whichever of the two
stories lands second asserts the composed result.

`relative_to_original_destination_root` today reads a `cwd` field
(`thor/actions.ts`, `Pick<ActionsHost, "cwd">`). With the destination stack ported, it reads
`@destination_stack[0]` as Thor does. `GeneratorBase` has one `cwd` field and no stack
(see the rehomed `action-methods-inside-chmod-shebang-delegates-unported`).
`generator-base-has-no-thor-runtime-options` (done, trails#8221) added the four runtime
options by hand to `GeneratorBase`; `add_runtime_options!` replaces that.

`run`, `run_ruby_script` and `thor` are `port-thor-actions-run-run-ruby-script-and-thor`. They
were split out because `run` needs `ruby-compat-kernel-system-and-open3-capture2e`, which was
recorded done against trails#8305 without its code reaching `main`.

## Fidelity traps (predicted at authoring)

- [ ] **`inside` is async** and restores both `@destination_stack` and the process directory
      when the block settles (`FileUtils.cd` from
      `ruby-compat-fileutils-cd-block-restores-on-settle`). `block.arity == 1 ?
yield(destination_root) : yield`.
- [ ] **`inside` under `pretend`** never creates the directory and never `cd`s.
- [ ] **`File.expand_path(root || "")`** in `destination_root=`: a `nil` root expands to the
      process directory.

## Acceptance criteria

- [ ] `actions.rb` reads complete in `parity:api --package thor`, except `apply`
      (`port-thor-actions-apply`) and `run` / `run_ruby_script` / `thor`
      (`port-thor-actions-run-run-ruby-script-and-thor`).
- [ ] The RSpec port is `port-thor-actions-spec`.
