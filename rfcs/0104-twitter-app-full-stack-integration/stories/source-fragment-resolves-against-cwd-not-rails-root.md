---
title: "ExceptionWrapper#source_fragment resolves against Dir.pwd instead of Rails.root"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ExceptionWrapper#source_fragment` is
`vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:330-337`:

```ruby
def source_fragment(path, line)
  return unless Rails.respond_to?(:root) && Rails.root
  full_path = Rails.root.join(path)
  if File.exist?(full_path)
    File.open(full_path, "r") do |file|
      start = [line - 3, 0].max
      lines = file.each_line.drop(start).take(6)
      Hash[*(start + 1..(start + lines.count)).zip(lines).flatten]
    end
  end
end
```

trails
(`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:388-397`)
resolves the relative path against the WORKING DIRECTORY — `File.expandPath(path)`,
whose default `dirString` is `Dir.pwd` — rather than against the application
root, and it has no `Rails.root` guard at all, so a process whose cwd is not the
app root reads the wrong file or none. Pre-existing; surfaced while flipping
this body onto `File` in #7455 (the prior spelling was
`getPath().resolve(getFs().cwd(), path)`, the same cwd base).

Depends on `trails-root-app-relative-path-resolution`, which introduces
`Trails.root`.

## Acceptance criteria

- `sourceFragment` returns early unless the application root is available —
  Rails' `return unless Rails.respond_to?(:root) && Rails.root`.
- The path resolves against that root, not `Dir.pwd`.
- The read stays `File.exist?`-guarded and keeps the existing
  `extractSourceFragmentLines` window.
