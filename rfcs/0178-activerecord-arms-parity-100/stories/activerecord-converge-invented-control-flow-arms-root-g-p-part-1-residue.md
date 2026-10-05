---
title: "activerecord: converge the invented branches left in root-g-p part 1 (inheritance, log-subscriber, migration)"
status: draft
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-1`, which converged 20 of its 37
rows. These are the rows left in `pnpm parity:api:arms:report --package=activerecord --direction=invented`,
each with the blocker found while reading it:

- `inheritance.ts#discriminateClassForRecord` / `#usingSingleTableInheritance` — `+if` each — `inheritance.rb:297-307`. Rails reads `record[inheritance_column]`; the port branches `record instanceof IndexedRow ? record.get(col) : record[col]` because `instantiate` hands it either a plain object or an `IndexedRow` (`result.ts:10`). Needs one `[]` read both answer.
- `inheritance.ts#computeType` — `+if` — `inheritance.rb:258-282`. `if (!hasOwn(klass, "_typeCandidatesCache")) klass._typeCandidatesCache = new Map()` is the deferral of `inherited`'s `instance_variable_set(:@_type_candidates_cache, …)` (`inheritance.rb:288-292`; CLAUDE.md § "`inherited` is deferred to own-property memo guards"). Either seat it where `inherited` is deferred, or teach `extractSkeleton` (`scripts/api-compare/extract-ts-api.ts`, beside `isOwnIvarRead`) that an own-property init is no arm, with a unit test.
- `log-subscriber.ts#debug` — `+if +if` — `log_subscriber.rb:124-130` is `return unless super; log_query_source if ActiveRecord.verbose_query_logs`. The port has a free `debug(subscriber, message)` plus a `debugSql` method because `ActiveSupport::LogSubscriber#debug` is spelled `_debug` in `activesupport/src/log-subscriber.ts`.
- `log-subscriber.ts#querySourceLocation` — `+loop` — `log_subscriber.rb:139-145` iterates `Thread.each_caller_location`, which has no ruby-compat port; the port loops over `callerLocations()`.
- `migration.ts#revert` — `+if +if` — `migration.rb:883-898`. The block is recovered from the splat by a hand-rolled `typeof last === "function" && !(last.prototype instanceof Migration)` test instead of the `rbBlockGivenP(args[args.length - 1]) ? args.pop() : undefined` capture the extractor already folds.
- `migration.ts#reversible` — `+if +loop` — `migration.rb:954-957`. `if (!fn) return` and the `for (const f of helper[toRun]) await f()` drain of `ReversibleBlockHelper`.
- `migration.ts#copy` — `-loop +throw +if` — `migration.rb:1079-1125`. Invented scope-format `ArgumentError`, an `File.isExist(sourcePath)` skip, and the magic-comment handling is a regex `exec` where Rails loops `source.sub!(/\A(?:#.*\b(?:en)?coding:\s*\S+|#\s*frozen_string_literal:\s*(?:true|false)).*\n/, "")`.
- `migration.ts#loadMigration` — `-try -rescue +if +throw` — `migration.rb:1196-1200`. No `Object.send(:remove_const, name) rescue nil`; `name.constantize` is an open-coded `typeof klass !== "function"` + `NameError`.
- `migration.ts#migrationsStatus` — `+if +if` — `migration.rb:1339-1359`. The `sort_by { |_, version, _| version.to_i }` is a hand-written comparator with two ternaries.
- `migration.ts#migrationFiles` — `+loop +if +if` — `migration.rb:1368-1371` is `Dir[*paths.flat_map { |path| "#{path}/**/[0-9]*_*.rb" }]`; the port adds a `.ts`-over-`.js` dedupe by basename.
- `migration.ts#parseMigrationFilename` — `+if` — `migration.rb:1373-1375` is `File.basename(filename).scan(Migration::MigrationFilenameRegexp).first`; the port re-declares the regexp inline and guards the match.

## Acceptance criteria

- [ ] Every real invented guard above is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` with a unit test, and its effect on other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 rows for these methods.
