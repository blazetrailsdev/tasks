---
title: "Port Thor's group.thor and invoke.thor fixtures"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-group", "port-thor-spec-helper-and-script-fixtures"]
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

`vendor/thor/v1.3.2/spec/fixtures/group.thor` (133 lines: `MyCounter`, `ClearCounter`, `BrokenCounter`,
`WhinyGenerator`, `CountersGenerator` via `invoke_from_option`, `RedirectedCounter` and the
rest) and `vendor/thor/v1.3.2/spec/fixtures/invoke.thor` (131 lines: `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`,
`I`, `J` and the invocation chains). `group_spec.rb`, `invocation_spec.rb` and `actions_spec.rb`
depend on them. trailties' `packages/trailties/src/thor/actions.test.ts` defines a local
`MyCounter extends GeneratorBase` stand-in; it moves onto the fixture.

## Fidelity traps (predicted at authoring)

- [ ] `invoke.thor`'s classes print through `puts` and assert on the captured output order,
      which is the observable proof that `invoke_all` awaits sequentially.
- [ ] `WhinyGenerator#wrong_arity(required)` exists only to trip `Group.handle_argument_error`,
      which needs `rbCheckArity`.

## Acceptance criteria

- [ ] Both fixtures exist with their Ruby names and namespaces. `actions.test.ts` imports the
      fixture `MyCounter` rather than a `GeneratorBase` subclass.
