---
title: "Converge Content#initialize to Rails' single canonicalized fragment assignment"
status: done
updated: 2026-11-18
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps:
  - action-text-content-built-with-awaited-static-new
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10276
claim: "2026-11-18T14:06:32Z"
assignee: "content-attachment-template-implicit-to-s"
blocked-by: null
closed-reason: null
---

## Context

`ActionText::Content#initialize` (`vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb:40-48`) assigns `@fragment` once: `fragment_by_canonicalizing_content(content)` when `canonicalize`, else `Fragment.wrap(content)`. trails' canonicalization is async because it reaches the sgid lookup. So the `Content` constructor in `packages/actiontext/lib/content.ts` (trails#10044) wraps the fragment eagerly and replaces it when the `canonicalized` promise resolves. That keeps `serialize :body, coder: Content` sync. The operator ruled this on 2026-11-12 ("Eager fragment"). It costs a baselined call row, `order:wrap,fragmentByCanonicalizingContent`, in `scripts/api-compare/call-mismatches-exclude/actiontext/content.json`. It also costs a `canonicalized` field with no Rails equivalent, which `RichText`'s `before_save` awaits (`@inventedArm canonicalized`).

A related consequence: `RichText`'s plain-text memo is keyed by `body.toHtml()`. If the eager fragment is replaced after `toPlainText()` starts, a later `blank?` raises `RuntimeError` spuriously.

## Ruling (operator, 2026-11-17)

Converge through the async `static new` ruled on
`action-text-content-built-with-awaited-static-new`: the coder's `load` returns an
awaited, canonicalized `Content`. Sync canonicalization (a sync `Fragment#update` /
`#replace`) is rejected. This story lands after that one, and owns whatever of the
criteria below it leaves (the baseline row, the `RichText` predicates).

## Acceptance criteria

- Converge the constructor to Rails' single assignment. One option is a sync canonicalization path: the sgid lookup is deferred to `attachments()`, and canonicalizing nodes needs no lookup. Another option is a coder `load` that returns an awaited, canonicalized `Content`.
- Delete the `content.json` baseline row, and with it the `canonicalized` field and its `@inventedArm canonicalized` receipt in `rich-text.ts`, wherever the convergence allows.
- `RichText` predicates stay correct across canonicalization.
