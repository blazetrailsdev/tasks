---
title: "enroll-activerecord-in-protocol-definition-scoring"
status: draft
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

`PROTOCOL_DEFINITION_NAMES` (`scripts/parity/conventions.ts`) — `inspect`, `pretty_print`, `dup`, `initialize_copy`, `initialize_dup`, `encode_with`, `init_with`, `to_a`, `to_h`, `to_hash` — are scored per definition only in packages listed in `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` (only-grow, RFC 0156, story `unskip-ported-protocol-names-per-definition`). `activerecord` is not enrolled: enrolling it today would add the rows and gate failures below, measured by adding `"activerecord"` to the set and running `pnpm parity:api --calls` plus every `parity:api:*` gate on `6d3bbba411`.

Newly missing rows (reported, never baselined):

- `base.rb` `ActiveRecord::Base#encode_with`, `#init_with`
- `core.rb` `ActiveRecord::Core#encode_with`, `#init_with`
- `encryption/cipher/aes256_gcm.rb` `Aes256Gcm#inspect`
- `relation.rb` `ActiveRecord::Relation#encode_with`
- `relation/delegation.rb` `ActiveRecord::Delegation#encode_with`
- `result.rb` `ActiveRecord::Result#initialize_copy`
- `result.rb` `ActiveRecord::Result::IndexedRow#to_h`
- `type/adapter_specific_registry.rb` `AdapterSpecificRegistry#initialize_copy`
- `type/serialized.rb` `ActiveRecord::Type::Serialized#inspect`

Gate failures with the package enrolled:

- `parity:api:calls`: `core.ts` `inspect` omits `connected?` and `table_exists?`
- `parity:api:calls`: `relation.ts` `inspect` omits `annotate`
- `parity:api:params`: `relation.rb` +1 (mark 0)

## Acceptance criteria

- Each gate failure above is converged in the TS body (make the call Rails makes, rename to the Rails identifier) — no baseline row, no raised mark.
- `"activerecord"` is added to `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` and every `parity:api:*` gate is green.
- The newly missing rows stay reported as missing; porting them is not required to enroll.
