---
title: "Un-skip form_helper_test's :value test once Message has has_rich_text"
status: ready
updated: 2026-11-14
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps:
  - actiontext-dummy-models-rich-text-and-fixtures
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actiontext/test/template/form-helper.test.ts` parks Rails' "#rich_textarea helper renders the :value argument into the hidden field" (`vendor/rails/v8.0.2/actiontext/test/template/form_helper_test.rb`) as `it.skip`. The dummy `Message` (`packages/actiontext/test/dummy/app/models/message.ts`) lacks Rails' `has_rich_text :content` / `has_rich_text :body` (`vendor/rails/v8.0.2/actiontext/test/dummy/app/models/message.rb:2-3`). `hasRichText` is ported (`packages/actiontext/lib/attribute.ts`), but only `rich-text.trails.test.ts` wires it, by hand in a `beforeAll`.

## Acceptance criteria

- Once actiontext-dummy-models-rich-text-and-fixtures gives `Message` its `has_rich_text` declarations, the `it.skip` is removed and the test passes with Rails' expected HTML.
