---
title: "Port Thor::Actions#run, #run_ruby_script and #thor"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["ruby-compat-kernel-system-and-open3-capture2e"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-thor-actions-module` (the rest of `Thor::Actions`' instance half landed there).
`vendor/thor/v1.3.2/lib/thor/actions.rb` still has three unported methods in
`packages/trailties/src/thor/actions.ts`:

- `run` (`actions.rb:248-277`);
- `run_ruby_script` (`:285-288`);
- `thor` (`:308-319`).

They were not shipped with the module because `run` needs the async `Kernel#system` and
`Open3.capture2e` from `ruby-compat-kernel-system-and-open3-capture2e`, and that work is not
on `main`: the story was recorded done against trails#8305, whose body says the ruby-compat
half was taken out of the PR and parked on the local tag
`wip/ruby-compat-kernel-system-open3-from-8305`. `git grep -i capture2e origin/main -- packages`
finds nothing. That story has been set back to `ready` and is a dep of this one.

## Fidelity traps

- `return unless behavior == :invoke` first, then the status line, then
  `return if options[:pretend]` (after the status line).
- `config[:with]` prefixes both `desc` (`File.basename(config[:with].to_s)`) and `command`.
- `env_splat = [config[:env]] if config[:env]`; `capture:` goes to `Open3.capture2e`, else
  `system`.
- `abort if !success && config.fetch(:abort_on_failure, self.class.exit_on_failure?)`:
  `fetch`, not `??`, so an explicit `abort_on_failure: nil` means do not abort. trails spells
  the class predicate `isExitOnFailure` (`thor/base.ts`).
- `run_ruby_script` passes `with: Thor::Util.ruby_command` (`thor/util.ts` `rubyCommand`).
- `thor(command, *args)` pops a trailing Hash, deletes `verbose` / `pretend` / `capture` from
  it, pushes `Thor::Options.to_switches(config)`, and runs `with: :thor`. The `thor`
  executable is the unported Runner, so the built command is asserted and not run.

## Acceptance criteria

- [ ] `run`, `runRubyScript` and `thor` are ported line for line into `thor/actions.ts` and
      installed on the `Actions` module.
- [ ] `actions.rb` reads complete in `parity:api --package thor`, except `apply`
      (`port-thor-actions-apply`).
- [ ] The `#run`, `#run_ruby_script` and `#thor` cases of `vendor/thor/v1.3.2/spec/actions_spec.rb`
      are ported, or left to `port-thor-actions-spec` if that story has not landed.
