---
title: "The markdown gate detects directories by catching readdir, where FsAdapter.stat exists"
status: done
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 3
pr: trailmap#20
claim: "2026-09-09T15:00:55Z"
assignee: "deployed-rfcs-index-500s-with-connectionnotdefined"
blocked-by: null
closed-reason: null
---

## Context

`markdownFilesIn` (`scripts/gate-ringo-markdown.ts`) tells a directory from a
file by CALLING `fs.readdir` and catching the failure, under a comment claiming
"the async filesystem adapter models no `stat`". That claim is wrong. The
adapter does model one:

    /** Async stat — async-only callers use this instead of statSync. */
    stat?(path: string): Promise<FsStatResult>;
    -- node_modules/@blazetrails/activesupport/dist/fs-adapter.d.ts:88

and `FsStatResult` carries `isDirectory()` (`fs-adapter.d.ts:20`). So the walk
uses exception-driven control flow, and one extra syscall per non-markdown
entry, to reconstruct an answer the framework already gives.

Worth fixing for what the comment does rather than for the syscalls: a false
claim that the framework lacks something is exactly how a real gap gets filed
against trails later on no evidence, and how the next person writes the same
workaround.

## Expected shape

`await fs.stat!(full)` then `.isDirectory()`, the try/catch gone, and the
comment deleted rather than corrected. Note `stat` is optional on the
interface — the Node adapter implements it, and the existing `fs.readFile!`
calls in the same file already assume that shape.

## Acceptance criteria

- The walk uses the adapter's async `stat`, not a caught `readdir`.
- The comment claiming the adapter models no `stat` is gone.
- `pnpm gate:markdown` still renders the same corpus (~8,800 documents).
