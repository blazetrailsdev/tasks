---
title: "Port redcarpet and rouge for the Writebook example"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

Writebook renders Markdown with redcarpet and highlights code with rouge (`vendor/writebook/v1.2.9/lib/markdown_renderer.rb`, `lib/rails_ext/action_text_markdown.rb`, Gemfile `redcarpet ~> 3.6`, `rouge ~> 4.5`). Neither gem is ported, so `examples/electron-writebook/lib/redcarpet.ts` is a stand-in over the `marked` npm package with redcarpet's `Markdown` / `Render::HTML` surface (`header`, `image` hooks); rouge highlighting is not applied.

## Acceptance criteria

- redcarpet (and rouge's `Rouge::Plugins::Redcarpet`) are vendored in `vendor/sources.ts` and ported, or the operator rules npm-backed (`marked`) is the port.
- `examples/electron-writebook/lib/redcarpet.ts` is replaced by the port; fenced code blocks are highlighted as in Writebook.
