// Postcards: one for Okinawa and three for each zone, each an illustration of a classic sight with a few things to spot
// in it and a few sentences a parent can read aloud. A zone's first card tells the zone itself. Facts here were checked;
// keep any new ones just as careful.

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

export interface Card {
  /** The sight the picture shows */
  name: string;
  /** Two or three things to spot in the picture, as small labels */
  sights: string[];
  story: string;
}

export interface Place {
  id: PlaceId;
  name: string;
  /** Okinawa's one card, or a zone's three in the order they are earned */
  cards: Card[];
}

export const PLACES: Record<PlaceId, Place> = {
  okinawa: {
    id: 'okinawa',
    name: '沖繩',
    cards: [
      {
        name: '沖繩',
        sights: ['160 多個島', '琉球王國', '看得到台灣'],
        story:
          '沖繩在台灣的東北邊，從台灣坐飛機大約一個半小時就到了。這裡由 160 多個大大小小的島組成，很久以前是「琉球王國」，有自己的國王、語言和音樂。最西邊的與那國島，天氣好的時候還看得到台灣喔！',
      },
    ],
  },
  naha: {
    id: 'naha',
    name: '那霸市',
    cards: [
      {
        name: '國際通',
        sights: ['門口的西薩', '燈籠', '椰子樹'],
        story:
          '那霸是沖繩最大的城市，飛機和大船都從這裡進出。熱鬧的國際通大約有一英里長，兩旁都是賣紅芋塔、西薩和三線的小店。從那霸的港口坐船，就能去附近美麗的小島。',
      },
      {
        name: '波上宮',
        sights: ['懸崖上的神社', '白色沙灘', '清澈的海'],
        story: '波上宮蓋在海邊高高的懸崖上，是保佑出海平安的神社。懸崖下的波之上海灘，是那霸市裡唯一可以下水游泳的海灘。',
      },
      {
        name: '瀨長島',
        sights: ['降落的飛機', '白色的小店', '夕陽'],
        story: '瀨長島就在那霸機場旁邊，開車就能過去。山坡上一層一層的白色小店，坐在這裡，可以看到飛機從頭頂上飛過、準備降落。',
      },
    ],
  },
  chatan: {
    id: 'chatan',
    name: '美國村',
    cards: [
      {
        name: '美國村',
        sights: ['燈飾', '彩色的房子', '海邊步道'],
        story:
          '美國村在北谷町的海邊。這一帶以前是美軍用的土地，還給沖繩以後，蓋成了一座彩色的美式小鎮，有好多商店和餐廳。旁邊的日落海灘面向西邊，傍晚可以看到太陽慢慢沉進海裡。',
      },
      {
        name: '日落海灘',
        sights: ['夕陽', '椰子樹', '防波堤'],
        story: '日落海灘在美國村旁邊，面向西邊的大海。傍晚太陽慢慢沉進海裡，天空變成橘色、粉紅色和紫色，好多人坐在海堤上看夕陽。',
      },
      {
        name: '阿拉哈海灘',
        sights: ['大木船', '溜滑梯', '長長的沙灘'],
        story: '阿拉哈海灘公園有一大片長長的沙灘。旁邊的草地上有一艘大木船造型的遊樂場，可以爬上爬下、走木橋，還能溜滑梯下來。',
      },
    ],
  },
  yomitan: {
    id: 'yomitan',
    name: '讀谷村',
    cards: [
      {
        name: '殘波岬',
        sights: ['白色燈塔', '懸崖', '大浪'],
        story:
          '讀谷村是全日本人口最多的「村」。這裡種了很多紫色的紅芋，還有許多陶藝工坊聚在一起的「陶器之里」。殘波岬的白色燈塔站在高高的懸崖上，可以看到好遠好遠的大海。',
      },
      {
        name: '座喜味城跡',
        sights: ['石拱門', '彎彎的城牆', '遠方的海'],
        story: '座喜味城是大約 600 年前，建城高手護佐丸蓋的城。石灰岩砌的城牆彎彎曲曲，像波浪一樣；2000 年和首里城等地方一起成為世界遺產。',
      },
      {
        name: '陶器之里',
        sights: ['長長的窯', '陶碗', '紅瓦屋頂'],
        story: '陶器之里聚集了好多做陶器的工坊。沿著山坡往上蓋的長長窯叫做「登窯」，用柴火一次燒好很多碗和盤子。',
      },
    ],
  },
  onna: {
    id: 'onna',
    name: '恩納村',
    cards: [
      {
        name: '萬座毛',
        sights: ['象鼻岩', '草地懸崖', '藍色的海'],
        story:
          '恩納村在沖繩本島西海岸的中間，海邊有好多漂亮的海灘。萬座毛是長滿青草的懸崖，崖邊有一塊岩石，看起來像大象的鼻子。1726 年，琉球國王來到這裡，稱讚這片草原大到可以讓一萬個人坐下，所以叫「萬座毛」。',
      },
      {
        name: '青之洞窟',
        sights: ['洞口', '發亮的藍色海水', '熱帶魚'],
        story: '真榮田岬的海邊有一個「青之洞窟」。陽光穿過海水照進洞裡，整個洞會發出亮亮的藍光，很多人戴著呼吸管游進去看。',
      },
      {
        name: '月亮海灘',
        sights: ['彎彎的沙灘', '椰子樹', '扶桑花'],
        story: '月亮海灘的白色沙灘彎彎的，像天上的一彎月亮，所以叫這個名字。海灣裡的水淺淺的，浪也很小，很適合小朋友玩水。',
      },
    ],
  },
  motobu: {
    id: 'motobu',
    name: '美麗海',
    cards: [
      {
        name: '美麗海水族館',
        sights: ['鯨鯊', '鬼蝠魟', '看魚的小朋友'],
        story:
          '美麗海在沖繩本島北部的本部半島，有一座很大的美麗海水族館。巨大的水槽「黑潮之海」裡，鯨鯊和鬼蝠魟慢慢地游來游去。水族館旁邊的海灘，海水清澈得看得到小魚。',
      },
      {
        name: '翡翠海灘',
        sights: ['伊江島', '椰子葉', '白沙'],
        story: '翡翠海灘在美麗海水族館旁邊的公園裡，海水從淺綠到深藍，像寶石一樣。天氣好時，海上看得到伊江島和島上尖尖的山。',
      },
      {
        name: '備瀨福木林道',
        sights: ['綠色隧道', '白沙小路', '盡頭的海'],
        story: '備瀨的村子裡種了上萬棵福木，排成一條條綠色隧道。福木的葉子又厚又密，可以幫房子擋住颱風的強風，夏天走在下面也很涼快。',
      },
    ],
  },
  kouri: {
    id: 'kouri',
    name: '古宇利島',
    cards: [
      {
        name: '古宇利大橋',
        sights: ['長長的大橋', '綠色小島', '珊瑚礁'],
        story:
          '古宇利島要經過將近兩公里長的古宇利大橋才到得了，橋下的海是漂亮的藍綠色。島上流傳著沖繩版「亞當和夏娃」的故事，所以又叫「戀之島」，海邊還有一塊心形的岩石。',
      },
      {
        name: '心形岩',
        sights: ['愛心形的岩石', '浪花', '淺淺的海'],
        story: '古宇利島北邊的海灘上，淺水裡站著兩塊大岩石。從某個角度看，其中一塊剛好是愛心的形狀，所以大家叫它「心形岩」。',
      },
      {
        name: '古宇利海洋塔',
        sights: ['白色的塔', '古宇利大橋', '紅花'],
        story: '古宇利海洋塔是山丘上的白色瞭望塔，要坐自動駕駛的小車上去。從上面往下看，藍綠色的海和長長的古宇利大橋都看得清清楚楚。',
      },
    ],
  },
  yanbaru: {
    id: 'yanbaru',
    name: '沖繩山原',
    cards: [
      {
        name: '邊戶岬',
        sights: ['懸崖', '大浪', '遠方的島'],
        story:
          '「山原（やんばる）」是沖繩本島北部山多、樹多的大森林。這裡住著幾乎不會飛的山原秧雞，全世界只有這裡才有。2021 年，山原的森林和西表島一起成為世界自然遺產。站在最北邊的邊戶岬，天氣好時看得到鹿兒島的與論島。',
      },
      {
        name: '大石林山',
        sights: ['尖尖的石頭', '木頭步道', '遠方的海'],
        story: '大石林山在沖繩本島的最北邊，好多尖尖的灰色石頭從森林裡冒出來。這些是很久很久以前的石灰岩，被雨水一點一點溶出來，走在步道上就像走進石頭森林。',
      },
      {
        name: '山原秧雞',
        sights: ['紅色的嘴', '條紋的肚子', '蕨類'],
        story: '山原秧雞是 1981 年才被科學家發現、取名的鳥。牠幾乎不會飛，白天在森林的地上走來走去找東西吃，晚上會爬到樹上睡覺。',
      },
    ],
  },
  kaichu: {
    id: 'kaichu',
    name: '海中道路',
    cards: [
      {
        name: '海中道路',
        sights: ['海上的長路', '紅色的橋', '沙洲'],
        story:
          '海中道路是蓋在淺海上的長路，大約 4.7 公里，連著沖繩本島和平安座島，開車就像在海面上奔跑。還沒有這條路的時候，大家要等到退潮，才能走過淺淺的海到對面的島。過了平安座島，還能再過橋去濱比嘉島和伊計島。',
      },
      {
        name: '濱比嘉島',
        sights: ['漁船', '紅瓦屋頂', '石牆'],
        story: '濱比嘉島是一座安靜的小島，有小漁港和紅瓦屋頂的老房子。傳說琉球的祖先神，曾經住在這座島的山洞裡。',
      },
      {
        name: '伊計島',
        sights: ['清澈的海', '圓圓的岩石', '白沙'],
        story: '伊計島在海中道路的最遠處，要再過一座橋才到。這裡的海水清澈得看得到底，岸邊有圓圓的大岩石，夏天很多人來游泳。',
      },
    ],
  },
  nakagusuku: {
    id: 'nakagusuku',
    name: '中城城跡',
    cards: [
      {
        name: '石拱門',
        sights: ['石拱門', '石階', '拱門裡的藍天'],
        story:
          '中城城跡是建在高高山丘上的古城，彎彎的石牆像波浪一樣。大約 1440 年，建城高手護佐丸從讀谷村的座喜味城搬來這裡，把城蓋得更大。後來來到沖繩的美國培理艦隊，也稱讚它的石拱門非常精巧。',
      },
      {
        name: '城牆',
        sights: ['一層層的城牆', '遠方的海', '綠草'],
        story: '中城城的城牆一層一層往山上蓋。有的用自然的石頭堆起來，有的把石頭切成方塊，還有的拼得像烏龜殼一樣，不同時代的砌法都看得到。',
      },
      {
        name: '中村家住宅',
        sights: ['屋頂上的西薩', '石牆', '紅瓦屋頂'],
        story: '中村家住宅是兩百多年前蓋的大農家，有紅瓦屋頂、厚厚的石牆，四周種著高大的福木擋颱風。大門進去還有一面石頭屏風牆，從外面看不到屋子裡面。',
      },
    ],
  },
  nanjo: {
    id: 'nanjo',
    name: '南城市',
    cards: [
      {
        name: '齋場御嶽',
        sights: ['三角形的岩縫', '遠方的久高島', '森林'],
        story:
          '南城市在沖繩本島的東南邊。這裡的「齋場御嶽」是琉球王國最神聖的地方，2000 年成為世界遺產。從那裡往海上看，就是久高島：傳說琉球的祖先神從海的另一邊來到這座島，開始建造沖繩，所以大家叫它「神之島」。',
      },
      {
        name: '尼萊卡奈橋',
        sights: ['彎彎的大橋', '藍色的海', '海上的島'],
        story: '尼萊卡奈（ニライカナイ）橋從山上畫一個大彎，一路往海邊下去。「尼萊卡奈」是沖繩話，意思是大海另一邊、神住的美好地方。',
      },
      {
        name: '玉泉洞',
        sights: ['鐘乳石', '石筍', '藍綠色的水池'],
        story: '玉泉洞是大約 5 公里長的鐘乳石洞，天花板垂著數不清的鐘乳石，地上長出一根根石筍。石頭一年只長一點點，花了好久好久才變成現在這樣。',
      },
    ],
  },
  shuri: {
    id: 'shuri',
    name: '首里城',
    cards: [
      {
        name: '守禮門',
        sights: ['兩層紅屋頂', '紅色柱子', '石牆'],
        story:
          '首里城是琉球國王住了大約 450 年的城堡，前面的守禮門還被印在日本的兩千元鈔票上。2019 年一場大火燒掉了紅色的正殿，大家一起努力重建，2026 年秋天又看得到它了。',
      },
      {
        name: '正殿',
        sights: ['金色的龍頭', '龍柱', '紅白條紋的廣場'],
        story: '正殿是琉球國王處理國家大事的地方。屋頂兩端有金色的龍頭，門口站著兩根龍柱，前面的廣場鋪著一條條紅色和白色的磚。',
      },
      {
        name: '金城町石疊道',
        sights: ['石板路', '老石牆', '大樹'],
        story: '金城町石疊道是大約 500 年前、琉球國王的時代鋪好的石板路，從首里城往山下走。石板被走了好多年，變得光光亮亮的，兩旁是老石牆和紅瓦房子。',
      },
    ],
  },
  kumejima: {
    id: 'kumejima',
    name: '久米島',
    cards: [
      {
        name: '疊石',
        sights: ['烏龜殼一樣的石頭', '小水池', '遠方的島'],
        story:
          '久米島在沖繩本島的西邊，大約 100 公里遠。島的東南邊海上有一條全是白沙的「果之濱」，長約 7 公里。旁邊奧武島的海邊有「疊石」，退潮時會露出像烏龜殼一樣的五角形、六角形石頭。',
      },
      {
        name: '果之濱',
        sights: ['白色沙洲', '藍色的海', '遠方的久米島'],
        story: '果之濱是一條只有白沙的沙洲，上面沒有房子也沒有樹，要坐船才去得了。站在沙洲中間，四周全是藍得發亮的海。',
      },
      {
        name: '比屋定斷崖',
        sights: ['高高的懸崖', '展望台', '夕陽'],
        story: '比屋定斷崖在久米島的東北邊，是大約 200 公尺高的懸崖。站在上面的展望台，可以看到遠方的果之濱和藍色的大海。',
      },
    ],
  },
  miyako: {
    id: 'miyako',
    name: '宮古島',
    cards: [
      {
        name: '伊良部大橋',
        sights: ['長長的大橋', '珊瑚', '透明的海'],
        story:
          '宮古島在沖繩本島的西南邊，大約 300 公里遠。這裡的海藍得特別漂亮，大家叫它「宮古藍」。2015 年蓋好的伊良部大橋長 3540 公尺，是日本不用付錢就能通過的橋裡最長的一座。',
      },
      {
        name: '東平安名崎',
        sights: ['白色百合', '燈塔', '細長的岬角'],
        story: '東平安名崎在宮古島最東邊，細細長長地伸進海裡大約 2 公里，盡頭有一座白色燈塔。四月左右，草地上會開滿白色的鐵砲百合。',
      },
      {
        name: '砂山海灘',
        sights: ['岩石拱門', '白沙', '浪花'],
        story: '要先爬過一座白色的沙丘，才看得到砂山海灘。海邊有一塊被海浪打穿的大岩石，變成一座天然的拱門。',
      },
    ],
  },
  ishigaki: {
    id: 'ishigaki',
    name: '石垣島',
    cards: [
      {
        name: '川平灣',
        sights: ['玻璃船', '綠色小島', '白沙'],
        story:
          '石垣島在沖繩本島西南邊大約 400 公里，是八重山群島的中心。川平灣的海有好幾種藍色，可以坐玻璃船看海底的珊瑚和魚。從石垣島坐船大約十分鐘就到竹富島；冬天到初夏的晚上，還有機會在南邊低低的天空看到南十字星。',
      },
      {
        name: '平久保崎燈塔',
        sights: ['白色燈塔', '海上的小島', '草地'],
        story: '平久保崎在石垣島最北邊，綠色的草地上站著白色的燈塔。燈塔前面的海上有一座小小的無人島，是海鳥生小寶寶的地方。',
      },
      {
        name: '竹富島',
        sights: ['水牛車', '屋頂上的西薩', '九重葛'],
        story: '從石垣島坐船大約十分鐘就到竹富島。村子裡有白沙小路、石牆和紅瓦屋頂，屋頂上常常坐著西薩，還可以坐水牛車慢慢逛。',
      },
    ],
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

/** Marks a zone's first card as earned (and, before v0.29, a postcard as read) */
export const placeSeen = (id: PlaceId) => `place:${id}`;

/** What earns each of a zone's cards, shown on the cards still to come */
export const CARD_NEEDS = ['過第一站', '走完 2 次', '走完 3 次'];

/** Every card there is to collect */
export const CARD_TOTAL = PLACE_ORDER.reduce((n, id) => n + PLACES[id].cards.length, 0);

/**
 * How many of a place's cards are in the collection. Okinawa's comes free; a zone's first comes with its first stop
 * cleared, the second and third with the zone's second and third full journey.
 */
export function cardsEarned(id: PlaceId, seen: string[], clears: Record<string, number>): number {
  if (id === 'okinawa') return 1;
  const c = clears[id] ?? 0;
  if (c >= 3) return 3;
  if (c >= 2) return 2;
  return c >= 1 || seen.includes(placeSeen(id)) ? 1 : 0;
}

/** A card's picture, large for the postcard or small for the collection grid; Okinawa's is drawn instead */
export const cardUrl = (id: PlaceId, n: number, small = false) => `/postcards/${id}/${n + 1}${small ? '-small' : ''}.webp`;
