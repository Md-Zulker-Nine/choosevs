const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLength: number): number[] {
  const gen = rsGenerator(ecLength);
  const result = new Array(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < ecLength; i++) {
      result[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return result;
}

interface VersionSpec {
  dataCodewords: number;
  ecPerBlock: number;
  blocks: number[];
  alignment: number[];
}

const VERSIONS: Record<number, VersionSpec> = {
  1: { dataCodewords: 19, ecPerBlock: 7, blocks: [19], alignment: [] },
  2: { dataCodewords: 34, ecPerBlock: 10, blocks: [34], alignment: [6, 18] },
  3: { dataCodewords: 55, ecPerBlock: 15, blocks: [55], alignment: [6, 22] },
  4: { dataCodewords: 80, ecPerBlock: 20, blocks: [80], alignment: [6, 26] },
  5: { dataCodewords: 108, ecPerBlock: 26, blocks: [108], alignment: [6, 30] },
  6: { dataCodewords: 136, ecPerBlock: 18, blocks: [68, 68], alignment: [6, 34] },
  7: { dataCodewords: 156, ecPerBlock: 20, blocks: [78, 78], alignment: [6, 22, 38] },
  8: { dataCodewords: 194, ecPerBlock: 24, blocks: [97, 97], alignment: [6, 24, 42] },
  9: { dataCodewords: 232, ecPerBlock: 30, blocks: [116, 116], alignment: [6, 26, 46] },
  10: { dataCodewords: 274, ecPerBlock: 18, blocks: [68, 68, 69, 69], alignment: [6, 28, 50] },
};

function toBytes(text: string): number[] {
  const encoded = encodeURIComponent(text);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') {
      bytes.push(parseInt(encoded.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  return bytes;
}

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const spec = VERSIONS[v];
    const countBits = v < 10 ? 8 : 16;
    const capacity = spec.dataCodewords * 8 - 4 - countBits;
    if (byteLength * 8 <= capacity) return v;
  }
  throw new Error('QR: content too long');
}

function buildCodewords(bytes: number[], version: number): number[] {
  const spec = VERSIONS[version];
  const countBits = version < 10 ? 8 : 16;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);
  push(bytes.length, countBits);
  for (const b of bytes) push(b, 8);

  const capacityBits = spec.dataCodewords * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  push(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }

  const pads = [0xec, 0x11];
  let p = 0;
  while (codewords.length < spec.dataCodewords) codewords.push(pads[p++ % 2]);

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const size of spec.blocks) {
    const block = codewords.slice(offset, offset + size);
    offset += size;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, spec.ecPerBlock));
  }

  const result: number[] = [];
  const maxData = Math.max(...spec.blocks);
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const block of ecBlocks) result.push(block[i]);
  }
  return result;
}

type Matrix = (0 | 1 | null)[][];

function createMatrix(version: number): { matrix: Matrix; reserved: boolean[][] } {
  const size = version * 4 + 17;
  const matrix: Matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const setModule = (r: number, c: number, value: 0 | 1) => {
    matrix[r][c] = value;
    reserved[r][c] = true;
  };

  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isDark =
          inRing &&
          ((r === 0 || r === 6 || c === 0 || c === 6) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setModule(rr, cc, isDark ? 1 : 0);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    const value: 0 | 1 = i % 2 === 0 ? 1 : 0;
    setModule(6, i, value);
    setModule(i, 6, value);
  }

  const centers = VERSIONS[version].alignment;
  for (const r of centers) {
    for (const c of centers) {
      const isFinderCorner =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (isFinderCorner) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setModule(r + dr, c + dc, isDark ? 1 : 0);
        }
      }
    }
  }

  setModule(size - 8, 8, 1);

  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) {
      matrix[8][i] = 0;
      reserved[8][i] = true;
    }
    if (matrix[i][8] === null) {
      matrix[i][8] = 0;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][size - 1 - i] === null) {
      matrix[8][size - 1 - i] = 0;
      reserved[8][size - 1 - i] = true;
    }
    if (matrix[size - 1 - i][8] === null) {
      matrix[size - 1 - i][8] = 0;
      reserved[size - 1 - i][8] = true;
    }
  }

  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      matrix[r][c] = 0;
      reserved[r][c] = true;
      matrix[c][r] = 0;
      reserved[c][r] = true;
    }
  }

  return { matrix, reserved };
}

function placeData(matrix: Matrix, reserved: boolean[][], codewords: number[]) {
  const size = matrix.length;
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        let bit = 0;
        if (bitIndex < totalBits) {
          bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
        }
        matrix[row][cc] = bit as 0 | 1;
      }
    }
    upward = !upward;
  }
}

function maskFn(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

function formatBits(mask: number): number {
  const data = (0b01 << 3) | mask;
  let value = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((value >> i) & 1) value ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | value) ^ 0b101010000010010;
}

function versionBits(version: number): number {
  let value = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((value >> i) & 1) value ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | value;
}

function applyFormatAndVersion(matrix: Matrix, version: number, mask: number) {
  const size = matrix.length;
  const format = formatBits(mask);

  for (let i = 0; i < 15; i++) {
    const bit = ((format >> i) & 1) as 0 | 1;
    if (i < 6) matrix[i][8] = bit;
    else if (i === 6) matrix[7][8] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[8][7] = bit;
    else matrix[8][14 - i] = bit;

    if (i < 8) matrix[8][size - 1 - i] = bit;
    else matrix[size - 15 + i][8] = bit;
  }

  matrix[size - 8][8] = 1;

  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >> i) & 1) as 0 | 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      matrix[r][c] = bit;
      matrix[c][r] = bit;
    }
  }
}

function penalty(matrix: Matrix): number {
  const size = matrix.length;
  let score = 0;

  const runScore = (run: number) => (run >= 5 ? run - 2 : 0);

  for (let i = 0; i < size; i++) {
    let rowRun = 1;
    let colRun = 1;
    for (let j = 1; j < size; j++) {
      rowRun = matrix[i][j] === matrix[i][j - 1] ? rowRun + 1 : (score += runScore(rowRun), 1);
      colRun = matrix[j][i] === matrix[j - 1][i] ? colRun + 1 : (score += runScore(colRun), 1);
    }
    score += runScore(rowRun) + runScore(colRun);
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) score += 3;
    }
  }

  const patternA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const patternB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (get: (i: number) => number | null, start: number, pattern: number[]) =>
    pattern.every((p, i) => get(start + i) === p);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 11; j++) {
      if (matches(k => matrix[i][k], j, patternA) || matches(k => matrix[i][k], j, patternB)) score += 40;
      if (matches(k => matrix[k][i], j, patternA) || matches(k => matrix[k][i], j, patternB)) score += 40;
    }
  }

  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (matrix[r][c] === 1) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

export function qrMatrix(text: string): (0 | 1)[][] {
  const bytes = toBytes(text);
  const version = pickVersion(bytes.length);
  const codewords = buildCodewords(bytes, version);

  let best: Matrix | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const { matrix, reserved } = createMatrix(version);
    placeData(matrix, reserved, codewords);
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        if (!reserved[r][c] && maskFn(mask, r, c)) matrix[r][c] = (matrix[r][c] === 1 ? 0 : 1) as 0 | 1;
      }
    }
    applyFormatAndVersion(matrix, version, mask);
    const score = penalty(matrix);
    if (score < bestScore) {
      bestScore = score;
      best = matrix;
    }
  }

  return best as (0 | 1)[][];
}

export function qrSvg(text: string, options: { size?: number; margin?: number; dark?: string; light?: string } = {}): string {
  const { size = 180, margin = 4, dark = '#0f172a', light = '#ffffff' } = options;
  const matrix = qrMatrix(text);
  const count = matrix.length;
  const total = count + margin * 2;

  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c] === 1) path += `M${c + margin} ${r + margin}h1v1h-1z`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${total}" height="${total}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
}

export function qrDataUri(text: string, options?: Parameters<typeof qrSvg>[1]): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg(text, options))}`;
}
