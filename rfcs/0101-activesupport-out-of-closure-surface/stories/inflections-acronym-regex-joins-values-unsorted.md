---
title: "Inflections#define_acronym_regex_patterns joins acronym values as Rails does (no sort/escape)"
status: draft
updated: 2026-10-26
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `ActiveSupport::Inflector::Inflections#define_acronym_regex_patterns`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/inflections.rb:250-254`)
builds `@acronym_regex = @acronyms.empty? ? /(?=a)b/ : /#{@acronyms.values.join("|")}/`.
The values go in unescaped, in insertion order, and `@acronyms_camelize_regex` /
`@acronyms_underscore_regex` are derived from `@acronym_regex`.

The trails port (`packages/activesupport/src/inflector/inflections.ts:150-160`)
does two things Rails does not. It sorts the acronym values by length
(`.sort((a, b) => b.length - a.length)`) and regexp-escapes each one. It also
writes its own empty-arm camelize/underscore regexes instead of deriving them
from `acronymRegex`.

## Acceptance criteria

- [ ] `defineAcronymRegexPatterns` is `aryJoin([...this.acronyms.values()], "|")`
      with no sort or escape, and the two derived regexes are interpolated from
      `acronymRegex` exactly as at `inflections.rb:252-253`.
- [ ] The inflector tests stay green. Any test that depended on the sort is
      reconciled against `vendor/rails/v8.0.2/activesupport/test/inflector_test.rb`.
