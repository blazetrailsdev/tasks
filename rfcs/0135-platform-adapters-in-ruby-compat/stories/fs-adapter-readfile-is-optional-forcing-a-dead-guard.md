---
title: "FsAdapter.readFile is optional, forcing a dead guard at every async call site"
status: draft
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FsAdapter`'s async members are declared OPTIONAL
(`packages/activesupport/src/fs-adapter.ts`, shipped as
`node_modules/@blazetrails/activesupport/dist/fs-adapter.d.ts:100-102`):

```ts
    /** Async readFile (utf8). */
    readFile?(path: string, encoding: "utf-8" | "utf8"): Promise<string>;
    readFile?(path: string): Promise<Buffer>;
```

The sync members on the same interface (`readFileSync`, line 24) are not
optional. So an application that wants an async read — which is the correct
choice for request work, and what trailmap's show pages do — cannot just call
it. It must first prove the method exists:

```ts
const fs = await getFsAsync();
if (!fs.readFile) {
  return { markdown: "", error: "the filesystem adapter cannot read files asynchronously" };
}
```

Surfaced building `/rfc/<id>` and `/story/<id>` in trailmap
(`app/models/concerns/document.ts`, blazetrailsdev/trailmap#11), which reads
each record's markdown off disk.

## What is wrong with it

The guard is unreachable with the Node adapter, which is the only adapter any
app registers, so it is a branch that cannot be tested and cannot be covered.
It reads as defensive programming against a case that does not exist, and the
next reader cannot tell whether it is load-bearing.

Rails has no equivalent: `File.read` is always there. An adapter that cannot
read a file asynchronously is not a filesystem adapter, so optionality is
encoding a state the system does not have.

This is the same SHAPE as
[[fsstatresult-uid-and-gid-are-optional-forcing-nullish-coalescing-at-atomic-writes-chown]]
— an optional member forcing defensive code at every call site — filed
separately for the same reason.

## Expected shape

`readFile` (and its async siblings, to the extent they have the same
property) are REQUIRED on `FsAdapter`, so a caller can await them directly and
the dead guard comes out of every consumer.

Note the interaction with [[delete-the-degenerate-fs-async-accessors]]: if
`getFsAsync` is going away, the requiredness question moves to whatever
surface replaces it (`File` / `Dir` per
[[port-file-and-dir-classes-onto-the-fs-backend]]) rather than disappearing.
Whichever surface survives should not make reading a file optional.
