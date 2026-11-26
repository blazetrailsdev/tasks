---
title: "text-helper-inert-attribute-markup"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T01:59:56Z"
assignee: "activesupport-api-remainder-reaches-100"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/actionview/test/template/text_helper_test.rb:633,639`
("highlight keeps markup inside attribute values inert" and "simple format keeps markup
inside attribute values inert") are unported in `packages/actionview/test/template/text-helper.test.ts`.
They run under `Rails::HTML5::SafeListSanitizer`.

The vendored Rails 8.0.5.2 actionview fails both tests itself, with nokogiri 1.19.4 and
1.18.3 and rails-html-sanitizer 1.7.1, checked on 2026-11-25. The sanitizer serializes
`class="<img src=x onerror=alert(1)>"` with a raw `<`. `highlight`'s
`text.scan(/<[^>]*|[^<]+/)` (`helpers/text_helper.rb:195`) then splits inside the attribute,
and `simple_format`'s paragraph split does the same. trails fails both tests the same way.

## Acceptance criteria

- [ ] Find which upstream release (gumbo serializer, nokogiri, rails-html-sanitizer) escapes
      `<` / `>` in attribute values. Converge html-sanitizer's or nokogiri's serializer on it,
      and port both tests passing.
- [ ] Or, if no upstream release escapes them, get an operator ruling and receipt the skips
      under a `PERMANENT-SKIP:` line that cites it.
