---
title: "tag-builder-trailing-undefined-block"
status: in-progress
updated: 2026-11-18
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10292
claim: "2026-11-18T12:51:37Z"
assignee: "tag-builder-trailing-undefined-block"
blocked-by: null
closed-reason: null
---

## Context

`TagBuilder#methodMissing` (`packages/actionview/lib/helpers/tag-helper.ts:740-755`) pops the last argument as the block only when it is a function. A caller forwarding Ruby's `&block` where the block is nil passes a trailing `undefined`. `extractOptionsBang` then misses the options hash, and the options are rendered as content. Rails' `method_missing(called, *args, escape: true, **options, &block)` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb`) gets no block from `&nil`.

The workaround: `Turbo::FramesHelper#turbo_frame_tag` (`packages/turbo/lib/app/helpers/turbo/frames-helper.ts`) branches on `block` before calling `tag().turbo_frame`. Rails calls it once (`vendor/turbo-rails/v2.0.23/app/helpers/turbo/frames_helper.rb:41-46`).

## Acceptance criteria

- `methodMissing` treats a trailing `undefined` as an absent block, as `&nil` is.
- `turboFrameTag` calls `this.tag().turbo_frame(options, block)` once, with no branch, and its `@inventedArm` receipt is removed.
