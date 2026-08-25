---
title: "converge-rack-multipart-collector-mimepart-hierarchy"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6694
claim: "2026-08-18T12:56:45Z"
assignee: "converge-rack-multipart-collector-mimepart-hierarchy"
blocked-by: null
closed-reason: null
---

## Context

Rack's multipart `Collector` builds each part through a Struct hierarchy:
`MimePart = Struct.new(:body, :head, :filename, :content_type, :name)` with
`BufferPart` and `TempfilePart` subclasses (`vendor/rack/lib/rack/multipart/parser.rb:108-137`),
and `on_mime_head` picks between them —

```ruby
if filename
  body = @tempfile.call(filename, content_type)
  ...
  klass = TempfilePart
else
  body = String.new
  klass = BufferPart
end
@mime_parts[mime_index] = klass.new(body, head, filename, content_type, name)
```

(`parser.rb:153-165`).

trails collapses all three classes into one `Part` and constructs it up-front
with an empty body, then mutates it (`packages/rack/src/multipart/parser.ts:190-206`),
so the Ruby `String.new` (no arguments) has no counterpart and the single TS
`new Part("", head, filename, ct, name)` pairs against it. That is the
`on_mime_head -> new` `kind: "args"` row (and the sibling `normalize_filename`
/ `result` / `handle_mime_head` `new` call-set rows) in
`scripts/api-compare/call-mismatches-exclude/rack/multipart/parser.json`.

The port also spells the locals abbreviated (`mi`, `ct`, `tf`, `col`, `sb`,
`d`, `fn`) where Rails writes them out, which is what the `naming` rows on this
file report (`report-call-args`).

Surfaced by `converge-remaining-call-arg-shape-rows-activesupport-rack-i18n`.

## Acceptance criteria

- [ ] `Collector` ports `MimePart` / `BufferPart` / `TempfilePart` and
      `on_mime_head` branches as `parser.rb:153-165` branches, `String.new`
      included.
- [ ] Locals in this file carry the Rails identifiers (`mimeIndex`, `contentType`,
      `tempfile`, `collector`, `filename`, `delta`).
- [ ] The rows the convergence retires are DELETED from the exclude shard by
      hand (only-shrink, no reseed).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
