---
title: "The VFS readFileSync swallows a missing path and drops the Bytes overload"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
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

`createVfsFsAdapter`'s `readFileSync`
(`packages/website/src/lib/frontiers/vfs-generator.ts`) reads:

```ts
readFileSync(path: string): string {
  return vfs.read(path)?.content ?? "";
},
```

Two divergences from the `FsAdapter` contract it implements, both of which the
ASYNC `readFile` beside it had and which #7646 fixed there:

1. **A missing path resolves as `""`** rather than failing, so a missing file is
   indistinguishable from an empty one. Rails relies on the read raising:
   `ActiveSupport::ConfigurationFile#initialize` calls `File.read(content_path)`
   at `activesupport/lib/active_support/configuration_file.rb:47` with no
   existence check, and MRI's `File.read` raises `Errno::ENOENT`. The Node
   adapter throws `ENOENT` here; the VFS one does not.
2. **Only the string overload is answered.** `FsAdapter` declares
   `readFileSync(path, encoding): string` AND `readFileSync(path): Bytes`
   (`packages/ruby-compat/src/fs-adapter.ts:47-48`), so an unencoded sync read
   against the VFS hands back a string where the contract promises `Bytes`.

`Bytes` is `Uint8Array & { toString(encoding?: string): string }`
(`fs-adapter.ts:13`) — a DECODING `toString`, as Node's `Buffer` has. #7646
added `toBytes()` in this same file for the async half; the sync half can reuse
it unchanged.

Left out of #7646 deliberately: that PR made `readFile` required, and changing
the sync contract touches every existing VFS caller, so it is its own change.

## Acceptance criteria

- `readFileSync` carries both declared overloads, reusing the existing
  `toBytes()` helper for the unencoded arm.
- A path the VFS does not hold throws an `ENOENT`-shaped error, as the Node
  adapter does and as `File.read` raises.
- Existing VFS callers of `readFileSync` are audited for reliance on the `""`
  return; any that need "absent reads as empty" ask `existsSync` first rather
  than keeping the swallow.
- Tests cover the string arm, the bytes arm (asserting `bytes.toString("utf8")`,
  not `TextDecoder`), and the throw — reaching the installed adapter through
  `VfsMigrationGenerator` + `getFs()`, the way `vfs-generator.test.ts` already
  does rather than exporting the factory.
