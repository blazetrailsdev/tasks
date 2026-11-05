---
title: "mailer-collector-renders-each-format-before-the-next-is-set"
status: claimed
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-05T21:36:24Z"
assignee: "actionmailer-base-test-remaining-attachments-multipart-defaults"
blocked-by: null
closed-reason: null
---

## Context

`Collector#custom` (`packages/actionmailer/src/collector.ts`; Rails `vendor/rails/v8.0.2/actionmailer/lib/action_mailer/collector.rb:24-30`) sets `@context.formats = [mime.to_sym]` and calls the default render. In Rails that render finishes before the next format is set. In trails `render` is async, so a format-less template (`explicit_multipart_with_one_template.erb`, `<%= self.formats.inspect %>`) reads `formats` after the block has already moved on to the last format. Both parts then render `[:text]`.

## Acceptance criteria

- Each part of a `mail` block renders with the formats its own `format.x` call set.
- "explicit multipart with one template has the expected format" in `packages/actionmailer/src/base.test.ts` is un-skipped and passes.
