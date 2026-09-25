---
title: "Scaffold views are hand-written HTML, not Rails' erb scaffold templates"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8097 (generator `classify` removal). `ScaffoldGenerator`
(`packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts`) emits
views whose structure is not Rails' erb scaffold templates; #8097 only converged the
naming calls (`humanize` for `human_name`, `.toLowerCase()` for `.downcase`).

Rails (`railties/lib/rails/generators/erb/scaffold/templates/`):

- `index.html.erb.tt:1-16`: notice, `content_for :title, human_name.pluralize`,
  `<div id=plural_table_name>` rendering each record's partial, and
  "Show this #{human_name.downcase}" / "New #{human_name.downcase}" links. trails emits
  a `<table>` with `<th>` headers and Show/Edit links instead.
- `partial.html.erb.tt`: `_<singular>.html.erb` with `dom_id` and
  `<strong>#{attribute.human_name}:</strong>` per attribute. trails has no partial,
  and `show` inlines the fields.
- `show.html.erb.tt`: renders the partial, then "Edit this …" / "Back to …" and a
  `button_to "Destroy this …"`. trails has no destroy button.
- `new.html.erb.tt` / `edit.html.erb.tt`: `content_for :title`, `render "form"`,
  "Back to #{human_name.pluralize.downcase}", and "Show this …" on edit. trails uses
  `<%= yield %>` and `href` literals.
- `_form.html.erb.tt`: `form_with(model:)` with an errors block, `form.label` /
  `form.<field_type>` per attribute and `form.submit`. trails hand-writes
  `<form method="post">`, `<label>`, `<input>` and a "Save …" submit.

## Acceptance criteria

- Each scaffold view is emitted in the Rails template's structure and text, using the
  actionview helpers trails ports (`form_with`, `link_to`, `button_to`, `dom_id`,
  `content_for`, `render`).
- A `_<singular>.html.tse` partial is generated, and `show` / `index` render it.
- The scaffold generator tests assert the Rails copy ("Show this post", "Back to posts",
  "Destroy this post", "Editing post").
