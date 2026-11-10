---
title: "Port encoding_spec.rb, round_tripping_spec.rb and the encodings / quoted-printable / unstructured-field fold remainders"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Unported: `spec/mail/encoding_spec.rb` (28), `spec/mail/round_tripping_spec.rb`
(4). Missing from ported files: `encodings_spec.rb` "should not fold a long
string that has no spaces" (:286), "should round trip a complex string
properly" (:300), "…(koi-8)" (:318), "should handle a very long string
efficiently" (:530); `encodings/quoted_printable_spec.rb` the six
`=0D` / `=0A` line-break cases (:52, :57);
`fields/unstructured_field_spec.rb` the 997/998/999-character fold cases
(:127-140). All paths under `vendor/mail/2.8.1/spec/mail/`.

## Acceptance criteria

- [ ] All listed specs are ported by name; koi-8 and other non-UTF-8 arms follow
      CLAUDE.md § "A String has no encoding tag either" (UTF-8 arm ported, an
      `str.encoding` assertion dropped with an assertion receipt).
