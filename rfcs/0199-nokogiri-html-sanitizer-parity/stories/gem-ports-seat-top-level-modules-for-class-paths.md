---
title: "Seat each gem port's top-level module so class-paths can table it"
status: in-progress
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: ["nokogiri", "html-sanitizer", "date", "image-processing", "tzinfo"]
deps: []
deps-rfc: []
est-loc: 200
priority: 4
pr: trails#9865
claim: "2026-11-08T12:45:20Z"
assignee: "nokogiri-xml-node-children-writer"
blocked-by: null
---

## Context

trails#9825 enrols crass, date, image-processing, loofah, nokogiri, racc, rails-html-sanitizer and tzinfo in `parity:api`, and lists them in `SKIPPED` in `scripts/api-compare/class-paths.ts`. `parity:class-paths --check` resolves every paired path with `constGet`, and none of these gems seats its top-level module yet. With the tables generated, 28 paths raise, for example `Nokogiri::HTML5::Node: uninitialized constant Nokogiri`, `Racc::Parser: uninitialized constant Racc` and `Crass::Tokenizer: uninitialized constant Crass`. fugit already does this with `constSet(TopLevel, "Fugit", Fugit)` in `packages/fugit/lib/namespaces.ts`.

## Acceptance criteria

- [ ] `Nokogiri`, `Racc`, `Crass`, `Loofah`, `Rails::HTML`, `ImageProcessing`, `Date` and `TZInfo` are each seated with `constSet` on `TopLevel`, wherever the package already defines them.
- [ ] `pnpm parity:class-paths` writes a `constants.generated.ts` for each package, and each package entry imports it.
- [ ] The eight keys leave `SKIPPED`, and `pnpm parity:class-paths:check` is green.
