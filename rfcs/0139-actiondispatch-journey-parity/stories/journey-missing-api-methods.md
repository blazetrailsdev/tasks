---
title: "Port Journey's four missing methods"
status: draft
updated: 2026-09-07
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiondispatch` reports 222/226 for `journey/**`.
Four methods are missing, and each is a private or nested-class member that the
trails port folded away rather than mirrored.

**`UriEncoder#escape` and `UriEncoder#percent_encode`**
(`vendor/rails/actionpack/lib/action_dispatch/journey/router/utils.rb:70-76`).
Rails' `UriEncoder` is a class with three public `escape_*` methods delegating to
a private `escape(component, pattern)`, which calls `percent_encode(unsafe)`.
trails
(`packages/actionpack/src/action-dispatch/journey/router/utils.ts:25`) has a
module-level `escapeWith(component, pattern)` and no `percent_encode` at all.
CLAUDE.md: if Rails extracts a private helper, extract it, with the Rails name —
so this is `escape`, not `escapeWith`, and `percentEncode` exists.

**`VerbMatchers::Unknown#call`** (`journey/route.rb:33`) —
`def call(request); @verb == request.request_method; end`.

**`Scanner#peek_byte`** (`journey/scanner.rb:20-25`) — Rails subclasses
`StringScanner` and defines `peek_byte` only when the C extension lacks it,
reading `string.getbyte(pos)`. `Scanner#scan` calls it at `scanner.rb:56`.

Caveat: it lands on `ActionDispatch::Journey::Scanner::Scanner`, the nested
class that shares its last segment with its parent. `build-rails-file-structure-manifest.ts`
DROPS that file's member-order bucket for exactly that reason — the only such
collision repo-wide — so `rails-file-structure-method-order` will not enforce
where the new member sits. Place it as Rails does anyway; the missing gate is
tracked by `journey-scanner-last-segment-collision-drops-order` (RFC 0025).

## Acceptance criteria

- All four methods exist at the Rails names, in the Rails files, with Rails'
  parameter names and bodies.
- `escapeWith` is gone; its call sites read `escape`. This is a rename of
  invented surface to the Rails name, not a new abstraction.
- `pnpm parity:api --package actiondispatch` reports every `journey/*.rb` row at
  100%, and arity / param-name / option-key / literal mismatches stay at 0.
- `pnpm parity:api:extra --package actiondispatch` still lists no `journey/`
  file — these are Rails-named members, so they add no extra surface.
- `pnpm lint --fix` for `rails-private-jsdoc`: `escape` and `percent_encode` are
  private on their Rails host and need `@internal`.
