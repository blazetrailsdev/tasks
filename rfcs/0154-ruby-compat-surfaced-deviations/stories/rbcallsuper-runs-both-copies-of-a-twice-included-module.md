---
title: "rbCallSuper runs both copies of a module included into a subclass and its parent"
status: draft
updated: 2026-11-14
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

trails#10085 stopped `rbCallSuper` from cycling when one module is included into a subclass and then into its parent below a prepend (`ActiveRecord::TestCase`, then test-help's `ActiveSupport::TestCase`). Ruby keeps both copies in the ancestry (`include_modules_at`, `vendor/ruby/v3.3.11/class.c:1253`) and runs the module body twice. ruby 3.3.11, with `Base#setup` returning `["base"]`, `Parent < Base` prepending P, `Child < Parent`, `Child.include M`, then `Parent.include M`:

    Child.new.setup  # => ["mod", "prepended", "mod", "base"]

trails answers `["mod", "prepended", "base"]`. `rbCallSuper` (`packages/ruby-compat/lib/include.ts`) skips the upper copy when a function's slot is seated below the link it was found at. That arm is tagged `@inventedArm skip — PERMANENT`. A function has one super slot (`superSlots` in `packages/ruby-compat/lib/object.ts`), so it cannot answer from two ancestry positions. The reviewer noted that this limit is trails' carrier design, not a TypeScript one.

## Acceptance criteria

- `Child.new.setup` above answers `["mod", "prepended", "mod", "base"]`, for both sync and async bodies (`TestFixtures#beforeSetup` calls `super` after an `await`).
- Converged shape: each include position has its own super seat, so the copy found at a link resolves its `super` from that link. For example, seat a per-copy bound function in the prepend-origin branch, or give `rbCallSuper` a defined-class argument as MRI's `vm_search_super_method` uses `me->defined_class`.
- The `@inventedArm skip — PERMANENT` receipt on `rbCallSuper` is removed.
- The ruby-compat test "does not cycle when a module is included into a subclass and then into its parent below a prepend" asserts the MRI order.
