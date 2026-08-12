---
title: "port-xml-mini-backend-and-parsing-half"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6441
claim: "2026-08-12T22:36:49Z"
assignee: "port-xml-mini-backend-and-parsing-half"
blocked-by: null
closed-reason: null
---

## Context

Triaged in the `triage-partially-ported-out-of-closure-activesupport-residue`
PR. `packages/activesupport/src/xml-mini.ts` ports only the SERIALIZE half of
`xml_mini.rb` (`rename_key`, `to_tag`, the builders). The whole backend and
parse half is unported — 15 members:

- `parse` (xml_mini.rb:78), `backend` / `backend=` (xml_mini.rb:87-96),
  `with_backend` (xml_mini.rb:98-104), `current_thread_backend` /
  `current_thread_backend=` (xml_mini.rb:194-200) and
  `cast_backend_name_to_module` (xml_mini.rb:203-209) — the pluggable-backend
  machinery (`XmlMini_REXML`, `XmlMini_Nokogiri`, …) plus its
  IsolatedExecutionState-scoped override.
- `_dasherize` (xml_mini.rb:180), `_parse_binary` (xml_mini.rb:184),
  `_parse_file` (xml_mini.rb:188), `_parse_hex_binary` (xml_mini.rb:174) — the
  PARSING typecast helpers (`PARSING` hash), distinct from the serializing ones
  already ported.
- `XmlMini::FileLike#original_filename`, `#original_filename=`,
  `#content_type`, `#content_type=` (xml_mini.rb:44-50) — the attr_accessor
  module `_parse_file` extends onto the StringIO it returns.

`packages/activesupport/src/xml-mini/nokogirisax.ts` already exports a `parse`,
so the backend registry has one real backend to dispatch to.

## Acceptance criteria

- The backend accessor, `withBackend`, `currentThreadBackend` and
  `castBackendNameToModule` land in xml-mini.ts with the Rails bodies, and
  `parse` dispatches through the backend.
- The four `_parse*` PARSING helpers and `FileLike` land at the Rails names.
- `pnpm parity:api` delta non-negative.
