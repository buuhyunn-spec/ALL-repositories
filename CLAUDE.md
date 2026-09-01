# Repository Notes

This repository holds multiple unrelated projects. Scope guidance to the project
being worked on.

## FAQPage schema work

When asked to generate FAQPage / FAQ / JSON-LD structured data from pasted page
HTML, follow the standing rules in `.claude/skills/faq-schema/SKILL.md`.

That file is canon: it carries the house rules (one FAQPage block per page, never
reuse another page's `@id`, strip HTML tags from answers, never alter visible FAQ
copy, flag missing answers rather than writing them) plus the output contract and
a pre-flight checklist. Read it before producing any schema — do not improvise the
rules or re-derive them in conversation.

The skill can also be invoked directly with `/faq-schema`.
