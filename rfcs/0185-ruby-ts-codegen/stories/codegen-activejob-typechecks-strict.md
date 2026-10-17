---
title: "Generated activejob typechecks under the repo's strict options"
status: draft
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The generator built under `codegen-ir-generator-as-built` (trails#9004) emits
activejob with 13 tsc errors under the repo's strict options when the generated
tree is swapped into `packages/activejob/src`
(`CODEGEN_GEM=activejob scripts/codegen/swap-tree.sh`). The original
`codegen-lowering-and-first-output` story made a strict-tsc-green activejob its
central check.

The errors at #9004's head, and what each needs:

- `!` on dependency calls whose declared return admits `null` (`TimeZone.find`,
  `excBacktrace`, `rbModName`, `zone()`). The hand oracle (`hand-oracle.ts`)
  records no nullability, so the generator cannot tell. Add `nullable` to
  `MemberInfo` / function entries and emit `!` where a nullable result is passed
  to a non-null parameter.
- `...args` spread into a dependency function with fixed parameters
  (`timezone-dependent-job.ts`, `RubyTime.utc(*args)`).
- `translations[I18n.locale()]`, where `locale()` may answer `false`.
- `super.info` / `super.error` in `ActiveJob::LogSubscriber`. Closes with
  `log-subscriber-level-helpers-keep-rails-names`, which converges activesupport's
  `_info` / `_error` to Rails' names.
- `Thread.each_caller_location`, which trails has not ported.
- The remaining test-file errors (`argument-serialization.test.ts`: `PlainDate`
  into a `Range` of times).

trails#9005 carries hand fixes for each; the fix here is a generator rule, or an
oracle or port change, so that regenerating reproduces them.

## Acceptance criteria

- [ ] `CODEGEN_GEM=activejob scripts/codegen/swap-tree.sh` reports 0 tsc
      errors, with no `@ts-nocheck`, no `as any` added for the error, and no
      suppression comment.
- [ ] Each fix is a generator rule with a lowering test, or a change in the
      oracle or the ported dependency, named in the PR body.
- [ ] activerecord's tsc count from `measure-all.sh` does not rise.
