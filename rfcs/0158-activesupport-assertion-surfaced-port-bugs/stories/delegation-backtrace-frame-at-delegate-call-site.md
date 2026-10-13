---
title: "Module#delegate: a delegated method's error has no backtrace frame at the delegate call site (2 tests assert file only)"
status: draft
updated: 2026-10-13
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8871 made `delegate` pass its caller location to `Delegation.generate`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/delegation.rb:164`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:37-38`) and
located each generated function with `iseqLocationSetup`, so
`Method#source_location` answers the `delegate` line. Two things were left:

- `delegation exception backtrace` and `delegation exception backtrace with allow nil`
  (`vendor/rails/v8.0.2/activesupport/test/core_ext/module_test.rb:375-394`) assert
  that a backtrace frame includes `"#{__FILE__}:#{Someone::FAILED_DELEGATE_LINE}"`
  (and `FAILED_DELEGATE_LINE_2`). The ports in
  `packages/activesupport/src/core-ext/module.test.ts` assert only the file name
  `"module.test.ts"`. In Ruby the frame exists because
  `owner.module_eval(method_def.join(";"), file, line)` (`delegation.rb:146`)
  compiles the generated method at the `delegate` call site. A JS closure's frame
  is at `delegation.ts`, not at the caller, so the raised error carries no frame
  on that line. `Someone.FAILED_DELEGATE_LINE` and `FAILED_DELEGATE_LINE_2` now
  exist in the test file.
- `Delegation.generate`'s `owner instanceof Module` arm re-enters `generate`
  through `owner.moduleEval((mod) => generate(mod, methods, options))` before
  `location ||= callerLocations(1, 1)[0]` runs, so a direct `generate` call on a
  `Module` owner with no `location:` records the frame of that lambda rather than
  of its caller. `delegate` always passes `location:`, so only direct callers are
  affected.

## Acceptance criteria

- [ ] The two backtrace tests assert `file:line` as `module_test.rb:379,389` do,
      with the error raised by a delegated method carrying a frame at the
      `delegate` call site (for example by adding the recorded location to the
      error's backtrace where the generated function raises), or the story is
      closed with the specific V8 limit that prevents it.
- [ ] `Delegation.generate` resolves a defaulted `location` to its caller's frame
      for a `Module` owner as well.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
