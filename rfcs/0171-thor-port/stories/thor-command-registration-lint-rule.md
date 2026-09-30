---
title: "ESLint rule: every public method of a Thor / Thor::Group subclass is registered through methodAdded"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-base-command-registry-method-added-and-start"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC decision 1 makes command registration an explicit `this.methodAdded("name")` in the
class's static block. In Ruby, forgetting is impossible: the VM fires `method_added` for every
`def` (`vendor/thor/v1.3.2/lib/thor/base.rb:729-745`). A forgotten call in trails silently drops a command. In a
`Thor::Group` (every Rails generator), the step never runs, and nothing reports it.

## Acceptance criteria

- [ ] `blazetrails/thor-command-registration` flags a public, non-accessor, non-static method
      of a class whose `extends` chain reaches `Thor` or `Thor.Group` and that the class's static
      blocks never pass to `methodAdded` (directly or inside `noCommands`). Private or protected
      methods, and methods recorded with `rbModPrivate`, are exempt.
- [ ] Autofix appends `this.methodAdded("<name>")` in definition order, which is Ruby's
      `method_added` order and so Thor::Group's `invoke_all` order.
- [ ] It runs over `packages/trailties/src/**`. The rule's own tests cover a subclass of a
      subclass, a `noCommands`-registered helper, and a `static override` exemption.
