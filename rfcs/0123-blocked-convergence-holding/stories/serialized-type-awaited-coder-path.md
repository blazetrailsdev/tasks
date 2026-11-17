---
title: "Type::Serialized awaits an async coder when a record is built"
status: in-progress
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10276
claim: "2026-11-17T22:49:26Z"
assignee: "serialized-type-awaited-coder-path"
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `action-text-content-built-with-awaited-static-new` (operator ruling 2026-11-17: `ActionText::Content` gets an awaited `static async new`, and the serialized-attribute type grows an awaited coder path so `serialize :body, coder: ActionText::Content` reaches `await Content.new(...)` on load).

`packages/activerecord/lib/type/serialized.ts` calls `coder.load` synchronously in `deserialize` (Rails `vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:18-24`), in `default_value?` (`:62-64`), and through `Mutable#cast` (`deserialize(serialize(value))`, `vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/mutable.rb`) on assignment. Attribute readers and writers are sync, so a coder whose `load` returns a promise (ActionText's `Serialization.load` → `await Content.new`, `packages/actiontext/lib/serialization.ts`) has no awaited place to run.

## Design (operator ruling 2026-11-17)

**Load at record build; the sync reader peeks.** The "prewarm, then peek" shape of `packages/activerecord/CLAUDE.md` § "Schema reflection peeks at a warm cache".

- **Reads from the database.** Every record-building path (`find`, `Relation#load`, association loads and preloads) is already async. After it builds each record, it awaits `coder.load(raw)` for every serialized attribute whose coder's `load` returns a promise, and seats the result as the attribute's value. The sync `record.body` reader returns the seated value.
- **Laziness stays in user code.** The rich text is its own record: `message.richTextContent` is a `hasOne` read that is a promise unless preloaded (`packages/actiontext/lib/attribute.ts:17-18`), and `withRichTextContent()` / `withAllRichText()` (`attribute.ts:103`) are explicit. Loading a `Message` never canonicalizes a body; only awaiting the rich text does. Rails defers `deserialize` to the first `body` read, so a `RichText` row loaded and never read is the one case that now pays early. Accepted by the operator; do NOT add an opt-in load API, a lazy awaited `body` reader, or a promise-valued attribute.
- **Assignment.** For an attribute whose coder is async, the writer is an awaited `setX(value)` (root CLAUDE.md, the `setX()` workaround for an async Ruby `x=`), which runs `Mutable#cast`'s load and seats the result. `has_rich_text`'s writer awaits it.
- **`default_value?`'s `coder.load(nil)` stays sync.** `Serialization.load(nil)` answers `nil` before reaching `Content.new` (`vendor/rails/v8.0.2/actiontext/lib/action_text/serialization.rb`).
- Prewarm only attributes whose coder returns a promise; every existing coder keeps its sync path untouched.
- First confirm every record-building path funnels through one async point; if not, size the extra sites before starting.

## Acceptance criteria

- [ ] Records built from the database await async-coder serialized attributes before they are returned, through every build path (find, relation load, association load, preload).
- [ ] Assigning an async-coder attribute goes through an awaited `setX()`; the sync reader then answers the loaded value.
- [ ] `default_value?`'s `coder.load(nil)` stays sync; sync coders are unchanged.
- [ ] No opt-in load API, lazy awaited reader, or promise-valued attribute.
- [ ] activerecord tests with an async coder over the canonical schema, including a rejection from `load` surfacing at the awaited find.
- [ ] Unblocks `action-text-content-built-with-awaited-static-new`.
