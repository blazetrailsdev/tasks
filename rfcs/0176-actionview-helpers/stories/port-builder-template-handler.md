---
title: "Port ActionView Builder template handler and mirror .builder fixtures"
status: claimed
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: "2026-10-21T00:47:23Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Handlers::Builder` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/builder.rb`) is unported: `packages/actionview/src/template/handlers/` holds only `html.ts`, `raw.ts`, `tse.ts`. trails#9119 mirrored `actionview/test/fixtures/actionpack/` for `render_test.rb` but had to leave out the 9 `.builder` templates (`layouts/builder.builder`, `test/hello.builder`, `test/_hello.builder`, `test/formatted_xml_erb.builder`, `test/hello_world_container.builder`, `test/hello_world_from_rxml.builder`, `test/hello_xml_world.builder`, `test/implicit_content_type.atom.builder`, `test/non_erb_block_content_for.builder`). The `render_test.rb` / `capture_test.rb` tests that render them (`xml.*`, `implicit_content_type`, `non_erb_block_content_for`) cannot be ported.

## Acceptance criteria

- Port `Handlers::Builder` (`builder.rb`) at `template/handlers/builder.ts`, method for method, registered as `:builder` as `template/handlers.rb` does.
- Mirror the 9 `.builder` fixtures under `packages/actionview/src/test-helpers/fixtures/actionpack/` at their Rails paths, with the Ruby `xml.*` calls translated to TS.
