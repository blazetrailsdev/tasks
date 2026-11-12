---
title: "Ratify the importmap/propshaft-out-of-scope, Vite-serves-JavaScript ruling in CLAUDE.md"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: ruling
packages: [trailties]
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
- The section settles RFC open questions 1 (the Stimulus manifest), 3 (the
  entrypoint path) and 5 (`@hotwired/turbo-rails`), plus the install
  templates' package-manager rule. The draft text already carries each
  recommendation, and the operator confirms or edits each one.
- The section records open question 4's answer: `bin/vite` is built on
  `@blazetrails/thor`, and dry-cli is not ported. Open question 2 is answered by the
  ruling text (`trailsPlugin` stays as test-only infrastructure), and
  `vite-trails-dev-server-topology` implements that answer.
- The RFC's open questions section is updated to match what was ratified.
- The ratification date replaces `<ratification date>` in the RFC's draft text.
