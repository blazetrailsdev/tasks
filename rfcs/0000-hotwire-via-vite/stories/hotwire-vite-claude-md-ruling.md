---
title: "Ratify the importmap/propshaft-out-of-scope, Vite-serves-JavaScript ruling in CLAUDE.md"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: ruling
packages: [trailties]
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

The RFC's "The ruling" section holds draft text for a new `trails/CLAUDE.md`
section. It is modeled on "Trilogy is out of scope"
(`packages/activerecord/CLAUDE.md`). Rails' app generator defaults
`--javascript` to `importmap`. trails' mirror is
`packages/trailties/lib/generators/app-base.ts:48` (`JAVASCRIPT_OPTIONS`) and
`lib/generators/trails/app/app-generator.ts:498-503` (`default: "importmap"`).
The operator decided on 2026-11-12 that Vite, through ports of
`vendor/vite_ruby/v3.11.1/vite_ruby` and `vendor/vite_ruby/v3.11.1/vite_rails`, replaces importmap-rails and propshaft.

## Acceptance criteria

- The operator ratifies the section text, editing it if needed.
- `trails/CLAUDE.md` gains the section under its own heading, worded as
  ratified, with "Ruled by the operator on <date>".
- Open questions 1, 3 and 5 of this RFC are answered in the section.
  Questions 2 and 4 are answered or deferred to their owner stories
  (`retire-trailties-vite-assets-trailtie`, `dry-cli-gem-port`), and the RFC's
  open questions section is updated to match.
- The ratification date replaces `<ratification date>` in the RFC's draft text.
