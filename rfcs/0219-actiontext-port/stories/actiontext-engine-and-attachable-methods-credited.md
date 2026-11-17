---
title: "Credit or converge actiontext engine.rb Blob methods and Attachable class methods"
status: done
updated: 2026-11-17
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10266
claim: "2026-11-17T18:51:48Z"
assignee: "actiontext-engine-and-attachable-methods-credited"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiontext` reports five methods missing that the TS does define:

- `engine.rb`: `previewable_attachable?`, `attachable_plain_text_representation`, `to_trix_content_attachment_partial_path` (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb:45-55`, defined in a `to_prepare` `class_eval` on Blob). TS: `packages/actiontext/lib/engine.ts:103`, inside an object literal applied to Blob.
- `attachable.rb`: `from_node`, `attachable_from_sgid` (`vendor/rails/v8.0.2/actiontext/lib/action_text/attachable.rb:31,...`, `class_methods`). TS: `packages/actiontext/lib/attachable.ts:118,145`, as property-descriptor objects.

## Acceptance criteria

- Either the extractor credits these shapes, or the TS is converged to a shape it credits (preferred where the current shape is itself invented).
- parity:api reports `engine.rb` 3/3 and `attachable.rb` 15/15.
