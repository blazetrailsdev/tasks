---
title: "actionpack: new-base/render-file.test.ts builds its Pathname with Pathname#join, as render_file_test.rb:14 does"
status: ready
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RenderFile::BasicController#pathname`
(`vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_file_test.rb:13-15`) is

```ruby
render file: Pathname.new(__dir__).join(*%w[.. .. fixtures test dot.directory render_file_with_ivar.erb])
```

The port in `packages/actionpack/src/action-controller/controller/new-base/render-file.test.ts`
(trails#8803) builds the same path as `new Pathname(File.join(import.meta.dirname, ...))`, because
ruby-compat's `Pathname` (`packages/ruby-compat/src/pathname.ts`) has no `join`
(`vendor/ruby/v3.3.11/ext/pathname/lib/pathname.rb:416-427`).
`ruby-compat-pathname-join-and-file-join-to-path` ports `Pathname#join`; its acceptance criteria
name only `LoadAllFixturesWithPathnameTest`, so this call site would be left behind.

## Acceptance criteria

- [ ] `pathname()` in `render-file.test.ts` reads
      `new Pathname(import.meta.dirname).join(...)`, as Rails' body does, with no `File.join`.
- [ ] "rendering a Pathname" still passes.
