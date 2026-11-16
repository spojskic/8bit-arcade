const GLYPHS: Record<string, string[]> = {
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
};

export const ROWS = 7;

export type Pixel = { col: number; row: number; index: number; gold: boolean };

export function stageFor(word: string): { cols: number; rows: number; pixels: Pixel[] } {
  let col = 0;
  let count = 0;
  const pixels: Pixel[] = [];
  for (const letter of word) {
    const glyph = GLYPHS[letter];
    if (!glyph) { col += 6; continue; }
    glyph.forEach((line, row) => {
      [...line].forEach((cell, c) => {
        if (cell === '1') {
          pixels.push({ col: col + c, row, index: count, gold: count % 13 === 5 });
          count++;
        }
      });
    });
    col += 6;
  }
  return { cols: col - 1, rows: ROWS, pixels };
}
