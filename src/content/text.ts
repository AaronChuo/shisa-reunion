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
  bar: '金楚糕',
  corner: '石牆角',
  parasol: '海灘陽傘',
  wave: '浪花',
};

export type Mechanism = 'urchin' | 'tide' | 'gate' | 'star';
export type IntroKey = PieceType | Mechanism;

export const MECHANISM_NAMES: Record<Mechanism, string> = { urchin: '海膽', tide: '漲潮', gate: '石門', star: '星砂' };

/** One-line rules shown the first time a piece or mechanism appears */
export const RULES: Record<IntroKey, string> = {
  cube: '最基本的積木，上面可以走，也可以再疊東西。「紅型」是沖繩花布的名字，不是紅色喔。',
  tower: '兩格高的塔，上面可以走。也可以橫躺下來。',
  stair: '可以一階一階往上走。橫放、直放、轉方向都可以。',
  bridge: '上面可以走，下面也可以鑽過去。',
  ladder: '西薩可以在裡面爬上爬下，頂上也能走。',
  spring: '站上去會彈起來，可以跳上一兩格；從高處跳下來也會被接住。上面太軟，不能疊積木。',
  long: '三格寬的石橋，下面可以鑽過去。兩頭都要有東西撐住，才放得穩。',
  slide: '一邊是平台，一邊是溜滑梯。西薩只能從高的那頭往下溜，不能往上爬。換個方向，就變成往另一邊溜。',
  vine: '藤蔓要掛在積木的下面，不能放在地上。西薩可以抓著藤蔓爬上爬下。',
  bar: '長長的金楚糕，是沖繩的傳統小餅乾。可以橫放也可以直放；橫放的時候，要撐住中間或兩頭才不會翻倒。',
  corner: 'L 形的珊瑚石牆，可以轉四個方向。疊兩格的那一邊站穩了，凸出去的那一格懸空也不會倒。',
  parasol: 'T 形的海灘陽傘，可以轉四個方向。撐開的時候，只要傘柄站穩，傘面兩邊懸空也不會倒。',
  wave: '像海浪一樣彎彎的積木，可以轉方向，也可以翻面。',
  urchin: '有海膽的地方不能踩。放一塊積木把牠蓋住就可以了。',
  tide: '放好兩塊積木，海水就會漲上來，把地面淹掉。西薩要走在高的地方。',
  gate: '把積木壓在發光的壓板上，石門就會打開。西薩太輕了，自己壓不動。',
  star: '西薩要先走到閃亮的星砂那裡把它撿起來，才能去找朋友。',
};

export const isPiece = (k: IntroKey): k is PieceType => k in PIECE_NAMES;

export const elementName = (e: Element): string => (isPiece(e) ? PIECE_NAMES[e] : MECHANISM_NAMES[e as Mechanism]);

/** What a stop has, for the "next stop" card */
export const stopLine = (els: readonly Element[]): string => (els.length ? `有${els.map(elementName).join('、')}` : '專心搭路');
