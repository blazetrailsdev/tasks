---
title: "Port Tool#method_missing and Image#method_missing as Proxies"
status: in-progress
updated: 2026-10-27
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-runtime
packages: ["mini-magick"]
deps: ["mini-magick-land-on-main"]
deps-rfc: []
est-loc: 220
priority: null
pr: trails#9369
claim: "2026-10-27T14:02:16Z"
assignee: "mini-magick-cli-tool-shortcuts"
blocked-by: null
---

## Context

Both public mini_magick classes dispatch unknown names through `method_missing`:

- `Tool#method_missing` (`vendor/mini_magick/v5.2.0/lib/mini_magick/tool.rb:257-262`)
  turns `convert.resize("100x100")` into the option `-resize 100x100`
  (`self << "-#{name.to_s.tr('_', '-')}"`, then `merge!(args)`). Every
  `MiniMagick.convert do |convert| … end` block in `image.rb` and the specs uses
  it. There is no `respond_to_missing?`.
- `Image#method_missing` (`image.rb:462-466`) sends any unknown name to
  `mogrify` (`image.resize "20x30!"` in `image_spec.rb:560`), and
  `Image#respond_to_missing?` (`image.rb:471-473`) answers `false`, to keep
  `Array#flatten` off the image.

The generated `Tool` and `Image` define `methodMissing` as a named method, so no
call reaches it.

## Acceptance criteria

- Both classes get rows in CLAUDE.md's table in "Ruby protocol methods with a
  different JS mechanism" (`tool.rb`, `image.rb`), decided as Proxies, and the
  constructor returns the Proxy as `OrderedOptions` does. A name the class does
  not answer reaches `methodMissing` with the Ruby name, except
  `PROTOCOL_PROBES` (`packages/ruby-compat/src/method-missing-proxy.ts`).
- `Image`'s Proxy forwards every name but `PROTOCOL_PROBES` to `mogrify`, and
  its `respondToMissing` answers `false` without gating the Proxy (owner
  ruling, 2026-10-22, recorded in the RFC's Decisions). CLAUDE.md's `image.rb`
  row states the exception to the table's `respond_to_missing?` rule.
- `tool.test.ts`'s `#method_missing` examples and the `image_spec.rb` examples
  that call mogrify options by name pass.
