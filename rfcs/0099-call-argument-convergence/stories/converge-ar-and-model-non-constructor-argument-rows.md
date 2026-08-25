---
title: "Converge the last 22 non-constructor argument rows in activerecord, activemodel, i18n and globalid"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6557
claim: "2026-08-15T00:39:10Z"
assignee: "converge-ar-and-model-non-constructor-argument-rows"
blocked-by: null
closed-reason: null
---

# Converge the last 22 non-constructor argument rows in activerecord, activemodel, i18n and globalid

## Context

Measured 2026-08-14 over `scripts/api-compare/call-mismatches-exclude/**`
(`kind: "args"`). RFC 0099 has **89 rows left of the 490 it was chartered on**
(82% burned, 104 done stories). This is the third and last of the three stories
that account for all 89 — the other two are
`converge-constructor-argument-rows` (36) and
`converge-activesupport-non-constructor-argument-rows` (31). **When these three
land the RFC's burndown is complete and it can be evaluated for closure.**

- `activerecord/associations/preloader/through-association.ts` (3): records_by_owner -> loaded?; source_records_by_owner -> reduce; through_records_by_owner -> reduce
- `activerecord/associations/collection-association.ts` (2): ids_writer -> index_by; replace_common_records_in_memory -> replace_on_target
- `i18n/backend/base.ts` (2): load_file -> tr; translate -> nil?
- `activemodel/attribute-registration.ts` (1): reset_default_attributes -> subclasses
- `activemodel/attribute-set.ts` (1): write_cast_value -> with_cast_value
- `activemodel/errors.ts` (1): messages -> to_hash
- `activemodel/secure-password.ts` (1): has_secure_password -> add
- `activemodel/serialization.ts` (1): serializable_attributes -> read_attribute_for_serialization
- `activemodel/validations/length.ts` (1): validate_each -> skip_nil_check?
- `activerecord/associations/association-scope.ts` (1): add_constraints -> last_chain_scope
- `activerecord/associations/join-dependency.ts` (1): build -> build
- `activerecord/associations/nested-error.ts` (1): initialize -> compute_attribute
- `activerecord/connection-adapters/abstract/connection-handler.ts` (1): establish_connection -> resolve_pool_config
- `activerecord/encryption/cipher/aes256-gcm.ts` (1): generate_deterministic_iv -> digest
- `activerecord/inheritance.ts` (1): subclass_from_attributes -> find_sti_class
- `activerecord/tasks/mysql-database-tasks.ts` (1): structure_load -> run_cmd
- `activerecord/type.ts` (1): current_adapter_name -> adapter_name_from
- `globalid/uri/gid.ts` (1): set_path -> set_model_components
  Every row still carries the seeded RFC 0095 reason ("pending per-body
  convergence review"), so none has been reviewed.

Notes on the denser entries:

- `associations/preloader/through-association.ts` (3) — two `-> reduce` rows and
  a `-> loaded?`. Ruby's `inject`/`reduce` with a symbol or a two-arg block does
  not map onto JS `Array#reduce` argument-for-argument; check the settled trails
  idiom before treating the argument list as freely changeable.
- `associations/collection-association.ts` (2) — `replace_on_target` overlaps
  RFC 0075's open target-store work
  (`OO replaceOnTarget: model @replaced_or_added_targets dedup ...`). Coordinate
  rather than converging the argument list into a shape 0075 is about to
  change; if it collides, say so and leave the row with a reviewed reason
  pointing at the 0075 story.
- `i18n/backend/base.ts` (2) — `translate -> nil?` is a Ruby-truthiness
  conversion class (CLAUDE.md: `if x` is false only for `nil`/`false`), so the
  fix is likely a predicate argument, not a signature change.

## Acceptance criteria

- [ ] Each of the 22 rows is deleted (the TS call passes what Rails passes) or
      carries a reviewed, row-specific reason replacing the RFC 0095 seed.
- [ ] The `replace_on_target` row's disposition is coordinated with RFC 0075 and
      stated in the PR body — not silently converged into a shape 0075 changes.
- [ ] `pnpm parity:api:calls:args` green; AR-closure args row count moves down
      from 89 and does not rise.
- [ ] Converged rows deleted by hand from their shard; stale high-water marks
      fixed with `pnpm parity:api:calls:tighten <shard>` — no `--write`, no
      reseed.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] The PR body restates the remaining AR-closure `kind: "args"` count from a
      fresh measurement, so the RFC's exit can be judged from it.
