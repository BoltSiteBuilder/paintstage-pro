/*
# Create paint_colors table

## Purpose
Reference table for Sherwin-Williams paint colors used by the PaintStage Pro color picker.
This is read-only reference data — no user-owned rows, no auth required.

## New Table: paint_colors
- color_number (text, primary key) — e.g. "SW 7029"
- color_name (text) — e.g. "Agreeable Gray"
- hex (text) — e.g. "#D1CBC1"
- rgb_r / rgb_g / rgb_b (smallint) — pre-computed RGB components
- collection (text) — grouping label, defaults to 'Sherwin-Williams'

## Security
- RLS enabled.
- Single SELECT policy for anon + authenticated (read-only reference data, no ownership check needed).
- No insert/update/delete policies — this table is managed only by migrations.

## Notes
1. No user_id column — this is shared reference data, not per-user data.
2. USING (true) on SELECT is intentional: all visitors need to read the color list.
3. INSERT uses ON CONFLICT DO NOTHING so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS paint_colors (
  color_number text PRIMARY KEY,
  color_name   text NOT NULL,
  hex          text NOT NULL,
  rgb_r        smallint NOT NULL,
  rgb_g        smallint NOT NULL,
  rgb_b        smallint NOT NULL,
  collection   text NOT NULL DEFAULT 'Sherwin-Williams'
);

ALTER TABLE paint_colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_paint_colors" ON paint_colors;
CREATE POLICY "read_paint_colors" ON paint_colors
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO paint_colors (color_number, color_name, hex, rgb_r, rgb_g, rgb_b) VALUES
  ('SW 7005', 'Pure White',            '#EDECE6', 237, 236, 230),
  ('SW 7029', 'Agreeable Gray',        '#D1CBC1', 209, 203, 193),
  ('SW 7015', 'Repose Gray',           '#CCC9C0', 204, 201, 192),
  ('SW 7008', 'Alabaster',             '#EDEAE0', 237, 234, 224),
  ('SW 7004', 'Snowbound',             '#EDEAE5', 237, 234, 229),
  ('SW 7036', 'Accessible Beige',      '#D1C7B8', 209, 199, 184),
  ('SW 6385', 'Dover White',           '#F0EADC', 240, 234, 220),
  ('SW 7043', 'Worldly Gray',          '#CEC6BB', 206, 198, 187),
  ('SW 6258', 'Tricorn Black',         '#2F2F30',  47,  47,  48),
  ('SW 7016', 'Mindful Gray',          '#BCB7AD', 188, 183, 173),
  ('SW 6106', 'Kilim Beige',           '#D7C5AE', 215, 197, 174),
  ('SW 7014', 'Eider White',           '#E2DED8', 226, 222, 216),
  ('SW 6119', 'Antique White',         '#E8DCC6', 232, 220, 198),
  ('SW 7030', 'Anew Gray',             '#BFB6AA', 191, 182, 170),
  ('SW 0055', 'Light French Gray',     '#C2C0BB', 194, 192, 187),
  ('SW 7064', 'Passive',               '#CBCCC9', 203, 204, 201),
  ('SW 7044', 'Amazing Gray',          '#BEB5A9', 190, 181, 169),
  ('SW 7042', 'Shoji White',           '#E6DFD3', 230, 223, 211),
  ('SW 7631', 'City Loft',             '#DFDAD1', 223, 218, 209),
  ('SW 7012', 'Creamy',                '#EFE8DB', 239, 232, 219),
  ('SW 7017', 'Dorian Gray',           '#ACA79E', 172, 167, 158),
  ('SW 7007', 'Ceiling Bright White',  '#E9EBE7', 233, 235, 231),
  ('SW 7551', 'Greek Villa',           '#F0ECE2', 240, 236, 226),
  ('SW 7035', 'Aesthetic White',       '#E3DDD3', 227, 221, 211),
  ('SW 7647', 'Crushed Ice',           '#D6D3CC', 214, 211, 204),
  ('SW 7011', 'Natural Choice',        '#E3DED0', 227, 222, 208),
  ('SW 7009', 'Pearly White',          '#E8E3D9', 232, 227, 217),
  ('SW 9166', 'Drift of Mist',         '#DCD8D0', 220, 216, 208),
  ('SW 6126', 'Navajo White',          '#E9DCC6', 233, 220, 198),
  ('SW 7019', 'Gauntlet Gray',         '#78736E', 120, 115, 110),
  ('SW 7671', 'On the Rocks',          '#D0CEC8', 208, 206, 200),
  ('SW 7018', 'Dovetail',              '#908A83', 144, 138, 131),
  ('SW 7071', 'Gray Screen',           '#C6CACA', 198, 202, 202),
  ('SW 6141', 'Softer Tan',            '#DACAB2', 218, 202, 178),
  ('SW 7641', 'Colonnade Gray',        '#C6C0B6', 198, 192, 182),
  ('SW 7037', 'Balanced Beige',        '#C0B2A2', 192, 178, 162),
  ('SW 7022', 'Alpaca',                '#CCC5BD', 204, 197, 189),
  ('SW 9165', 'Gossamer Veil',         '#D3CEC4', 211, 206, 196),
  ('SW 7069', 'Iron Ore',              '#434341',  67,  67,  65),
  ('SW 6254', 'Lazy Gray',             '#BEC1C3', 190, 193, 195),
  ('SW 6105', 'Divine White',          '#E6DCCD', 230, 220, 205),
  ('SW 7028', 'Incredible White',      '#E3DED7', 227, 222, 215),
  ('SW 7632', 'Modern Gray',           '#D6CEC3', 214, 206, 195),
  ('SW 6071', 'Popular Gray',          '#D4CCC3', 212, 204, 195),
  ('SW 7636', 'Origami White',         '#E5E2DA', 229, 226, 218),
  ('SW 7566', 'Westhighland White',    '#F3EEE3', 243, 238, 227),
  ('SW 9109', 'Natural Linen',         '#DFD3C3', 223, 211, 195),
  ('SW 7646', 'First Star',            '#DAD9D4', 218, 217, 212),
  ('SW 7674', 'Peppercorn',            '#585858',  88,  88,  88),
  ('SW 7661', 'Reflection',            '#D3D5D3', 211, 213, 211),
  ('SW 6204', 'Sea Salt',              '#CDD2CA', 205, 210, 202),
  ('SW 7048', 'Urbane Bronze',         '#54504A',  84,  80,  74),
  ('SW 7006', 'Extra White',           '#EEEFEA', 238, 239, 234),
  ('SW 7010', 'White Duck',            '#E5DFD2', 229, 223, 210),
  ('SW 7057', 'Silver Strand',         '#C8CBC4', 200, 203, 196),
  ('SW 7023', 'Requisite Gray',        '#B9B2A9', 185, 178, 169),
  ('SW 7031', 'Mega Greige',           '#ADA295', 173, 162, 149),
  ('SW 7045', 'Intellectual Gray',     '#A8A093', 168, 160, 147),
  ('SW 7050', 'Useful Gray',           '#CFCABD', 207, 202, 189),
  ('SW 7051', 'Analytical Gray',       '#BFB6A7', 191, 182, 167),
  ('SW 6205', 'Comfort Gray',          '#BEC3BB', 190, 195, 187),
  ('SW 6206', 'Oyster Bay',            '#AEB3A9', 174, 179, 169),
  ('SW 6207', 'Retreat',               '#7A8076', 122, 128, 118),
  ('SW 6208', 'Pewter Green',          '#5E6259',  94,  98,  89),
  ('SW 6211', 'Rainwashed',            '#C2CDC5', 194, 205, 197),
  ('SW 6218', 'Tradewind',             '#C2CFCF', 194, 207, 207),
  ('SW 7073', 'Network Gray',          '#A0A5A7', 160, 165, 167),
  ('SW 7074', 'Software',              '#7F8486', 127, 132, 134),
  ('SW 7076', 'Cyberspace',            '#44484D',  68,  72,  77),
  ('SW 7020', 'Black Fox',             '#4F4842',  79,  72,  66),
  ('SW 7102', 'White Flour',           '#F4EFE5', 244, 239, 229),
  ('SW 7103', 'Whitetail',             '#F4EFE4', 244, 239, 228),
  ('SW 7757', 'High Reflective White', '#F7F7F1', 247, 247, 241),
  ('SW 7516', 'Kestrel White',         '#E0D6C8', 224, 214, 200),
  ('SW 7526', 'Maison Blanche',        '#DFD2BF', 223, 210, 191),
  ('SW 7531', 'Canvas Tan',            '#DCD1BF', 220, 209, 191),
  ('SW 7506', 'Loggia',                '#C4B7A5', 196, 183, 165),
  ('SW 7504', 'Keystone Gray',         '#9E9284', 158, 146, 132),
  ('SW 7511', 'Bungalow Beige',        '#CDBFB0', 205, 191, 176),
  ('SW 7512', 'Pavilion Beige',        '#C5B6A4', 197, 182, 164),
  ('SW 7567', 'Natural Tan',           '#DCD2C3', 220, 210, 195),
  ('SW 7570', 'Egret White',           '#DFD9CF', 223, 217, 207),
  ('SW 7568', 'Neutral Ground',        '#E2DACA', 226, 218, 202),
  ('SW 7554', 'Steamed Milk',          '#ECE1D1', 236, 225, 209),
  ('SW 6140', 'Moderate White',        '#E9DECF', 233, 222, 207),
  ('SW 6148', 'Wool Skein',            '#D9CFBA', 217, 207, 186),
  ('SW 6142', 'Macadamia',             '#CCB79B', 204, 183, 155),
  ('SW 6150', 'Universal Khaki',       '#B8A992', 184, 169, 146),
  ('SW 6155', 'Rice Grain',            '#DBD0B9', 219, 208, 185),
  ('SW 6164', 'Svelte Sage',           '#B2AC96', 178, 172, 150),
  ('SW 6178', 'Clary Sage',            '#ACAD97', 172, 173, 151),
  ('SW 6191', 'Contented',             '#BDC0B3', 189, 192, 179),
  ('SW 6213', 'Halcyon Green',         '#9BAAA2', 155, 170, 162),
  ('SW 6239', 'Upward',                '#BFC9D0', 191, 201, 208),
  ('SW 6244', 'Naval',                 '#2F3D4C',  47,  61,  76),
  ('SW 6247', 'Krypton',               '#B8C0C3', 184, 192, 195),
  ('SW 6232', 'Misty',                 '#CDD2D2', 205, 210, 210),
  ('SW 6255', 'Morning Fog',           '#A8AEB1', 168, 174, 177),
  ('SW 7602', 'Indigo Batik',          '#3E5063',  62,  80,  99),
  ('SW 9130', 'Evergreen Fog',         '#95978A', 149, 151, 138)
ON CONFLICT (color_number) DO NOTHING;
