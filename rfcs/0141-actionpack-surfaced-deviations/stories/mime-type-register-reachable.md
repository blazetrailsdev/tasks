---
title: "Mime::Type.register is reachable from an app"
status: closed
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: MimeType is exported from @blazetrails/actionpack (packages/actionpack/lib/action-dispatch/index.ts:61); an app calls MimeType.register directly."
---

## Context

An app registers a MIME type in `config/initializers/mime_types.rb` with `Mime::Type.register "text/markdown", :md`. In trails, `MimeType` (`packages/actionpack/lib/action-dispatch/http/mime-type.ts:315`) is not exported from `@blazetrails/actionpack`. `TopLevel.Mime` (`packages/actionpack/lib/namespaces.ts:266`) has no `Type` member, and `package.json` exports no subpath for it. Writebook's `format.md` responses (`vendor/writebook/v1.2.9/app/controllers/books_controller.rb:157-164`, `leafables_controller.rb:604-609`, `app/views/books/show.md.erb`, `app/views/leafables/show.md.erb`) are therefore omitted from `examples/electron-writebook`.

## Acceptance criteria

- `Mime.Type` (or an exported `MimeType`) is reachable from `@blazetrails/actionpack`, so an initializer can call `register`.
- The Writebook example ports `format.md` in `BooksController#show` and `LeafablesController#show`, plus both `show.md` views.
