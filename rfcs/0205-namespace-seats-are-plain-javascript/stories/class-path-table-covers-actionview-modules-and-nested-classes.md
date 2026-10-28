---
title: "Class-path table covers actionview modules, nested classes and test-case.ts so naming-only seats retire"
status: claimed
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-28T14:49:24Z"
assignee: "retire-array-helper-rows-after-native-sweep"
blocked-by: null
closed-reason: null
---

## Context

trails#9374 kept a few actionview `rbModConstSet` seats only because they are the sole source of `rbModName`. `scripts/api-compare/class-paths.ts` does not cover:

- `packages/actionview/src/test-case.ts`, which tsconfig excludes from the entry graph (`entryGraph`/`tsconfigExcludes`). Without the seats, `rbModName(TestCase)` answers `TestCase` and not `ActionView::TestCase` (`actionview/lib/action_view/test_case.rb`). The same goes for `Behavior::ClassMethods`, `RenderedViewContent`, `RenderedViewsCollection`, `Locals` and `INTERNAL_IVARS`.
- `Layouts` (`layouts.ts:272`): it is a ruby-compat `Module`, not a class, and without the seat it answers `null` (`action_view/layouts.rb`).
- `Tags::Placeholderable` (`helpers/tags/placeholderable.ts`) and `Tags::SelectRenderer` (`helpers/tags/select-renderer.ts`), which are plain-object modules (`helpers/tags/placeholderable.rb`, `select_renderer.rb`).
- `ActionView::Template::Error` (`template.ts:546`): the nested path is composed from `rbModConstSet(ActionView, "Template", Template)`, so it answers `Template::Error` once that seat is gone.
- `ActionView::I18nProxy` (`rendering.ts:45`): `template/lookup-context.test.ts:133` also reads it off the namespace.

None of these mirror a Rails `const_set`.

## Acceptance criteria

- [ ] The class-path generator (or the table it writes) covers modules and plain-object modules, nested classes, and files outside the entry graph that a test entry loads, so these classes get their Rails `fqn`.
- [ ] Each seat listed above becomes a plain `Owner.Name = Klass` assignment, or is deleted. `rbModName` answers the same path as before.
- [ ] `lookup-context.test.ts` imports `I18nProxy` directly.
- [ ] `pnpm parity:class-paths:check --package actionview` passes, and so does the plain-node entry check over `dist/**.js`.
