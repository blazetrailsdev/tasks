---
title: "Port ActionText::Content and Rendering, with content_test"
status: draft
updated: 2026-11-03
rfc: "0000-actiontext-port"
cluster: at-content
packages: ["actiontext"]
deps: ["actiontext-attachables"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb` (197): `include Rendering, Serialization,
ContentHelper` (`:25`), the two `delegate` lines (`:29-30`),
  `fragment_by_canonicalizing_content`, `initialize`'s
  `options.with_defaults! canonicalize: true` (`:40-48`), the memoized
  readers (`:55-91`), `append_attachables`, `render_attachments` (block,
  sanitizes a `content` attribute through `ContentHelper`, `:98-107`),
  `render_attachment_galleries`, `to_plain_text`, `to_trix_html`,
  `to_html`, `to_rendered_html_with_layout`, `to_s`, `as_json`, `inspect`,
  `==` (`:169-175`), and the `:action_text_content` load hook.
- `lib/action_text/rendering.rb` (35): `thread_cattr_accessor :renderer,
instance_accessor: false`, `delegate :render, to: :class`,
  `action_controller_renderer` over `Class.new(ActionController::Base).renderer`,
  `with_renderer` with `ensure`, `render`.
- Test: `test/unit/content_test.rb` (25 tests).

## Acceptance criteria

- Render-reaching members return what `render` returns and are awaited by
  their callers; the members the RFC lists as reaching
  `Attachable.from_node` (`attachments`, `attachables`, `to_plain_text`, …)
  are async; `to_html`, `links`, `==`, `as_json` and `Serialization` stay
  sync (RFC "Rendering is async where ActionView's is"). If TSE cannot output a promise-valued `to_s`, a
  story is filed against actionview with the failing template, per open
  question 2.
- `initialize`'s `canonicalize` default keeps Rails' `with_defaults!`
  semantics (an explicit `false` wins).
- `==` keeps both arms, including the subclass arm comparing `to_s`.
- `inspect` uses `truncate(25)` and `rbInspect`.
- `content_test.rb`'s 25 tests pass, each skip a `PERMANENT-SKIP` citing a
  ruling (the rightward-pattern test at `content_test.rb:228`, `content =>
[h1, div]`, cites CLAUDE.md § "Ruby pattern matching has no port"; the
  test's other assertions are still ported).
