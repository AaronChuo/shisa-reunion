// A postcard for Okinawa and for each zone: what the place is like, its culture or its story, in a few sentences a
// parent can read aloud. Facts here were checked; keep any new ones just as careful.

export type PlaceId =
  | 'okinawa'
  | 'naha'
  | 'chatan'
  | 'yomitan'
  | 'onna'
  | 'motobu'
  | 'kouri'
  | 'yanbaru'
  | 'kaichu'
  | 'nakagusuku'
  | 'nanjo'
  | 'shuri'
  | 'kumejima'
  | 'miyako'
  | 'ishigaki';

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
    name: '那霸市',
    sights: ['國際通', '路口的石頭西薩', '紅芋塔小店'],
    story:
      '那霸是沖繩最大的城市，飛機和大船都從這裡進出。熱鬧的國際通大約有一英里長，兩旁都是賣紅芋塔、西薩和三線的小店。從那霸的港口坐船，就能去附近美麗的小島。',
  },
  chatan: {
    id: 'chatan',
    name: '美國村',
    sights: ['彩色的美式房子', '海濱步道', '日落海灘'],
    story:
      '美國村在北谷町的海邊。這一帶以前是美軍用的土地，還給沖繩以後，蓋成了一座彩色的美式小鎮，有好多商店和餐廳。旁邊的日落海灘面向西邊，傍晚可以看到太陽慢慢沉進海裡。',
  },
  yomitan: {
    id: 'yomitan',
    name: '讀谷村',
    sights: ['殘波岬燈塔', '紅芋田', '陶器之里'],
    story:
      '讀谷村是全日本人口最多的「村」。這裡種了很多紫色的紅芋，還有許多陶藝工坊聚在一起的「陶器之里」。殘波岬的白色燈塔站在高高的懸崖上，可以看到好遠好遠的大海。',
  },
  onna: {
    id: 'onna',
    name: '恩納村',
    sights: ['萬座毛', '像象鼻子的岩石', '藍色的海'],
    story:
      '恩納村在沖繩本島西海岸的中間，海邊有好多漂亮的海灘。萬座毛是長滿青草的懸崖，崖邊有一塊岩石，看起來像大象的鼻子。1726 年，琉球國王來到這裡，稱讚這片草原大到可以讓一萬個人坐下，所以叫「萬座毛」。',
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
  yanbaru: {
    id: 'yanbaru',
    name: '沖繩山原',
    sights: ['大森林', '山原秧雞', '邊戶岬'],
    story:
      '「山原（やんばる）」是沖繩本島北部山多、樹多的大森林。這裡住著幾乎不會飛的山原秧雞，全世界只有這裡才有。2021 年，山原的森林和西表島一起成為世界自然遺產。站在最北邊的邊戶岬，天氣好時看得到鹿兒島的與論島。',
  },
  kaichu: {
    id: 'kaichu',
    name: '海中道路',
    sights: ['海上的長路', '平安座島', '濱比嘉島'],
    story:
      '海中道路是蓋在淺海上的長路，大約 4.7 公里，連著沖繩本島和平安座島，開車就像在海面上奔跑。還沒有這條路的時候，大家要等到退潮，才能走過淺淺的海到對面的島。過了平安座島，還能再過橋去濱比嘉島和伊計島。',
  },
  nakagusuku: {
    id: 'nakagusuku',
    name: '中城城跡',
    sights: ['彎彎的石牆', '石拱門', '山丘上的古城'],
    story:
      '中城城跡是建在高高山丘上的古城，彎彎的石牆像波浪一樣。大約 1440 年，建城高手護佐丸從讀谷村的座喜味城搬來這裡，把城蓋得更大。後來來到沖繩的美國培理艦隊，也稱讚它的石拱門非常精巧。',
  },
  nanjo: {
    id: 'nanjo',
    name: '南城市',
    sights: ['齋場御嶽', '神之島久高島', '彎彎的大橋'],
    story:
      '南城市在沖繩本島的東南邊。這裡的「齋場御嶽」是琉球王國最神聖的地方，2000 年成為世界遺產。從那裡往海上看，就是久高島：傳說琉球的祖先神從海的另一邊來到這座島，開始建造沖繩，所以大家叫它「神之島」。',
  },
  shuri: {
    id: 'shuri',
    name: '首里城',
    sights: ['紅色正殿', '守禮門', '琉球國王'],
    story:
      '首里城是琉球國王住了大約 450 年的城堡，前面的守禮門還被印在日本的兩千元鈔票上。2019 年一場大火燒掉了紅色的正殿，大家一起努力重建，2026 年秋天又看得到它了。',
  },
  kumejima: {
    id: 'kumejima',
    name: '久米島',
    sights: ['果之濱的白沙', '疊石', '退潮才看得到'],
    story:
      '久米島在沖繩本島的西邊，大約 100 公里遠。島的東南邊海上有一條全是白沙的「果之濱」，長約 7 公里。旁邊奧武島的海邊有「疊石」，退潮時會露出像烏龜殼一樣的五角形、六角形石頭。',
  },
  miyako: {
    id: 'miyako',
    name: '宮古島',
    sights: ['伊良部大橋', '宮古藍的海', '岬角上的燈塔'],
    story:
      '宮古島在沖繩本島的西南邊，大約 300 公里遠。這裡的海藍得特別漂亮，大家叫它「宮古藍」。2015 年蓋好的伊良部大橋長 3540 公尺，是日本不用付錢就能通過的橋裡最長的一座。',
  },
  ishigaki: {
    id: 'ishigaki',
    name: '石垣島',
    sights: ['川平灣', '玻璃船', '南十字星'],
    story:
      '石垣島在沖繩本島西南邊大約 400 公里，是八重山群島的中心。川平灣的海有好幾種藍色，可以坐玻璃船看海底的珊瑚和魚。從石垣島坐船大約十分鐘就到竹富島；冬天到初夏的晚上，還有機會在南邊低低的天空看到南十字星。',
  },
};

/** Postcards in collection order: Okinawa first, then the zones as you travel */
export const PLACE_ORDER: PlaceId[] = [
  'okinawa',
  'naha',
  'chatan',
  'yomitan',
  'onna',
  'motobu',
  'kouri',
  'yanbaru',
  'kaichu',
  'nakagusuku',
  'nanjo',
  'shuri',
  'kumejima',
  'miyako',
  'ishigaki',
];

export const placeSeen = (id: PlaceId) => `place:${id}`;
