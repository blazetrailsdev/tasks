---
title: "Port Attachable, the three Attachables, and attachable/attachment/trix tests"
status: done
updated: 2026-11-11
rfc: "0219-actiontext-port"
cluster: at-content
packages: ["actiontext"]
deps: ["actiontext-trix-attachment-and-attachment", "actiontext-migration-and-test-database"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9986
claim: "2026-11-11T10:41:32Z"
assignee: "actiontext-attachables"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text/attachable.rb` (156): `LOCATOR_NAME`, `from_node`'s
  four arms (`:31-41`), `from_attachable_sgid`'s
  `GlobalID::Locator.public_send(method, …)` between `locate_many_signed` and
  `locate_signed` (`:43-47`), the `class_methods` (`:57-75`), the instance
  readers (`:79-141`) and the private serialization overrides calling `super`
  (`:143-154`).
- `lib/action_text/attachables/content_attachment.rb` (42, `ActiveModel::Model`
  with `validates_format_of` / `validates_presence_of`),
  `missing_attachable.rb` (29, `SignedGlobalID.parse` and
  `model_name.to_s.safe_constantize`), `remote_image.rb` (48).
- Tests: `test/unit/attachable_test.rb` (3), `attachment_test.rb` (10),
  `trix_attachment_test.rb` (4); they use the dummy `Person` attachable.

## Acceptance criteria

- `from_attachable_sgid`'s dispatch is an `if`/`else` over
  `GlobalID.Locator.locateManySigned` / `locateSigned` (RFC "Dispatch by
  name"); it is async, and so is `from_node` and every caller that reaches
  it, as `GlobalID::Locator` is async in trails; the list of those callers
  is the RFC's, in "Rendering is async where ActionView's is".
- `Attachable`'s `super`-calling privates use `rbCallSuper` from
  `attachable.ts` (RFC "Mixins and module `super`").
- `MissingAttachable#model` is `safeConstantize` over the sgid's model name
  (CLAUDE.md § "Constant lookup is an import or a registry").
- `ContentAttachment.from_node` awaits `isValid` (validations are async).
- The 17 tests in the three files pass.
