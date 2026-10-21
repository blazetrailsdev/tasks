---
title: "port-builder-gem-xml-markup"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

# Port the builder gem's Builder::XmlMarkup

## Context

`ActionView::Template::Handlers::Builder#call` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/builder.rb:8-14`) compiles a `.builder` template to `xml = ::Builder::XmlMarkup.new(indent: 2, target: output_buffer.raw); <source>; output_buffer.to_s`, and `require_engine` (`:17-22`) requires the `builder` gem. trails has no port of the gem (no `packages/builder`, no `vendor/builder`), so `port-builder-template-handler` has nothing for its compiled source to reach. `XmlMarkup` answers any tag name through `method_missing` (`Builder::XmlBase#method_missing`), which per root CLAUDE.md § "Ruby protocol methods with a different JS mechanism" is decided per class (likely a Proxy). A `.builder` file also needs a precompile path: § "Templates are precompiled" only covers `.tse` via `build-views`.

## Acceptance criteria

- The builder gem is vendored (`vendor/builder/<version>`) and `Builder::XmlBase` / `XmlMarkup` are ported in a new package, with its spec/tests mirrored.
- The `method_missing` tag dispatch is decided and recorded in the CLAUDE.md table.
- `build-views` (or its sibling) emits a module for a `.builder` template, so `Handlers::Builder` can be registered and rendered.
