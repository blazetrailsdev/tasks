---
title: "unported-register-hides-tests-the-port-already-has"
status: draft
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
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

Surfaced by `0126/test-compare-halves-ruby-test-count-at-pairing` (PR TBD),
which fixed the first instance of this and swept for the rest.

An `UNPORTED_FILES` entry carrying `tests:` claims a Rails test is NOT ported,
and `compare.ts:749` takes it at its word: the test is subtracted from
`rubyTestCount` before pairing, so its TS counterpart is never consumed and is
scored `extra (TS only)`. The file then reports `missing: 0` — often a ✓ — while
the aggregate understates the ported population by exactly those tests.

`adapters/postgresql/transaction_nested_test.rb` was the first instance: four
Rails tests, four live ported `it`s, `rubyTestCount: 2 / matched: 2 / extra: 2`.
Retiring its register entry took it to `4/4/0`.

The register excludes **219 Rails tests across 58 files** in total. Cross-checking
each excluded description against the LIVE (non-`it.skip`) tests in the file's
convention TS file leaves **19 entries that name a test the port already has**:

| package | ruby file | test | file `extra` |
| --- | --- | --- | --- |
| activerecord | associations_test.rb | proxy object can be stubbed | 17 |
| activerecord | associations/inverse_associations_test.rb | has many and belongs to should find inverse automatically for model in module | 4 |
| activerecord | adapter_test.rb | active transaction is restored after remote disconnection | 2 |
| activerecord | adapter_test.rb | dirty transaction cannot be restored after remote disconnection | 2 |
| activerecord | reflection_test.rb | automatic inverse suppresses name error for association | 6 |
| activerecord | adapters/postgresql/hstore_test.rb | yaml round trip with store accessors | 1 |
| activerecord | serialized_attribute_test.rb | serialized attribute with class constraint | 19 |
| activerecord | serialized_attribute_test.rb | where by serialized attribute with array | 19 |
| activerecord | serialized_attribute_test.rb | where by serialized attribute with hash | 19 |
| activerecord | serialized_attribute_test.rb | where by serialized attribute with hash in array | 19 |
| activerecord | serialized_attribute_test.rb | serialize attribute via select method when time zone available | 19 |
| activerecord | serialized_attribute_test.rb | serialize attribute can be serialized in an integer column | 19 |
| activerecord | serialized_attribute_test.rb | serialized time attribute | 19 |
| activerecord | connection_pool_test.rb | new connection no query | 6 |
| activerecord | modules_test.rb | compute type can infer class name of sibling inside module | 6 |
| activerecord | adapters/postgresql/transaction_test.rb | raises Deadlocked when a deadlock is encountered | 1 |
| activerecord | disconnected_test.rb | reconnects to execute statements when disconnected | 1 |
| activerecord | prepared_statement_status_test.rb | prepared statement status is thread and instance specific | 1 |
| globalid | verifier_test.rb | generates URL-safe messages | 1 |

Some are certainly real (`serialized_attribute.test.ts` carries a live
`it("serialized time attribute")` at :198 AND an `it.skip` stub for the same
name at :711 — the register describes the stub, the live test is scored extra).
Some may be false positives of the description match: `adapter_test.rb`'s two
entries are `className`-scoped to `AdapterConnectionTest`, and the register's
reasons for those (`remote_disconnect` is PG/MySQL-only in Rails) may still hold
for a differently-gated TS test of the same name.

Each row needs the same judgement the first one got: read the Rails test, read
the live TS test, and either retire the register entry (and its
`unported-files/baseline.json` row — only-shrink, by hand) or rename nothing and
record why the TS test is not that Rails test.

## Acceptance criteria

- [ ] Every row above is resolved: the entry is retired, or the reason states
      why the live TS test of that name is not the Rails test.
- [ ] `convention-comparison.json` shows the freed tests as `matched`, and each
      touched file's `extra` drops by the number freed.
- [ ] The repo-wide guard the sweep prototyped ships: a scripts test asserting
      no `tests:` entry names a live (non-`it.skip`) test in the TS file
      mirroring its Rails file. It is red today, which is why it was held back.
- [ ] Report the aggregate movement of `Overall: NNNNN/NNNNN tests`.
