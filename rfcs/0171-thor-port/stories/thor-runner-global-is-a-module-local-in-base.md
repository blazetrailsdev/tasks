---
title: "Thor $thor_runner is seated where thor.rb defines it, not a module-local const in base.ts"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor.rb:4` is `$thor_runner ||= false`. It is read at `thor.rb:547`
(`command.formatted_usage(self, $thor_runner, subcommand)`) and as the default of
`handle_no_command_error(command, has_namespace = $thor_runner)` (`base.rb:613`).

trails#8469 ported the `base.rb` reader before `thor.rb` existed, so `packages/trailties/src/thor/base.ts` holds
`const thorRunner: unknown = false` as a module-local. It is not assignable and `thor.ts` cannot read it.

## Acceptance criteria

- [ ] `$thor_runner` has one assignable seat defined by the `thor.rb` port, read by both `Thor.banner` and
      `handleNoCommandError`, and the module-local const in `base.ts` is gone.
- [ ] A test sets it true and asserts `handleNoCommandError` names the namespace
      (`Could not find command "x" in "ns" namespace.`).
