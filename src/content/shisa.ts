export type Pattern = 'dots' | 'stripes' | 'shell' | 'stars' | 'spots' | 'bumps' | 'crumbs' | 'crystals' | 'flowers' | 'scales' | 'burst' | 'drum';
export type Hat = 'starfish' | 'leaf' | 'bean' | 'band' | 'crown';

export interface Series {
  id: 'trad' | 'sea' | 'food' | 'fest';
  name: string;
  color: string;
}

export interface Variant {
  id: string;
  name: string;
  series: Series['id'];
  body: string;
  face: string;
  /** One colour, or several that cycle around the mane */
  mane: string | string[];
  dark: string;
  note: string;
  pattern?: Pattern;
  stripe?: string;
  hat?: Hat;
  rare?: boolean;
  sparkle?: boolean;
  /** Owned from the start */
  starter?: boolean;
}

export const SERIES: Series[] = [
  { id: 'trad', name: '傳統系列', color: '#C8452F' },
  { id: 'sea', name: '海洋系列', color: '#2D8FD0' },
  { id: 'food', name: '美食系列', color: '#8C56AA' },
  { id: 'fest', name: '祭典系列', color: '#E2703A' },
];

const v = (
  id: string,
  name: string,
  series: Series['id'],
  body: string,
  face: string,
  mane: string | string[],
  dark: string,
  extra: Partial<Variant> & { note: string },
): Variant => ({
  id,
  name,
  series,
  body,
  face,
  mane,
  dark,
  ...extra,
});

export const VARIANTS: Variant[] = [
  v('terracotta', '素燒獅', 'trad', '#E8743E', '#F39A5E', '#B34A24', '#7C2E14', { starter: true, note: '最常見的紅陶風獅爺' }),
  v('celadon', '青釉獅', 'trad', '#3DA399', '#6CC4B8', '#25756E', '#174E49', { starter: true, note: '上了青色釉，亮亮的' }),
  v('plaster', '白灰獅', 'trad', '#EFEAE0', '#FFFFFF', '#C9C0B0', '#6E665A', { note: '用屋頂的白灰捏成的' }),
  v('kuro', '黑釉獅', 'trad', '#3B3A44', '#5C5B68', '#24232B', '#121216', { note: '黑得發亮，很威風' }),
  v('gold', '金獅', 'trad', '#E8B83A', '#F6D26B', '#B7871C', '#6E4E0A', { rare: true, sparkle: true, note: '傳說中會帶來好運' }),
  v('coral', '珊瑚獅', 'sea', '#F27A8A', '#F9A9B3', '#D04F63', '#7E2433', { pattern: 'dots', note: '住在珊瑚礁旁邊' }),
  v('turtle', '海龜獅', 'sea', '#6DAA5C', '#9CCB86', '#3F7A3A', '#23461F', { pattern: 'shell', note: '背著龜殼慢慢走' }),
  v('fish', '熱帶魚獅', 'sea', '#F7C843', '#FBE08A', '#2D7FD0', '#1B4B7E', { pattern: 'stripes', stripe: '#2D7FD0', note: '黃藍條紋，游得很快' }),
  v('starsand', '星砂獅', 'sea', '#EAD7AE', '#F6EBCF', '#C9AE76', '#6E5A33', { pattern: 'stars', hat: 'starfish', note: '身上沾滿星星沙' }),
  v('whaleshark', '鯨鯊獅', 'sea', '#2F4F7F', '#5B7DB0', '#1D3557', '#0E1C30', { pattern: 'spots', rare: true, sparkle: true, note: '美麗海最大的明星' }),
  v('beniimo', '紅芋獅', 'food', '#8C56AA', '#B58BD0', '#5E3478', '#34183F', { note: '紅芋塔做的，香香甜甜' }),
  v('goya', '苦瓜獅', 'food', '#5FAE4B', '#8CCB72', '#3E7F30', '#1F4517', { pattern: 'bumps', hat: 'leaf', note: '有點苦，但是很健康' }),
  v('chinsuko', '金楚糕獅', 'food', '#E2B77A', '#F1D3A3', '#B98845', '#6A4A1E', { pattern: 'crumbs', note: '酥酥的，小心不要碎掉' }),
  v('kokuto', '黑糖獅', 'food', '#7A4A2A', '#A06C47', '#4F2C14', '#2A160A', { pattern: 'crystals', note: '黑糖塊亮晶晶' }),
  v('zenzai', '刨冰獅', 'food', '#DDF1FA', '#FFFFFF', ['#FF8FB1', '#7CC8F2', '#FFD34E'], '#4B6B80', {
    hat: 'bean',
    rare: true,
    sparkle: true,
    note: '頭上有一顆紅豆',
  }),
  v('eisa', '太鼓獅', 'fest', '#D9443A', '#F07A6E', '#8E231B', '#5A130D', { hat: 'band', pattern: 'drum', note: '跳艾薩舞的時候最帥' }),
  v('bingata', '紅型獅', 'fest', '#F3B23F', '#FFD58A', '#D9443A', '#7A3A10', { pattern: 'flowers', note: '穿著紅型花布' }),
  v('sanshin', '三線獅', 'fest', '#4A3B33', '#7A6658', '#2A201B', '#120D0A', { pattern: 'scales', note: '會彈三線琴' }),
  v('hanabi', '煙火獅', 'fest', '#27315C', '#4A578F', '#151C3A', '#0B0F22', { pattern: 'burst', note: '夏天祭典的煙火' }),
  v('king', '琉球王獅', 'fest', '#C23A2B', '#E06A55', '#E8B83A', '#5A140D', { hat: 'crown', rare: true, sparkle: true, note: '首里城的國王' }),
];

export const VARIANT_BY_ID: Record<string, Variant> = Object.fromEntries(VARIANTS.map((x) => [x.id, x]));
export const STARTERS = VARIANTS.filter((x) => x.starter).map((x) => x.id);

/** Weighted draw among the series' shisa the player doesn't own yet; never a duplicate */
export function drawFromSeries(seriesId: Series['id'], owned: readonly string[], random: () => number = Math.random): Variant | null {
  const pool = VARIANTS.filter((x) => x.series === seriesId && !owned.includes(x.id));
  if (!pool.length) return null;
  const weights = pool.map((x) => (x.rare ? 1 : 3));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
