---
title: "Rack::Files: compose HEAD through Rack::Head and stop re-deciding availability in serving"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Files` composes HEAD handling and decides file availability in exactly
one place each; the trails port hand-rolls both, in several.

### 1. HEAD is a `Rack::Head`, not an inline method check

`Files#call` is one line — `@head.call env` (`vendor/rack/lib/rack/files.rb:33-36`)
— where `@head` is `Rack::Head.new(method(:get))`, built in `initialize`
(`files.rb:28`). Rack::Head is what drops the body, "including 4xx error
messages" per the comment at `files.rb:34`.

`packages/rack/src/files.ts` has no `@head` at all. `call` tests
`method === "HEAD"` itself, and `serving` tests it AGAIN at both of its return
sites (`files.ts:117,193,200`) — three hand-written copies of one composition
Rails gets for free. Rails' `serving` never looks at the request method except
for `request.options?` (`files.rb:69`).

### 2. `serving` re-decides availability that `get` already decided

Rails' `get` computes `available` (`::File.file?(path) && ::File.readable?(path)`,
`files.rb:51-59`) and only calls `serving` when it is true (`files.rb:61-63`);
`serving` (`files.rb:68-77`) then goes straight to `::File.mtime(path)` with no
guard. The port re-`statSync`es inside `serving` and carries two invented arms
Rails does not have — `fail(404, "File not found")` for a stat throw and again
for `!stat.isFile()` (`files.ts:159-167`) — with a message that is not even
Rails' (`"File not found: #{path_info}"`).

### 3. `get`'s path handling is bespoke

Rails: `Utils.unescape_path` → `Utils.valid_path?` → `Utils.clean_path_info` →
`::File.join(@root, clean_path_info)` (`files.rb:44-49`). The port uses
`decodeURIComponent`, a local `validPath`, no `cleanPathInfo` at all, and then
an invented `resolve`-and-prefix-compare root-escape guard (`files.ts:136-141`)
that stands in for the traversal-stripping `clean_path_info` would have done.

## Acceptance criteria

- `Files#initialize` builds a `Head` over `get` and `call` is `this.head.call(env)`,
  mirroring `files.rb:28,33-36`; the three inline `method === "HEAD"` tests go.
- `serving` carries no availability guard and no `fail(404)` arm — `get` decides
  availability, as at `files.rb:51-63`.
- `get` routes through the `Utils` trio (`unescapePath`, `validPath`,
  `cleanPathInfo`), and the invented root-prefix compare goes with it.
- `pnpm parity:api:calls` / `:calls:args` gain no row; the rack suite stays green.
