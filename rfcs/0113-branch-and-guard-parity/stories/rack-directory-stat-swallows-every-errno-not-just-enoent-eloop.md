---
title: "Rack::Directory#stat swallows every errno, not just ENOENT and ELOOP"
status: in-progress
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 8
pr: 7571
claim: "2026-09-06T18:18:16Z"
assignee: "schema-dumpers-take-columns-not-columninfo"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7444 (RFC 0135's rack flip), which repointed the body at
`File.stat` but left the rescue as it found it.

`Rack::Directory#stat` rescues exactly two errno classes
(`vendor/rack/lib/rack/directory.rb:162-167`):

```ruby
# File::Stat for the given path, but return nil for missing/bad entries.
def stat(path)
  ::File.stat(path)
rescue Errno::ENOENT, Errno::ELOOP
  return nil
end
```

`packages/rack/src/directory.ts` catches everything:

```ts
stat(path: string): FsStatResult | null {
  try {
    return File.stat(path);
  } catch {
    return null;
  }
}
```

The comment above the Ruby says "missing/bad entries", and the two classes are
that: a path that is not there, and a symlink loop. Every other failure —
`EACCES` on a directory the process cannot traverse, `ENAMETOOLONG`, `EIO` —
is a real error Rails lets propagate out of `list_directory`, and trails
silently renders the entry as absent instead. A directory listing that quietly
omits entries the server could not stat is the failure mode; Rails would 500.

The same shape sits one file over in `Rack::Files`, which rescues
`SystemCallError` around its availability check (`files.rb:51-59`) — a wider
class, deliberately, and with a `:nocov:` note explaining why. That one is
already correct in the port after #7444 (`File.isFile` / `File.isReadable` each
swallow their own stat failure). Only `Directory#stat` is over-broad.

The blocker is that trails has no errno classification at this seat: a caught
value is whatever the fs backend threw, and `FsAdapter` does not promise an
`Errno::` shape. Node's errors carry `.code` (`"ENOENT"`, `"ELOOP"`), so the
narrow check is available on the real backend; what the story has to settle is
whether that reads off `.code` directly or goes through a `SystemCallError`
port that other rescue sites can share.

## Converged shape

- `Directory#stat` re-throws anything that is not the ENOENT/ELOOP pair, so
  `directory.rb:165`'s rescue list is the one in the port.
- The classification is not open-coded per call site if a second site wants it;
  prefer a shared way to ask "is this errno X" over a `.code` string compare
  repeated in two files.
- A test stats a path whose failure is neither ENOENT nor ELOOP and asserts it
  propagates rather than rendering as a missing entry. That test fails on
  today's bare `catch`.

## Acceptance criteria

- `Directory#stat` answers `null` for ENOENT and ELOOP and re-raises otherwise,
  mirroring `directory.rb:162-167`.
- A regression test covers the re-raise arm and fails against the bare `catch`.
- `pnpm parity:api:calls` shows no new rows.
