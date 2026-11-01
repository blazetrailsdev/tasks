---
title: "file-utils-output-reads-includer-ivars"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Ruby ivar mechanics with no consumer: the only reader outside file-utils.ts is packages/rake/src/file-utils-ext.trails.test.ts, which sets the FileUtils statics that fuOutputMessage already reads. No includer sets these fields on origin/main."
---

## Context

`fu_output_message` reads `@fileutils_output` and `@fileutils_label` off self (`vendor/ruby/v3.3.11/lib/fileutils.rb:2496-2503`), so an includer's ivars steer verbose output. The port's `fuOutputMessage` (`packages/ruby-compat/src/file-utils.ts`) reads the `FileUtils` statics, so the instance forms cannot, and the `FileUtils` interface omits both fields.

## Acceptance criteria

- An instance form called on an includer reads `fileutilsOutput` and `fileutilsLabel` off that receiver.
- The fields return to the `FileUtils` interface.
