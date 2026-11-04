---
title: "rack: Builder.new_from_string resolves top-level constants (TOPLEVEL_BINDING)"
status: done
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: trails#9707
claim: "2026-11-04T12:08:16Z"
assignee: "rack-builder-script-resolves-toplevel-constants"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Builder.new_from_string` (rack `lib/rack/builder.rb`, `new_from_string`) evals the builder script in `TOPLEVEL_BINDING`, so a `-b` line or a `config.ru` can name any top-level constant: `use Rack::ContentLength` (rackup `test/spec_server.rb:294`). trails' `Builder.newFromString` (`packages/rack/src/builder.ts:60-86`) runs the script through an indirect `(0, eval)` that sees only `builder`. `Rack` is seated on ruby-compat's `TopLevel`, not on `globalThis`, so `builder.use(Rack.ContentLength)` raises "Rack is not defined". The port of `support -b option to specify inline rackup config` (`packages/rackup/src/server.test.ts`, trails#9693) seats `globalThis.Rack` for the duration of the test to get around this.

## Acceptance criteria

- [ ] A builder script evaluated by `newFromString` / `parseFile` resolves top-level constants through `TopLevel` (for example by passing `TopLevel`'s constants into the evaluated function's scope), so `builder.use(Rack.ContentLength)` works with no global seat.
- [ ] The `globalThis.Rack` seat in `packages/rackup/src/server.test.ts`'s `-b` test is removed and the test still passes.
