---
title: "generator-invoke-for-class-method-with-padding"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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
