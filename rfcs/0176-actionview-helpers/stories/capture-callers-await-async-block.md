---
title: "capture's callers await an async block like form_tag does"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 13
pr: trails#9195
claim: "2026-10-21T21:15:41Z"
assignee: "tse-emitter-share-node-loop-with-stand-in"
blocked-by: null
closed-reason: null
---

## Context

trails#9159 changed `CaptureHelper#capture` (`packages/actionview/src/helpers/capture-helper.ts`) to return a Promise when its block is async. It also made `formTag` (`form-tag-helper.ts`) wait for that Promise and then re-enter itself. Rails' `capture` is `capture_helper.rb:47-63` and its `form_tag` is `form_tag_helper.rb:77-84`. The other actionview `capture(` call sites (about 15, e.g. `tag-helper.ts:249` `content.push(this.capture(block))`) still take the result as a sync `SafeBuffer`. Each of them stringifies a pending Promise when its block awaits a nested `render`.

Both async arms carry `@inventedArm if/then — PERMANENT`. The owner decision blocking `output-buffer-capture-async-block-converge` (`buffers.rb:72-79`, sync begin/yield/ensure) is still open. These receipts must follow that ruling: they become `CONVERGEABLE` if the owner picks a per-capture buffer threaded into the compiled block.

## Acceptance criteria

- Every caller of `capture` in `packages/actionview/src/helpers/` handles an async block the way `formTag` now does, or the ruling makes them unnecessary. Callers include `contentTag`'s block arm, `link_to` with a block, `button_tag` / `label_tag` with a block, and `fields`.
- Each caller has a test that renders an awaited `render(plain:)` inside the block and asserts it lands inside the tag.
- Add a test for `StreamingBuffer#capture` with an async block (`buffers.rb:126-133`). It is currently untested.
- The `@inventedArm` receipts on `capture` / `formTag` match the owner's ruling on `output-buffer-capture-async-block-converge`.
