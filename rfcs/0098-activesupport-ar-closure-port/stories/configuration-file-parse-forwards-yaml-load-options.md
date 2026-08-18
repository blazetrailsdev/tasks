---
title: "ConfigurationFile#parse forwards **options to the YAML load"
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6703
claim: "2026-08-18T14:40:54Z"
assignee: "request-forgery-protection-this-typed-mixin"
blocked-by: null
closed-reason: null
---

## Context

`ConfigurationFile.parse` / `#parse`
(`vendor/rails/activesupport/lib/active_support/configuration_file.rb:17-34`)
take `**options` alongside `context:` and forward them to the YAML loader:

```ruby
def self.parse(content_path, **options)
  new(content_path).parse(**options)
end

def parse(context: nil, **options)
  source = @content.include?("<%") ? render(context) : @content

  if source == @content
    YAML.unsafe_load_file(@content_path, **options) || {}
  else
    YAML.unsafe_load(source, **options) || {}
  end
end
```

trails' `parse` (`packages/activesupport/src/configuration-file.ts`) accepts
`{ context }` only and calls `yamlParse(source)` with no second argument, so a
caller passing loader options (Rails' common case is `aliases: true`, which
`Rails::Application::Configuration#database_configuration` relies on) has them
silently dropped.

This predates PR #6613, which ported `render` and restored `parse`'s
`include?("<%")` branch but left the options passthrough alone as out of scope;
it was surfaced in that PR's review.

The open question is the mapping: the `yaml` package's `parse(src, options)`
takes a different option set from Psych's (`aliases:`, `permitted_classes:`,
`freeze:`, `filename:`). The port has to decide which Rails-facing keys are
honoured and which have no analogue, and say so at the call site.

## Acceptance criteria

- [ ] `ConfigurationFile.parse` and `#parse` accept Rails' `**options` alongside
      `context:` and forward them to the YAML load, matching
      configuration_file.rb:17-34.
- [ ] Any Psych option with no `yaml`-package analogue is named and justified at
      the call site, not silently dropped.
- [ ] A test covers a config file parsed with a loader option that changes the
      result (e.g. YAML aliases).
- [ ] `pnpm parity:api:calls` / `:args` clean, no new baseline rows.
