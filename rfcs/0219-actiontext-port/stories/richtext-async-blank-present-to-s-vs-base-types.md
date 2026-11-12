---
title: "richtext-async-blank-present-to-s-vs-base-types"
status: draft
updated: 2026-11-12
rfc: "0219-actiontext-port"
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

## Context

`vendor/rails/v8.0.2/actiontext/app/models/action_text/rich_text.rb:40,89` delegates `to_s` to `body` and `blank?`, `empty?` and `present?` to `to_plain_text`. In trails, `Content#toPlainText` and `Content#toString` are async (RFC 0219 § "Rendering is async where ActionView's is", open question 5), so the delegated predicates are async. But `packages/activerecord/lib/base.ts:1796-1797` declares `isPresent: () => boolean` / `isBlank: () => boolean`, and `Object#toString` returns `string`. An async override in `packages/actiontext/lib/rich-text.ts` fails TS2416, and that failure also breaks `this.serialize` / `this.beforeSave` (TS2684) in the class body. trails#10044 shipped `isEmpty`, `isNil`, `toPlainText` and `toTrixHtml`, and left these three out.

The `storeIfBlank: false` writer in `packages/actiontext/lib/attribute.ts` (Rails `attribute.rb:71-81`) reads `name?` synchronously as `isPresent(richText.body?.toHtml())`, because `isName` is async and `name=` is a sync setter (open question 1).

## Acceptance criteria

- An operator ruling on how `RichText#blank?` / `#present?` / `#to_s` are typed against `Base`'s sync `isBlank` / `isPresent` and `toString(): string`.
- Port the three delegations under that ruling.
- Converge the `storeIfBlank: false` arm onto `name?` (`isName`), or record the ruling that permits the sync read.
