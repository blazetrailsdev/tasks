---
title: "tse-tracker-known-keys-are-camelcase"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TSETracker`'s `ALL_KNOWN_KEYS` (`packages/actionview/src/dependency-tracker/tse-tracker.ts:7-20`)
holds Ruby snake_case option names — `spacer_template`, `content_type` — and
`renderDependencies` (`:109-112`) matches `\bspacer_template:` literally. No
TSE template contains either spelling: RFC 0149 and root CLAUDE.md
§ "`symbolize_keys` on an option hash" make a trails option hash camelCase, and
`render-context.ts:13,37,113`, `renderer/abstract-renderer.ts:67` and
`renderer/collection-renderer.ts:270-271` all spell it `spacerTemplate`.

Measured against the built tracker (2026-10-20), the two `RubyTracker` arms
ruled in `packages/actionview/CLAUDE.md` do not hold for the call shape a real
template has:

| source                                                                                                  | `dependencies()`                                  | Rails          |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------- |
| `render partial: "messages/message", collection: books, spacer_template: "messages/message_spacer"`     | `["messages/message_spacer", "messages/message"]` | same           |
| `render({ partial: "messages/message", collection: books, spacerTemplate: "messages/message_spacer" })` | `["messages/message"]`                            | spacer lost    |
| `render partial: "unknown_render_call", unknown_render_option: "yes"`                                   | `[]`                                              | same           |
| `render({ partial: "unknown_render_call", unknownRenderOption: "yes" })`                                | `["messages/unknown_render_call"]`                | should be `[]` |

A missed `spacerTemplate` dependency is a cache fragment that never
invalidates, not a cosmetic gap. The unknown-option guard is inert for
`render({ … })` besides: the `/\{[^{}]*\}/u` strip at `:103` removes the braces
body, so `matchAll(/\b(\w+):/gu)` extracts no keys and the guard never fires.

The three `RubyTrackerTests`
(`vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb:274-302`)
pass only because their `FakeTemplate` sources are Ruby call syntax. Respelling
those fixtures as `render({ … })` is a test BODY change, which CLAUDE.md
§ "NEVER rename or reword test names" does not cover — the names stay — and the
current fixtures exercise syntax no trails engine renders.

Repo-owner ruling (2026-10-20): fix the key spelling and respell the fixtures
now; the structural convergence onto the TSE AST follows in
[[tse-tracker-render-options-are-text-heuristics]].

## Acceptance criteria

- `ALL_KNOWN_KEYS` holds the camelCase spellings trails templates use
  (`spacerTemplate`, `contentType`, …), matching the keys
  `render-context.ts` and `renderer/abstract-renderer.ts` accept.
- The spacer match reads `spacerTemplate:`, and the `spacerTemplate`
  dependency is found for a `render({ … })` call.
- The three `RubyTrackerTests` fixtures in
  `packages/actionview/src/template/dependency-tracker.test.ts` are respelled
  as `render({ … })` at their existing Rails test names, and still assert the
  Rails expectations — including `[]` for the unknown-option case, which means
  the guard has to fire on the braces shape.
- `pnpm parity:test --package actionview` does not regress for
  `dependency_tracker_test.rb` (25/25 today), and `pnpm parity:api:calls` /
  `:args` stay green.
- Out of scope: the `%>`-in-string and nested-hash gaps, and the
  `object:`/`collection:`-without-`partial:` guard — those are the AST story.
