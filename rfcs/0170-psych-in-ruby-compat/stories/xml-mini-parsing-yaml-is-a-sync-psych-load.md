---
title: "XmlMini PARSING['yaml'] is a synchronous YAML.load rescue yaml"
status: draft
updated: 2026-10-14
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::XmlMini::PARSING["yaml"]` is a synchronous
`Proc.new { |yaml| YAML.load(yaml) rescue yaml }`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini.rb:83`).

`packages/activesupport/src/xml-mini.ts` (PARSING `yaml`, ~line 121) is still `async`.
It `await import`s `@blazetrails/ruby-compat/psych-adapter` and calls the backend's raw `parse`
instead of `Psych.load`, and it carries an invented `typeof yaml !== "string"` throw. That shape was
forced by the adapter's old top-level await. trails#8904 removed the top-level await (the backend
resolves synchronously on first use) and ported `Psych.load` (`psych.rb:368`).

## Acceptance criteria

- [ ] `PARSING.yaml` is synchronous: `(yaml) => { try { return Psych.load(yaml); } catch { return yaml; } }`
      with a static import of `Psych`, matching `xml_mini.rb:83`.
- [ ] Callers that await the PARSING entry (`Hash.from_xml` / `typecast_xml_value` paths) are
      converged to the sync call. The xml-mini tests pass.
