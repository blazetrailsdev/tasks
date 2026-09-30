---
title: "generator-invoke-for-class-method-with-padding"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: ["rebase-generator-base-onto-thor-group"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Thor's `_invoke_for_class_method` (thor 1.3.2 `lib/thor/invocation.rb`, installed gem, not
vendored) wraps the block or the `invoke` in `with_padding`
(`shell.padding += 1; yield; ensure shell.padding -= 1`). `Thor::Shell::Basic#say_status`
indents by `"  " * padding`. So a hooked generator's `create` / `invoke` lines print one
level deeper than its parent's.

trails#8228 ported `_invokeForClassMethod` (`packages/trailties/src/generators/base.ts`)
without it, carrying `@missingRailsCall with_padding — CONVERGEABLE <this story>`. The
trails generator has no Thor shell object: output goes through a per-instance
`output: (msg) => void`, and `sayStatus` (`@noRailsEquivalent`) has no padding. There is
also no shared shell passed down through `config` for a child generator to indent against.

## Acceptance criteria

- The generator's shell (the `config[:shell]` counterpart) is shared through `dispatch`'s
  config, carries `padding`, and `sayStatus` indents by it.
- `_invokeForClassMethod` wraps its body in `withPadding`, and a test asserts that a hooked
  generator's status lines are indented one level deeper.

## Thor port (the Thor-port RFC this story is rehomed into)

`rebase-generator-base-onto-thor-group` deletes trails' `_invokeForClassMethod` in favor of `Thor::Group#_invoke_for_class_method` (`vendor/thor/v1.3.2/lib/thor/group.rb:276-291`), which wraps in `with_padding`. This story is what remains: a hooked generator shares its parent's shell through `_shared_configuration` (`vendor/thor/v1.3.2/lib/thor/shell.rb:77-79`), and a test asserts its status lines are indented one level deeper. Estimated at 120.
