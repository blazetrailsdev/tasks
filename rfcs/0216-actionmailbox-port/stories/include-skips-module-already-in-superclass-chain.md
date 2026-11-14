---
title: "include-skips-module-already-in-superclass-chain"
status: draft
updated: 2026-11-14
rfc: "0216-actionmailbox-port"
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

Found on trails#10085. Ruby skips an `include` of a module already in the superclass chain (`include_modules_at`, `vendor/ruby/v3.3.11/class.c:1253`). Ruby 3.3.11, with `Base#setup` returning `["base"]`, `Parent < Base` prepending P, `Child < Parent`, and `Parent.include M` followed by `Child.include M`:

    Child.new.setup  # => ["prepended", "mod", "base"]

trails' `include()` (`packages/ruby-compat/lib/include.ts`, `rbModAppendFeatures`) copies a plain-object module onto `Child.prototype` anyway, so it answers `["mod", "prepended", "base"]`.

A related case: `include(Parent, M)` where `Parent` defines `setup` itself and has a prepend. The `prependOrigin` branch seats M above Parent's own method. Ruby puts it below, so `Parent.new.setup` is `["prepended", "parent"]` in MRI.

## Acceptance criteria

- `include(Child, M)` copies nothing when M is already included in Child's superclass chain, and the order above matches MRI.
- `include()` below a prepend seats the module below the class's own method, as MRI does.
- ruby-compat tests cover both cases.
