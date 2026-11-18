import type { Age } from './age';
import { type Series, VARIANTS } from './shisa';

// The decorations of 西薩的家 (ADR-0037, ADR-0039). Every house starts with three; each gacha machine, once all its
// shisa are collected, goes up to round 2 and turns out eight more on its series' theme, one of them rare. Facts in the
// notes were checked; keep any new ones just as careful.

/** How a decoration moves when it lands in the house or is tapped */
export type Motion = 'hop' | 'sway' | 'swing' | 'wiggle' | 'drum' | 'shine';

export interface Decor {
  id: string;
  name: string;
  /** One short line, shown when it comes out of a capsule */
  note: string;
  /** Width in house units; each is drawn in a 100 × 100 box with its feet at the bottom */
  w: number;
  motion: Motion;
  /** The machine it comes from; null for the three every house starts with */
  series: Series['id'] | null;
  rare?: boolean;
}

type Row = [id: string, name: string, w: number, motion: Motion, note: string];

const of = (series: Series['id'] | null, rows: Row[], rare?: Row): Decor[] => [
  ...rows.map(([id, name, w, motion, note]) => ({ id, name, w, motion, note, series })),
  ...(rare ? [{ id: rare[0], name: rare[1], w: rare[2], motion: rare[3], note: rare[4], series, rare: true }] : []),
];

export const DECOR: Decor[] = [
  ...of(null, [
    ['hibiscus', '扶桑花盆', 46, 'sway', '開著紅色扶桑花的花盆'],
    ['stone', '石敢當', 38, 'hop', '立在路口擋住壞東西的石碑'],
    ['jar', '水缸', 50, 'hop', '接雨水用的大水缸'],
  ]),
  ...of(
    'trad',
    [
      ['fukugi', '福木', 84, 'sway', '種在房子四周擋風的樹'],
      ['banana', '芭蕉', 80, 'sway', '芭蕉的纖維可以織成芭蕉布'],
      ['millstone', '石臼', 50, 'hop', '把黃豆磨碎，做成島豆腐'],
      ['basket', '竹籃', 46, 'hop', '裝著紅芋的竹編籃'],
      ['well', '石井', 64, 'hop', '以前村子裡大家一起打水的井'],
      ['conch', '水字貝', 40, 'hop', '長得像「水」字的貝殼，掛在門口保平安'],
      ['tiles', '紅瓦堆', 48, 'hop', '準備鋪上屋頂的紅瓦'],
    ],
    ['goldStone', '黃金石敢當', 38, 'shine', '金色的石敢當'],
  ),
  ...of(
    'sea',
    [
      ['float', '玻璃浮球', 40, 'hop', '讓漁網浮在海上的玻璃球'],
      ['coralRock', '珊瑚', 46, 'sway', '長在溫暖海裡的珊瑚'],
      ['net', '漁網', 62, 'swing', '掛起來曬乾的漁網'],
      ['sabani', '小木舟（サバニ）', 74, 'sway', '沖繩細長的木頭漁船'],
      ['starfish', '海星', 34, 'wiggle', '有五隻手的海星'],
      ['chime', '貝殼風鈴', 34, 'swing', '風一吹，貝殼就叮叮響'],
      ['fishTank', '熱帶魚缸', 54, 'hop', '小丑魚和藍色的魚游來游去'],
    ],
    ['turban', '夜光貝', 40, 'shine', '殼的裡面閃著七彩的光，琉球漆器上的螺鈿就是用它做的'],
  ),
  ...of(
    'food',
    [
      ['pineapple', '鳳梨', 38, 'hop', '甜甜的沖繩鳳梨'],
      ['goyaVine', '苦瓜棚', 76, 'sway', '爬滿苦瓜（ゴーヤー）的棚架'],
      ['shikuwasa', '香檬樹', 66, 'sway', '結著酸酸的香檬（シークヮーサー）'],
      ['chinsukoBox', '金楚糕盒', 44, 'hop', '沖繩的傳統小餅乾'],
      ['imo', '紅芋', 42, 'hop', '紫色的地瓜'],
      ['sugarBowl', '黑糖', 44, 'hop', '甘蔗煮出來的黑糖'],
      ['sataandagi', '沙翁盤', 46, 'hop', '炸得裂開、像在笑的沙翁（サーターアンダギー）'],
    ],
    ['mango', '芒果樹', 84, 'shine', '結滿金黃色的芒果'],
  ),
  ...of(
    'fest',
    [
      ['lantern', '燈籠', 40, 'swing', '紅白藍直條紋的圓燈籠'],
      ['yotsudake', '四竹', 34, 'drum', '兩手各拿兩片竹板，跳舞時喀喀響'],
      ['paranku', '小鼓（パーランクー）', 46, 'drum', '跳艾薩舞時拿在手上打的小鼓'],
      ['banner', '旗頭', 56, 'sway', '祭典時高高舉起、裝飾得很漂亮的旗'],
      ['taiko', '大太鼓', 54, 'drum', '艾薩舞裡最大的鼓'],
      ['sanshinLute', '三線', 40, 'hop', '三條弦的沖繩樂器，遊戲裡的音樂就是它'],
      ['flowerHat', '花笠', 46, 'hop', '琉球舞蹈戴的花帽子'],
    ],
    ['fireworks', '煙火', 70, 'shine', '也可以放在天空'],
  ),
  ...of(
    'animal',
    [
      ['gecko', '守宮', 30, 'wiggle', '趴在牆上的壁虎，會「嘰嘰」叫'],
      ['cat', '貓', 44, 'wiggle', '在院子曬太陽的貓'],
      ['butterfly', '大白斑蝶', 34, 'wiggle', '翅膀大大的、飛得很慢的白蝴蝶'],
      ['goat', '山羊', 56, 'wiggle', '沖繩人家常養的山羊（ヒージャー）'],
      ['agu', '阿古豬', 52, 'wiggle', '沖繩原生的黑豬（アグー）'],
      ['chicken', '雞', 40, 'wiggle', '咕咕叫的母雞'],
      ['mejiro', '綠繡眼', 34, 'wiggle', '眼睛有一圈白的小綠鳥'],
    ],
    ['goldPupa', '金色蝶蛹', 30, 'shine', '大白斑蝶的蛹是金色的'],
  ),
  ...of(
    'craft',
    [
      ['glassCup', '琉球玻璃杯', 30, 'hop', '帶著小氣泡的玻璃杯'],
      ['vase', '壺屋燒花瓶', 40, 'hop', '那霸壺屋做的陶器'],
      ['curtain', '紅型布簾', 64, 'swing', '染著鮮豔花紋的紅型布'],
      ['cushion', '芭蕉布坐墊', 50, 'hop', '芭蕉纖維織的布做的坐墊'],
      ['lacquer', '漆器盒', 42, 'hop', '紅色的琉球漆器'],
      ['loom', '織布機', 60, 'hop', '一條線一條線織出布'],
      ['fan', '紅型扇子', 44, 'sway', '畫著紅型花紋的扇子'],
    ],
    ['glassLamp', '琉球玻璃吊燈', 46, 'shine', '彩色玻璃做的燈'],
  ),
  ...of(
    'island',
    [
      ['palm', '椰子樹', 96, 'sway', '海邊的椰子樹'],
      ['starSand', '星砂瓶', 30, 'hop', '裝著星星形狀的沙'],
      ['lighthouse', '燈塔', 60, 'hop', '晚上替船指路'],
      ['lily', '百合花盆', 44, 'sway', '春天開滿伊江島的白百合'],
      ['buffaloCart', '水牛車', 84, 'wiggle', '在竹富島坐水牛車逛村子'],
      ['deer', '小鹿', 50, 'wiggle', '慶良間群島的小鹿'],
      ['ferry', '渡輪', 76, 'sway', '載大家去離島的船'],
    ],
    ['southernCross', '南十字星燈', 46, 'shine', '在波照間島看得到南十字星'],
  ),
];

export const DECOR_BY_ID: Record<string, Decor> = Object.fromEntries(DECOR.map((d) => [d.id, d]));

/** The three every house starts with */
export const STARTER_DECOR = DECOR.filter((d) => d.series === null).map((d) => d.id);

export const isDecor = (id: string): boolean => id in DECOR_BY_ID;

/** Whether a decoration is the player's: one of the starters, or turned out of a machine */
export const hasDecor = (id: string, decor: readonly string[]): boolean => DECOR_BY_ID[id]?.series === null || decor.includes(id);

// ---------- the gacha machines' rounds ----------

/** Round 1 turns out the series' shisa; once every one is collected, round 2 turns out its decorations */
export const roundOf = (series: Series['id'], owned: readonly string[]): 1 | 2 => (VARIANTS.some((v) => v.series === series && !owned.includes(v.id)) ? 1 : 2);

const decorOf = (series: Series['id']) => DECOR.filter((d) => d.series === series);

/** What is still in a machine: shisa in round 1, decorations in round 2 */
export function leftIn(series: Series['id'], owned: readonly string[], decor: readonly string[]): number {
  if (roundOf(series, owned) === 1) return VARIANTS.filter((v) => v.series === series && !owned.includes(v.id)).length;
  return decorOf(series).filter((d) => !decor.includes(d.id)).length;
}

/** All of a machine's round-2 decorations */
export const DECOR_PER_MACHINE = 8;

/** Coins for one capsule: one in round 1, and in round 2 for children under 6; two in round 2 for everyone else */
export const priceOf = (series: Series['id'], owned: readonly string[], age: Age | null): number =>
  roundOf(series, owned) === 2 && age !== null && age !== 'little' ? 2 : 1;

/** Weighted draw among the machine's decorations not yet turned out, like the shisa: never a repeat, the rare one less often */
export function drawDecor(series: Series['id'], decor: readonly string[], random: () => number = Math.random): Decor | null {
  const pool = decorOf(series).filter((d) => !decor.includes(d.id));
  if (!pool.length) return null;
  const weights = pool.map((d) => (d.rare ? 1 : 3));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
