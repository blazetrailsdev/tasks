---
title: "ruby-compat: rbObjMethods(obj, false) answers public_methods(false), not methods(false)"
status: draft
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
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

`rbObjMethods(obj, recur = true)` (`packages/ruby-compat/src/method.ts`) was given a `recur` flag by trails#9266 so Thor's `Command#local_method?` could keep one call. With `recur` false it answers `class_instance_method_list(obj, false)`, the singleton's and the receiver's own class's methods, which is `Object#public_methods(false)` (`vendor/ruby/v3.3.11/class.c:2042`). Ruby's `Object#methods(false)` (`rb_obj_methods`, `class.c:1993`) instead answers `rb_obj_singleton_methods`, the singleton methods only. So the flag gives `methods` the semantics of `public_methods`.

The only caller is `Command#isLocalMethod` (`packages/trailties/src/thor/command.ts`), which mirrors thor `command.rb`'s `local_method?`: `instance.public_methods(false) + instance.private_methods(false) + instance.protected_methods(false)`.

## Acceptance criteria

- [ ] `rbObjMethods(obj, false)` answers what MRI's `methods(false)` does (singleton methods only), or the flag is removed.
- [ ] `Command#isLocalMethod` keeps Rails' `public_methods(false)` semantics through a call whose MRI counterpart answers that, with no new invented surface.
- [ ] The Thor command tests pass.
