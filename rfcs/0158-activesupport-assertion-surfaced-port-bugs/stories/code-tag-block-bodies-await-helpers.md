---
title: "code-tag-block-bodies-await-helpers"
status: draft
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

trails#10346 (`template-block-bodies-await-helpers`) made `<%= helper(..., () => { %>…<% }) %>` block-expr bodies async. It did not cover blocks opened in a `<% %>` code tag. `emitSteps` (`packages/tse-compiler/lib/emit-js.ts`) pushes such an arrow onto `functionDepths`, and nothing inside it awaits. So these still append an unresolved promise and raise `TypeError: no implicit conversion of Promise into String` (`actionview/lib/buffers.ts`):

- `<% items.forEach((i) => { %><%= render(i) %><% }) %>` (Rails: `<% items.each do |i| %>`, synchronous)
- `<% contentFor("x", () => { %><%= render("p") %><% }) %>` (Rails: `<% content_for :x do %>`, `capture_helper.rb:175-188`)

The emitter can't make every code-tag arrow async: `forEach` discards the returned promises, so iteration would need awaiting too.

## Acceptance criteria

- `<% items.forEach((i) => { %><%= render(i) %><% }) %>` renders each item in order (iteration awaited, e.g. by rewriting to `for…of` or by awaiting each callback).
- `<% contentFor("x", () => { %><%= render("p") %><% }) %>` stores the rendered partial.
- A tse-compiler emit test and an actionview render test pin both; each fails on main.
