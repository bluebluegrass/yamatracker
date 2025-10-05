# Open Questions & Missing Inputs

- Final cartoonized Japan region SVG with stable `id`s matching `mountains.region`; need from design/illustration partner (attach to `public/maps`).
- Canonical 100-mountain dataset (EN/JA/ZH names, prefecture splits, difficulty stars, elevation) and update cadence; confirm owner (likely product/data team).
- Altitude bucket thresholds and labeling approval (e.g., `<1000m`, `1000–1999m`, `2000–2999m`, `≥3000m`); align with mountaineering adviser.
- Difficulty scale definition (★ to ★★★★ or ★★★★★?) and mapping to `mountains.difficulty`; confirm with content team.
- Landing page hero/feature copy for en/ja/zh plus social proof assets/screenshots; marketing to supply.
- Visual style direction for tracker cards, map shading palette, and profile name-card treatment; design system team to deliver Figma references.
- Avatar source and storage strategy for profiles (upload vs. external URL); clarify with backend/product.
- Public profile fields allowed for exposure (email, join date?) and privacy policy alignment; legal/product decision.
- Slug collision resolution (auto-increment suffix vs. prompt user); need product guidance.
- Analytics provider selection (Segment, PostHog, custom) and event taxonomy; await growth/analytics team input.
- Error messaging tone and localization for new flows (map load failure, analytics opt-in); copywriting team to draft.
- Performance budget for tracker page (bundle size target, acceptable initial load); frontend lead to specify.
- Testing strategy expectations (Cypress/E2E vs. Playwright vs. manual checklist); QA lead to decide.
- Deployment workflow for Supabase migrations (use `supabase db push` vs. manual SQL); DevOps owner to confirm.
- Accessibility requirements for SVG map and shareable assets (color contrast, keyboard nav, alt text); accessibility specialist sign-off needed.
- Locale expansion roadmap beyond en/ja/zh (e.g., Korean); determine if infrastructure should anticipate additional languages now.
