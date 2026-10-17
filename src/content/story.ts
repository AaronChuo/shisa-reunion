// The opening story, "西薩的故事": shown the first time the game opens and again from the map. It introduces the
// name 西薩, the two jobs (open mouth sets out, closed mouth waits) and the goal: build a path so they meet again.
// Every line here is read aloud, so keep sentences short.

export type StoryPageId = 'meet' | 'pair' | 'storm' | 'build' | 'go';

export interface StoryPage {
  id: StoryPageId;
  /** Said when the page opens */
  say: string;
  /** Said once the child has done the page's little action (tap the shisa, blow the typhoon) */
  after?: string;
}

export const STORY_TITLE = '西薩的故事';

export const STORY: StoryPage[] = [
  { id: 'meet', say: '沖繩的紅瓦屋頂上，住著兩隻守護家園的獅子。點點看牠們！', after: '牠們的名字叫做「西薩」！' },
  { id: 'pair', say: '張開嘴的西薩，把福氣接進來；閉著嘴的西薩，把福氣守住。牠們是最要好的朋友。' },
  { id: 'storm', say: '有一天，颱風來了！用手指撥一撥，吹起大風！', after: '呼——兩隻西薩被吹散了！' },
  { id: 'build', say: '別擔心！我們用積木搭一條路，讓兩隻西薩再見面。' },
  { id: 'go', say: '準備好了嗎？一起出發，幫西薩搭路吧！' },
];

/** What a shisa says when tapped, and when the two meet again */
export const SHISA_HELLO = '我是西薩！';
export const SHISA_CHEER = '西薩團聚了！';
