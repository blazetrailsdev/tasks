---
title: "trails new links /icon.png and /icon.svg but never generates them"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' app generator copies `public/` non-recursively (`public_directory`,
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:220-224`). That
directory includes `icon.png` and `icon.svg`
(`railties/lib/rails/generators/rails/app/templates/public/`). The generated layout links both:
`application.html.erb.tt:15-17`, `<link rel="icon" href="/icon.png">`,
`<link rel="icon" href="/icon.svg">` and `<link rel="apple-touch-icon" href="/icon.png">`.

trails#8255 ported those three `<link>` lines into the generated `application.html.tse`. But
`trails new` (`packages/trailties/src/generators/app-generator.ts`, the `public/` files near
`:1185-1297`) writes an empty `public/favicon.ico` and no `icon.png` / `icon.svg`, so every page
of a fresh app requests two icons that 404. Rails 8.0's `public/` template has no
`favicon.ico` at all.

## Acceptance criteria

- `trails new` writes `public/icon.png` and `public/icon.svg`, copied byte-for-byte from the
  vendored Rails templates, or a trails-branded pair at the same paths.
- `public/favicon.ico` is no longer generated, matching the Rails 8.0 `public/` template.
- The app-generator test asserts both icon files exist.
