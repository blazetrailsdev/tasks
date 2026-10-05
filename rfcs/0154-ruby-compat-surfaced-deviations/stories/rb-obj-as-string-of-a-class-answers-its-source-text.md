---
title: "rbObjAsString / toS of a class answers its source text, not rb_mod_to_s"
status: in-progress
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8526
claim: "2026-10-05T13:28:59Z"
assignee: "rb-obj-as-string-of-a-class-answers-its-source-text"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Thor::Group` (story `port-thor-group`).

Ruby's `rb_obj_as_string` (`vendor/ruby/v3.3.11/string.c:1653`) sends `to_s`, and for a class
that is `rb_mod_to_s` (`vendor/ruby/v3.3.11/object.c:1681`): the class name. ruby-compat's
`rbObjAsString` (`packages/ruby-compat/src/object.ts:1186`) has no class arm, so a JS class falls
through to `String(value)` and answers its SOURCE TEXT. `toS` delegates to it and inherits the gap.

Observable in `Thor::Group.invoke` (`vendor/thor/v1.3.2/lib/thor/group.rb:56-78`), which accepts
a class as well as a namespace and builds the generated command's name from
`name.to_s.gsub(/\W/, '_')`. In `packages/trailties/src/thor/group.ts` that is
`rbObjAsString(name).replace(/\W/g, "_")`, so `invoke(Invoked)` defines a command named after the
whole class body instead of `_invoke_Invoked`. `Thor::Shell::Basic#say_status`'s `message.to_s`
(`packages/trailties/src/thor/shell/basic.ts:120`) prints the same source text for the
`say_status :invoke, klass` line.

## Acceptance criteria

- [ ] `rbObjAsString(SomeClass)` and `toS(SomeClass)` answer `rbModToS(SomeClass)`.
- [ ] A regression test in ruby-compat that fails on the baseline.
- [ ] `group.trails.test.ts` asserts the command name `Thor::Group.invoke(SomeClass)` defines.
