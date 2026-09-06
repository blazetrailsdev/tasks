---
title: "Declare MULTIPART_BOUNDARY on Multipart, not Multipart::Generator"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack defines the constant on the `Multipart` module itself:

```ruby
module Rack
  module Multipart
    MULTIPART_BOUNDARY = "AaB03x"    # multipart.rb:16
```

`Multipart::Generator` then resolves it lexically from that enclosing
module (`multipart/generator.rb:33,81,91`) — it does not own it.

trails inverts the ownership: the constant is declared in
`packages/rack/src/multipart/generator.ts:5` and `multipart.ts` has none,
so `Rack::Multipart::MULTIPART_BOUNDARY` has no counterpart at the file
`parity:api` maps to `multipart.rb`. Importers reach through the generator
for it — `packages/rack/src/mock-request.ts:25` imports it from
`./multipart/generator.js` where Ruby's `mock_request.rb` names
`Multipart::MULTIPART_BOUNDARY`.

`parity:api:moves` reports this class of cross-file relocation but does not
gate it, and `rails-file-structure-method-order` orders members within one
file, so nothing catches it today.

Unrelated and out of scope: `packages/rack/src/files.ts:8` declares its own
`MULTIPART_BOUNDARY` for `multipart/byteranges`, which mirrors
`Rack::Files`' own local constant — leave it alone.

Surfaced in #7572, which ported `parse_multipart` into `multipart.ts` and
found the sibling constant missing from the file that should own it.

## Converged shape

`MULTIPART_BOUNDARY` is declared in `packages/rack/src/multipart.ts`, as
`multipart.rb:16` does. `generator.ts` imports it from there, and so do
`mock-request.ts` and any other reader.

Watch the import direction: `multipart.ts` already imports `Generator`
(for `build_multipart`, `multipart.rb:68-70`), so a plain
`generator.ts -> multipart.ts` import closes a cycle. A bare string
constant has no runtime dependency, so the fix is a leaf module both can
import, not a slot — see CLAUDE.md's "Call-time constant resolution"
section for when a slot IS warranted, and note this is not that case.

## Acceptance criteria

- [ ] `MULTIPART_BOUNDARY` is declared in `multipart.ts` per `multipart.rb:16`.
- [ ] `generator.ts` and `mock-request.ts` read it from there; no duplicate
      declaration survives outside `files.ts`.
- [ ] No import cycle introduced — verify with a plain-node import of the
      built `dist/**.js` modules as entry modules, not a vitest run.
- [ ] `pnpm parity:api --package rack` deltas non-negative;
      `pnpm parity:api:extra:gate` OK.
