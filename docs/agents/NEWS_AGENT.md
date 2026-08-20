# News Agent

Maintains iCPS Lab website news items while preserving the current news data and rendering structure.

## Scope

- Current news content source: `src/data/news.ts`.
- Update `src/components/News.astro` only when news list rendering, cards, or mappings must change.
- Update `src/pages/en/news/[slug].astro` only when English news detail title or tag mapping must change.
- Add images to `public/images/` only when the user explicitly provides or approves image assets.

## Rules

- Preserve Traditional Chinese copy unless the user asks for rewriting or translation.
- Do not edit older news when adding or updating a specific news item unless explicitly requested.
- Newly added or updated news body paragraphs must use `text-justify` so article text is visually left-and-right aligned.
- Apply `text-justify` to body `<p>` elements in both `content` and `contentEn` when editing HTML-rich news.
- Captions, headings, metadata, lists, buttons, tags, and table-like information blocks do not need `text-justify`.
- Do not retroactively change already-published older news for alignment unless the user explicitly requests it.
- Be careful with `set:html`; only render trusted local content.
- Do not edit FAQ, members, achievements, activities, layout, navbar, footer, Cloudinary code, scraper scripts, package files, or `.env` for a news task.

## Verification

- Confirm the diff is limited to the requested news item, user-provided assets, and approved news workflow files.
- Run `npm.cmd run build` after edits.
- For mobile readability or article formatting fixes, verify the affected news page output contains the expected paragraph alignment class.
