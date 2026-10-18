import type { PieceType } from '../engine';
import type { Element } from './zones';

export const PIECE_NAMES: Record<PieceType, string> = {
  cube: '紅型方塊',
  tower: '赤瓦塔',
  stair: '琉璃階梯',
  bridge: '紅芋拱門',
  ladder: '竹梯',
  spring: '跳跳貝',
  long: '石拱橋',
  slide: '溜滑梯',
  vine: '藤蔓',
};

export type Mechanism = 'urchin' | 'tide' | 'gate' | 'star';
export type IntroKey = PieceType | Mechanism;

export const MECHANISM_NAMES: Record<Mechanism, string> = { urchin: '海膽', tide: '漲潮', gate: '石門', star: '星砂' };

/** One-line rules shown the first time a piece or mechanism appears */
export const RULES: Record<IntroKey, string> = {
  cube: '最基本的積木，上面可以走，也可以再疊東西。「紅型」是沖繩花布的名字，不是紅色喔。',
  tower: '兩格高的塔，上面可以走。',
  stair: '可以一階一階往上走。橫放、直放、轉方向都可以。',
  bridge: '上面可以走，下面也可以鑽過去。',
  ladder: '西薩可以在裡面爬上爬下，頂上也能走。',
  spring: '站上去會彈起來，可以跳上一兩格；從高處跳下來也會被接住。上面太軟，不能疊積木。',
  long: '三格寬的石橋，中間可以鑽過去。要放穩：兩頭都有東西撐，或是正中間撐住。',
  slide: '一邊是平台，一邊是溜滑梯。西薩只能從高的那頭往下溜，不能往上爬。',
  vine: '藤蔓要掛在積木的下面，不能放在地上。西薩可以抓著藤蔓爬上爬下。',
  urchin: '有海膽的地方不能踩。放一塊積木把牠蓋住就可以了。',
  tide: '每放兩塊積木，海水就漲高一格，地面會被淹掉。浪費步數，海水就漲得更高。',
  gate: '把積木壓在發光的壓板上，石門就會打開。西薩太輕了，自己壓不動。',
  star: '西薩要先走到閃亮的星砂那裡把它撿起來，才能去找朋友。',
};

export const isPiece = (k: IntroKey): k is PieceType => k in PIECE_NAMES;

export const elementName = (e: Element): string => (isPiece(e) ? PIECE_NAMES[e] : MECHANISM_NAMES[e as Mechanism]);

/** What a stop has, for the "next stop" card */
export const stopLine = (els: readonly Element[]): string => (els.length ? `有${els.map(elementName).join('、')}` : '專心搭路');
