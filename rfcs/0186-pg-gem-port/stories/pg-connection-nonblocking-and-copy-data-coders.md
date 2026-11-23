---
title: "pg-connection-nonblocking-and-copy-data-coders"
status: in-progress
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10675
claim: "2026-11-23T22:39:47Z"
assignee: "pg-close-prepared-sync-variants-and-pg17-gate"
blocked-by: null
closed-reason: null
---

# pg: port isnonblocking/setnonblocking and copy-data coders for Connection#inspect

## Context

`Connection#inspect` (`vendor/pg/v1.6.2/lib/pg/connection.rb:100-119`) reports `nonblocking`, `encoder_for_put_copy_data` and `decoder_for_get_copy_data`; none is ported, so `packages/pg/lib/connection.ts` `inspect` carries `@missingRailsCall isnonblocking`. `connect_start` (for "should tell about connection status") and `PG::TypeMapByColumn` (for the type-map examples) are unported too.

## Acceptance criteria

- `isnonblocking` / `setnonblocking`, `encoderForPutCopyData` / `decoderForGetCopyData` ported and read by `inspect`; drop the receipt.
- Port the remaining `#inspect` examples (`connection_spec.rb:71-114`) the engine can run.
