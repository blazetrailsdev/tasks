---
title: "divergent-test-data-fidelity-sweep"
status: claimed
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-07-23T11:34:37Z"
assignee: "divergent-test-data-fidelity-sweep"
blocked-by: null
closed-reason: null
---

## Context

Low-priority literal-fidelity sweep: files where trails tests are semantically
equivalent to Rails but run on invented literal data, so `--assertions` flags
value mismatches. No behavior at stake, but per the fidelity convention test
data should mirror Rails. Cluster (~30 entries):

- encryption/\*: null_encryptor, encrypting_only_encryptor,
  read_only_null_encryptor ("Some data" → "hello"), message_test/properties
  ("value 1"/"value 2" → "value"/"1"/"2"), key_generator_test (custom lengths
  10 → 16/32 — verify the length is actually threaded through, Rails asserts
  the CUSTOM length), configurable_test ("named_pirate.catchphrase" →
  "encrypted_post.title" — trails lacks the pirate model; converge or justify),
  encryption_schemes_test ("STEPHEN KING" → "nondet"),
  encryptable_record_test "forced encoding ..." (Rails U+FFFD replacement
  chars → "??" — verify trails' replacement behavior matches; possible real)
  and "type method returns cast type" (Rails ["string","text"] → trails
  ["string","string"] — possible REAL type-reflection divergence, investigate
  first).
- multiparameter_attributes_test.rb (3): date tests assert 2004/6/24 where
  Rails asserts 1952/11/3 and the "old date" test asserts only the year —
  restore Rails' exact multiparameter payloads.
- reflection_test.rb (5): "reflect on association accepts symbols/strings"
  assert :books where Rails uses :departments (Firm reflections); "human name
  for column" ("Author name" → "body_text"); "association primary key uses
  explicit primary key option as first priority" ("id" → "custom_id"); habtm
  reflection naming (benign camelCase — skip).
- quoting data drift: adapters/postgresql/quoting_test.rb "quote integer"
  (Rails asserts the STRING "42"; trails asserts number 42 — possible real:
  quote() should return SQL text) and "quote string" data; sqlite3 quoting
  "quote string" data.
- reaper_test.rb "reaping frequency configuration" (10.01 → 100).

## Acceptance criteria

- Listed tests use Rails' literal inputs/expected values; genuine divergences
  found while restoring (encryption text-type, pg quote-integer, key length)
  get impl fixes or follow-up stories.
- `--assertions` value-mismatch total drops by ~30.
