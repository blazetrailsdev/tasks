---
title: "Generator generator template emits import.meta.dirname for __dir__"
status: draft
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10822 moved every trailties generator's `__dir__` onto `import.meta.dirname` (Rails' `__dir__`, `vendor/rails/v8.0.5.2/railties/lib/rails/generators/base.rb` `base_root`), so a bundle's `import.meta.dirname` rewrite covers them. The generator generator's template still emits the old form: `packages/trailties/lib/generators/trails/generator/templates/%file_name%-generator.ts.tt:4` writes `const __dir__ = File.dirname(decodeURIComponent(new URL(import.meta.url).pathname));`. Rails' template (`vendor/rails/v8.0.5.2/railties/lib/rails/generators/rails/generator/templates/%file_name%_generator.rb.tt`) writes `source_root File.expand_path("templates", __dir__)`.

## Acceptance criteria

- The template emits `const __dir__ = import.meta.dirname;` and drops the now-unused `File` import if nothing else needs it.
- The generator-generator test's expected output is updated to match.
