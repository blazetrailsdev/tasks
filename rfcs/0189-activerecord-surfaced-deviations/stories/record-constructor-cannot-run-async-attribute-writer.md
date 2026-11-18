---
title: "Record constructor cannot run an async attribute writer (Message.new(content:))"
status: draft
updated: 2026-11-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10276 made `has_rich_text`'s writer the awaited `set<Name>()` (Rails `"#{name}="`, `vendor/rails/v8.0.2/actiontext/lib/action_text/attribute.rb:66-81`), because assigning a body reaches `ActionText::Content.new`, which canonicalizes through an awaited GlobalID lookup (`content.rb:40-48`), via `Type::Serialized`'s `Mutable#cast`.

Rails builds a record with rich text in its constructor: `Message.new(subject: "x", content: "<h1>hi</h1>")` runs `assign_attributes` → `_assign_attribute` → `public_send("content=", v)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb`). In trails, `Base`'s constructor cannot await, so an async writer raises a `RuntimeError` from `assertAssignedSynchronously` (`packages/activerecord/lib/base.ts`) telling the caller to `await record.setAttributes(...)` instead.

As a result, every Rails `Model.new(content: ...)` ports as `new Model()` followed by `await model.setAttributes({...})`:

- `packages/actiontext/test/dummy/app/controllers/messages-controller.ts` `create` (Rails `@message = Message.new(message_params)`)
- `packages/actiontext/test/unit/model.test.ts` "html conversion", "plain text conversion", "if disallowing blanks, can still validate presence"
- `packages/actiontext/test/integration/mailer-render.test.ts` "uses default_url_options"
- `packages/actiontext/test/template/form-helper.test.ts` "#rich_textarea helper renders the :value argument into the hidden field"

`packages/activerecord/CLAUDE.md` § "A record is built with `new Klass` only" says a record class with async `initialize` work is an operator decision filed as a story. This is that story.

## Acceptance criteria

- [ ] Operator decision recorded on how a record constructor reaches an async attribute writer (for example `Model.create`-style awaited construction, or a constructor that defers the writer to an awaited step before the record is read).
- [ ] `new Message({ content })` (Rails `Message.new(content:)`) works, and reading `message.content.body` afterwards answers the loaded `Content`.
- [ ] The converted call sites above return to the Rails shape.
