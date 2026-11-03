---
title: 'getPath().basename drops its extension argument, so basename(p, ".ts") keeps the .ts'
status: draft
updated: 2026-11-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`getPath()`'s path adapter declares `basename(p: string): string`
(packages/ruby-compat/src/fs-adapter.ts:154) and its Node implementation is
`basename: (p) => nodePath.basename(p)` (fs-adapter.ts:455). The extension
argument Node's `path.basename(p, ext)` takes is dropped, so a caller that
passes one gets the extension back with no error at runtime:

    getPath().basename("app/models/story.ts", ".ts")  // "story.ts"
    File.basename("app/models/story.ts", ".ts")        // "story" (Ruby's, correct)

## Found by

trailmap#112: test/config/autoloaded-constants.test.ts called
`getPath().basename(file, ".ts")` and got every name with `.ts` on it; it now
strips the extension by hand.

## Expected

The adapter's `basename` takes the optional `ext` and passes it through (or
the type rejects a second argument so the call fails to compile). A test pins
`getPath().basename("a/b.ts", ".ts") === "b"`.
