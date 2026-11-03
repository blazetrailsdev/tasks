---
title: "Call-args gate normalizes Ruby file extensions"
status: done
updated: 2026-11-03
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9668
claim: "2026-11-03T14:11:44Z"
assignee: "extract-ruby-api-records-class-new-constants"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:calls:args` flags `template "routes.rb"` and `remove_file "app/views/layouts/application.html.erb"` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:490-499`) against the `.ts` / `.tse` spellings, so `packages/trailties/src/generators/rails/app/app-generator.ts` carries `@missingRailsArgs ... PERMANENT` tags that differ only by extension. No section of CLAUDE.md ratifies them.

## Acceptance criteria

- The args gate normalizes `.rb` to `.ts` and `.erb` to `.tse` in string arguments, and the extension-only tags are deleted.
