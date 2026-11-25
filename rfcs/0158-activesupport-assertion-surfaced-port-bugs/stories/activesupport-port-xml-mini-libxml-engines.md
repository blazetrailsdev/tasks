---
title: "activesupport-port-xml-mini-libxml-engines"
status: claimed
updated: 2026-11-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - port-libxml-ruby-for-xml-mini-libxml-engines
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-25T12:29:39Z"
assignee: "activesupport-port-evented-file-update-checker"
blocked-by: null
closed-reason: null
---

# activesupport: port XmlMini LibXML and LibXMLSAX engines

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini/libxml.rb and xml_mini/libxmlsax.rb` (163 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api` and `libxml_engine_test.rb / libxmlsax_engine_test.rb` from `parity:test`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-xml-mini-libxml-engines`.

## Acceptance criteria

- [ ] Port `xml_mini/libxml.rb and xml_mini/libxmlsax.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Port `libxml_engine_test.rb / libxmlsax_engine_test.rb` under the Rails test names.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
