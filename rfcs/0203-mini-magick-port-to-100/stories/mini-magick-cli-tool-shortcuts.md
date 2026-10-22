---
title: "Port mini_magick's CLI tool shortcuts (MiniMagick.convert, .identify, …)"
status: ready
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-runtime
packages: ["mini-magick"]
deps: ["mini-magick-land-on-main"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mini_magick/v5.2.0/lib/mini_magick.rb:25-30` defines one module function
per CLI tool:

```ruby
%w[animate compare composite conjure convert display identify import mogrify montage stream].each do |tool|
  define_singleton_method(tool) do |**options, &block|
    name = imagemagick7? && tool == "convert" ? "magick" : tool
    MiniMagick::Tool.new(name, **options, &block)
  end
end
```

The generator does not port a `define_singleton_method` loop, so
`MiniMagick.identify` is undefined and `image.test.ts` fails at load
(`MiniMagick.identify is not a function` from `cliVersion`,
`mini_magick.rb:36-39`). Most of `image.rb` and `image/info.rb` reach the CLI
through these (`MiniMagick.identify`, `MiniMagick.convert`, `MiniMagick.mogrify`).

## Acceptance criteria

- `MiniMagick.<tool>(options, block)` exists for each of the eleven tools, seated
  on the `MiniMagick` namespace as its other module functions are, with the
  IM7 `convert` → `magick` arm.
- `cli_version` (`mini_magick.rb:36-39`) answers the version with
  `String#[]` on its Regexp (`output.match(re)?.[0] ?? null`), not an index.
- `image.test.ts` loads.
