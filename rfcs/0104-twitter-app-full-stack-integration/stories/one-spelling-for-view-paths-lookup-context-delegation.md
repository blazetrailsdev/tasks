---
title: "Collapse the two spellings of ViewPaths' formats/locale delegation to one"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::ViewPaths` has one delegation line
(`actionview/lib/action_view/view_paths.rb:12-13`):

```ruby
delegate :template_exists?, :any_templates?, :view_paths, :formats, :formats=,
         :locale, :locale=, to: :lookup_context
```

trails now spells it TWICE, and only one spelling is reachable:

- `packages/actionview/src/view-paths.ts:147-161` exports `this`-typed
  `formats()` / `locale()` overload pairs (getter when called with no argument,
  setter with one) — the file matching Rails' layout, per CLAUDE.md's module-mixin
  convention. They are **not** re-exported from `packages/actionview/src/index.ts`
  and nothing in the repo calls them. Dead since they were written.
- `packages/actionpack/src/action-controller/base.ts:348-366` declares
  `get formats()` / `set formats()` / `get locale()` / `set locale()` accessors
  that go straight to `this.lookupContext`. Added by
  `generated-app-cannot-render-its-own-views` (#7364), because
  `ActionController::Rendering#process_action` (`rendering.rb:190-194`) needs
  `self.formats =` to reach the lookup context.

The accessors had to be declared in the class body — a TS class field assigned
from a function cannot be a getter/setter pair, so the `this`-typed-function
mixin shape does not reach an accessor. But `_formats.call(this)` was also
tried and fails for a _separate_ reason worth recording: TypeScript resolves
`Function.prototype.call` against the LAST overload signature, so calling the
one-argument setter overload with zero arguments is a type error
(`TS2554: Expected 2 arguments, but got 1`) and there is no way to select the
getter overload through `.call`.

The remaining question is which spelling survives, not whether both should.

## Acceptance criteria

- One spelling of `delegate :formats, :formats=, :locale, :locale=, to:
:lookup_context` remains. Either the `view-paths.ts` functions are deleted as
  unreachable, or `base.ts` is made to route through them (which requires
  splitting the overload pairs so `.call` can pick a signature — note that
  changes `view-paths.ts`'s existing exported shape).
- `template_exists?` / `any_templates?` / `view_paths`, the other three members
  of the same Rails `delegate` line, keep whichever shape is chosen, so the one
  line ports as one thing.
- Whichever is deleted, `pnpm parity:api:extra --package actionview` and
  `--package actioncontroller` show no new novel names.
