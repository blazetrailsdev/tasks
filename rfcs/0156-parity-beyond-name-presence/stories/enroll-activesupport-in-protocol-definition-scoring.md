---
title: "enroll-activesupport-in-protocol-definition-scoring"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
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
closed-reason: null
---

## Context

`PROTOCOL_DEFINITION_NAMES` (`scripts/parity/conventions.ts`) — `inspect`, `pretty_print`, `dup`, `initialize_copy`, `initialize_dup`, `encode_with`, `init_with`, `to_a`, `to_h`, `to_hash` — are scored per definition only in packages listed in `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` (only-grow, RFC 0156, story `unskip-ported-protocol-names-per-definition`). `activesupport` is not enrolled: enrolling it today would add the rows and gate failures below, measured by adding `"activesupport"` to the set and running `pnpm parity:api --calls` plus every `parity:api:*` gate on `6d3bbba411`.

Newly missing rows (reported, never baselined):

- `broadcast_logger.rb` `BroadcastLogger#initialize_copy`
- `cache/null_store.rb` `Cache::NullStore#inspect`
- `callbacks.rb` `Callbacks::CallbackChain#initialize_copy`
- `core_ext/date_time/conversions.rb` `DateTime#inspect`
- `core_ext/string/output_safety.rb` `SafeBuffer#encode_with`
- `duration.rb` `Duration#encode_with`, `#init_with`
- `inflector/inflections.rb` `Inflector::Inflections#initialize_dup`
- `message_encryptor.rb` `MessageEncryptor#inspect`
- `message_verifier.rb` `MessageVerifier#inspect`
- `ordered_hash.rb` `OrderedHash#encode_with`
- `ordered_options.rb` `InheritableOptions#pretty_print`
- `test_case.rb` `TestCase#inspect`
- `time_with_zone.rb` `TimeWithZone#encode_with`, `#init_with`
- `values/time_zone.rb` `TimeZone#encode_with`, `#init_with`
- `xml_mini/nokogiri.rb` `XmlMini_Nokogiri::Conversions::Document#to_hash`

Gate failures with the package enrolled:

- `parity:api:calls`: `ordered-options.ts` `to_h` omits `merge`
- `parity:api:calls`: `time-with-zone.ts` `inspect` omits `strftime`

## Acceptance criteria

- Each gate failure above is converged in the TS body (make the call Rails makes, rename to the Rails identifier) — no baseline row, no raised mark.
- `"activesupport"` is added to `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` and every `parity:api:*` gate is green.
- The newly missing rows stay reported as missing; porting them is not required to enroll.
