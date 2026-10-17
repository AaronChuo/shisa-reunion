// A postcard for Okinawa and for each zone: what the place is like, its culture or its story, in a few sentences a
// parent can read aloud. Facts here were checked; keep any new ones just as careful.

export type PlaceId = 'okinawa' | 'naha' | 'yomitan' | 'motobu' | 'kouri' | 'taketomi' | 'iriomote' | 'shuri';

export interface Place {
  id: PlaceId;
  name: string;
  /** Two or three things the picture shows, as small labels */
  sights: string[];
  story: string;
}

export const PLACES: Record<PlaceId, Place> = {
  okinawa: {
    id: 'okinawa',
    name: '沖繩',
    sights: ['160 多個島', '琉球王國', '看得到台灣'],
    story:
      '沖繩在台灣的東北邊，從台灣坐飛機大約一個半小時就到了。這裡由 160 多個大大小小的島組成，很久以前是「琉球王國」，有自己的國王、語言和音樂。最西邊的與那國島，天氣好的時候還看得到台灣喔！',
  },
  naha: {
    id: 'naha',
    name: '那霸港',
    sights: ['國際通', '大船和飛機', '坐船去小島'],
    story:
      '那霸是沖繩最大的城市，飛機和大船都從這裡進出。熱鬧的國際通大約有一英里長，兩旁都是賣紅芋塔、西薩和三線的小店。從那霸的港口坐船，就能去附近美麗的小島。',
  },
  yomitan: {
    id: 'yomitan',
    name: '讀谷村',
    sights: ['殘波岬燈塔', '紅芋田', '陶器之里'],
    story:
      '讀谷村是全日本人口最多的「村」。這裡種了很多紫色的紅芋，還有許多陶藝工坊聚在一起的「陶器之里」。殘波岬的白色燈塔站在高高的懸崖上，可以看到好遠好遠的大海。',
  },
  motobu: {
    id: 'motobu',
    name: '美麗海',
    sights: ['美麗海水族館', '鯨鯊', '鬼蝠魟'],
    story:
      '美麗海在沖繩本島北部的本部半島，有一座很大的美麗海水族館。巨大的水槽「黑潮之海」裡，鯨鯊和鬼蝠魟慢慢地游來游去。水族館旁邊的海灘，海水清澈得看得到小魚。',
  },
  kouri: {
    id: 'kouri',
    name: '古宇利島',
    sights: ['古宇利大橋', '戀之島', '心形岩'],
    story:
      '古宇利島要經過將近兩公里長的古宇利大橋才到得了，橋下的海是漂亮的藍綠色。島上流傳著沖繩版「亞當和夏娃」的故事，所以又叫「戀之島」，海邊還有一塊心形的岩石。',
  },
  taketomi: {
    id: 'taketomi',
    name: '竹富島',
    sights: ['紅瓦和石牆', '水牛車', '星砂'],
    story: '竹富島保留著從前的沖繩村落：紅瓦屋頂、珊瑚石頭堆成的矮牆和白沙小路，屋頂上站著各式各樣的西薩。大家會坐著水牛拉的車慢慢逛，再到皆治海灘找星砂。',
  },
  iriomote: {
    id: 'iriomote',
    name: '西表島',
    sights: ['紅樹林', '獨木舟', '西表山貓'],
    story:
      '西表島大約九成都是森林，河口長滿了紅樹林，可以划獨木舟從樹根中間穿過去。島上住著全世界只有這裡才有的西表山貓。2021 年，這裡和沖繩北部的森林一起成為世界自然遺產。',
  },
  shuri: {
    id: 'shuri',
    name: '首里城',
    sights: ['紅色正殿', '守禮門', '琉球國王'],
    story:
      '首里城是琉球國王住了大約 450 年的城堡，前面的守禮門還被印在日本的兩千元鈔票上。2019 年一場大火燒掉了紅色的正殿，大家一起努力重建，2026 年秋天又看得到它了。',
  },
};

/** Postcards in collection order: Okinawa first, then the zones as you travel */
export const PLACE_ORDER: PlaceId[] = ['okinawa', 'naha', 'yomitan', 'motobu', 'kouri', 'taketomi', 'iriomote', 'shuri'];

export const placeSeen = (id: PlaceId) => `place:${id}`;
