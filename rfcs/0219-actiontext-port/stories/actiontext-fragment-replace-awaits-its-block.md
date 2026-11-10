---
title: "Await the block in Fragment#replace for fragment_by_converting_trix_attachments"
status: draft
updated: 2026-11-10
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

`Attachments::TrixConversion.fragment_by_converting_trix_attachments`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/attachments/trix_conversion.rb:12-16`)
is `Fragment.wrap(content).replace(TrixAttachment::SELECTOR) { |node| from_trix_attachment(...) }`.
`from_trix_attachment` reaches `Attachment.from_node`, which is async in trails
(RFC 0219 § "Rendering is async where ActionView's is": `Attachable.from_node`
locates a signed GlobalID). `Fragment#replace` (`packages/actiontext/lib/fragment.ts`,
`fragment.rb:36-44`) takes a sync block, so the port in
`packages/actiontext/lib/attachments/trix-conversion.ts` pre-resolves every
attachment, then replaces by index, receipted `@inventedArm await`.

## Acceptance criteria

- `fragmentByConvertingTrixAttachments` is `Fragment.wrap(content).replace(SELECTOR, block)`
  with the block awaited, matching `trix_conversion.rb:12-16`: either
  `Fragment#replace` / `#update` await a promise-returning block, or the
  owner rules on the shape.
- The `@inventedArm await` receipt is removed.
