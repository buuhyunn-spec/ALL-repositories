---
name: faq-schema
description: Generate FAQPage JSON-LD structured data from pasted page HTML. Use when the user pastes HTML containing questions and answers and asks for FAQPage schema, FAQ schema, JSON-LD, structured data, or schema markup for Q&A content.
---

# FAQPage Schema Generation

Standing rules for producing FAQPage JSON-LD. These are fixed. Do not re-litigate
them with the user each time.

## Workflow

The user pastes an HTML snippet. Return **exactly one** paste-ready FAQPage
JSON-LD block, in a single fenced code block.

Nothing else changes: no repo edits, no page edits, no PR unless explicitly asked.

---

## Section A — House Rules (canon)

These are the user's own rules. They **override** any default or spec-derived
preference where the two differ.

1. **One `FAQPage` block per page.** Never stack duplicates — two labels on one
   page conflict with each other.
2. **Never copy another page's `@id`.** Always swap in the live URL of the exact
   page being worked on.
3. **HTML widget only.** Text Editor and Shortcode widgets escape or mangle the
   `<script>` tag.
4. **Never purge the WP Engine cache yourself.** It's site-wide across ~800 pages
   — always go through the Project Lead (Step 7).
5. **Type JSON in a plain text editor, never Google Docs.** Silent curly-quote
   corruption (Step 3).
6. **Strip HTML tags out of every answer, and escape internal quotes as `\"`.**
   Both break the label if left in.
7. **Don't touch the visible FAQ content to make this fix.** If the on-page copy
   changes later, the schema has to be updated to match — mismatched schema and
   content is worse than no schema at all.
8. **If a question has no answer text under it, flag it.** Don't write one
   yourself.

> Rules 4 and 5 reference "Step 7" and "Step 3" of an external workflow document
> not held in this repo. Recorded verbatim as the user wrote them.

---

## Section B — Generation spec

### Output contract

- Exactly one `<script type="application/ld+json">` block.
- Delivered in a single fenced code block, ready to paste with no editing.
- No commentary, CTA, or tracking parameters inside the block.

### Required shape

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.example.com/the-live-page-slug/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "The question, verbatim from the page.",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The complete answer, verbatim, tags stripped."
      }
    }
  ]
}
```

### Question rules

- `name` is the question **verbatim** from the supplied HTML.
- The question must be genuinely interrogative. If the source uses a
  statement-style heading, **flag it** — never silently reword it (rule 07).
- The question must be visibly present on the page.

### Answer rules

- `text` is the **complete** visible answer, verbatim. Never truncate, never
  summarize, never rewrite.
- **Strip all HTML tags** (rule 06). Anchor text is retained; the `href` is
  dropped — the live page still carries the working link.
- Escape internal double quotes as `\"`.
- No raw newlines inside `text` — collapse whitespace to single spaces.
- Never inject CTA or promotional copy into an answer.
- Never invent an answer (rule 08).

### `@id` rules

- Live URL of the exact page being worked on, plus `#faq` (rule 02).
- If the slug is unknown, use a `<page-slug>` placeholder **and call it out
  explicitly in the reply**, so it can never be pasted by accident.

### Never

- Mark up any Q&A pair that is not visible on the page.
- Modify, merge into, or replace existing JSON-LD (LocalBusiness, Article, etc.).
  FAQPage is always a **separate, standalone** block.
- Rewrite page copy for any reason.
- Emit more than one FAQPage block for a single page.
- Reuse the same Q&A set across multiple pages.

---

## Section C — Deployment notes

- Paste into an **HTML widget** only (rule 03).
- Compose and edit JSON in a **plain text editor** only (rule 05).
- **Never purge the WP Engine cache** — route to the Project Lead (rule 04).

---

## Section D — Expectations

Google restricted FAQ rich results in **August 2023** to well-known,
authoritative government and health sites. Do **not** promise expandable
dropdown rich results for commercial pages.

The value is machine-readable labeling that lets an assistant identify a passage
as a question-and-answer pair — i.e. AI answer extraction, not SERP decoration.

### Advisory quality notes

These inform **flagging only**. They are never a license to edit copy (rule 07).

- Front-loaded answers (direct response in sentence one) extract best.
- Context-dependent pronouns ("as mentioned above", "this approach") break a
  passage when it's quoted in isolation. Flag them; do not fix them.
- Schema cannot rescue a vague answer. Marking up "it depends, contact us" just
  labels a non-answer as an answer.

---

## Pre-flight checklist

Run every item before returning any block:

1. Is every Q&A pair visibly present on the supplied page?
2. Exactly one `FAQPage` block?
3. Is `@id` this page's live URL — not carried over from another page?
4. Are all questions interrogative, or flagged if not?
5. Are all answers complete and verbatim?
6. Are all HTML tags stripped from every answer?
7. Are internal quotes escaped as `\"`, with no raw newlines?
8. Straight quotes only in all JSON syntax — no curly-quote corruption?
9. Does the JSON parse as valid?
10. Is any question lacking an answer flagged rather than invented?
