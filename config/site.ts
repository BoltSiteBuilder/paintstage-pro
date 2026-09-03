// Shared marketing/site constants. Kept out of App.tsx so the studio and the
// marketing pages can't drift apart.

export const SITE = {
  name: 'PaintStage Pro',
  url: 'https://PaintStagePro.com',
  logo: '/ChatGPT_Image_May_14,_2026,_03_45_00_PM.png',
  // Route this to a shared inbox before launch — it is the destination for
  // volume/enterprise enquiries from the pricing page and the hard-cap CTA.
  contactEmail: 'rwarfieldjr@gmail.com',
} as const;

export const BRAND_DISCLAIMER =
  'PaintStage Pro is an independent tool and is not affiliated with, endorsed by, or sponsored by Sherwin-Williams, Benjamin Moore, Behr, or any paint manufacturer. All paint brand names, color names, and color codes are trademarks or property of their respective owners and are used here for identification and reference purposes only.';

export const PREVIEW_DISCLAIMER =
  'AI color visualizations are approximate previews. Actual results may vary based on lighting, surface texture, and paint sheen. Always confirm with a physical sample before purchasing.';
