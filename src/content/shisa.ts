export type Pattern =
  | 'dots'
  | 'stripes'
  | 'shell'
  | 'stars'
  | 'spots'
  | 'bumps'
  | 'crumbs'
  | 'crystals'
  | 'flowers'
  | 'scales'
  | 'burst'
  | 'drum'
  | 'stone'
  | 'masonry'
  | 'shards'
  | 'minsa'
  | 'patches'
  | 'bands'
  | 'bubbles'
  | 'cracks'
  | 'noodles'
  | 'confetti'
  | 'grapes'
  | 'crosshatch'
  | 'waves'
  | 'rope'
  | 'fringe'
  | 'darkspots'
  | 'barred'
  | 'grooves'
  | 'swirl'
  | 'gold'
  | 'plaid'
  | 'kasuri';
export type Hat = 'starfish' | 'leaf' | 'bean' | 'band' | 'crown' | 'rope' | 'shell' | 'pearl' | 'leaves' | 'flag' | 'hanagasa' | 'ears' | 'claws' | 'spout';

export interface Series {
  id: 'trad' | 'sea' | 'food' | 'fest' | 'animal' | 'craft';
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
  /** A few words shown on the tile */
  note: string;
  /**
   * Where the idea comes from, in a few sentences a parent can read aloud. A Japanese word is written as its
   * Chinese reading with the Japanese after it in full-width brackets, e.g. 「西薩（シーサー）」; read-aloud says
   * the reading and skips the bracket.
   */
  story: string;
  pattern?: Pattern;
  stripe?: string;
  hat?: Hat;
  /** Nose colour when it isn't the dark outline colour (a red beak, a pink nose) */
  nose?: string;
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
  { id: 'animal', name: '動物系列', color: '#3E8F4A' },
  { id: 'craft', name: '工藝系列', color: '#A86A24' },
];

/** What a shisa is, for the "西薩是什麼？" page in the collection */
export const ABOUT_SHISA = {
  title: '西薩是什麼？',
  story:
    '「西薩（シーサー）」就是沖繩話的「獅子」，是沖繩人守護家園的好朋友。' +
    '獅子的樣子很久以前從中國傳到琉球，先是守護城門和村子；後來一般人家也能蓋紅瓦屋頂，師傅就用剩下的瓦片和白灰，在屋頂上捏一隻西薩，保護住在下面的一家人。' +
    '牠們常常一對出現：張嘴的把福氣接進來，閉嘴的把福氣守住。台灣金門也有守護村子的「風獅爺」，是西薩的遠房親戚喔。',
};

const v = (
  id: string,
  name: string,
  series: Series['id'],
  body: string,
  face: string,
  mane: string | string[],
  dark: string,
  extra: Partial<Variant> & { note: string; story: string },
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
  // ---------- 傳統系列 ----------
  v('terracotta', '素燒西薩', 'trad', '#E8743E', '#F39A5E', '#B34A24', '#7C2E14', {
    starter: true,
    note: '最常見的紅陶西薩',
    story:
      '「西薩（シーサー）」就是沖繩話的「獅子」。牠們常常一對一起出現：張開嘴的叫「阿」，把福氣接進來；閉著嘴的叫「吽」，把福氣守住。遊戲裡的兩隻小西薩也是這樣一對喔。',
  }),
  v('celadon', '青釉西薩', 'trad', '#3DA399', '#6CC4B8', '#25756E', '#174E49', {
    starter: true,
    note: '上了青色釉，亮亮的',
    story: '陶工把石頭和草木灰磨成的釉料塗在土坯上，再放進窯裡用大火燒。釉料熔化以後，會變成一層亮亮的玻璃外衣，摸起來滑滑的，下雨也不怕。',
  }),
  v('plaster', '白灰西薩', 'trad', '#EFEAE0', '#FFFFFF', '#C9C0B0', '#6E665A', {
    note: '用屋頂的白灰捏成的',
    story: '1889年以後，一般人家也可以蓋紅瓦屋頂了。蓋屋頂的師傅用剩下的瓦片和白灰，在屋頂上捏出一隻西薩，保護住在下面的一家人。',
  }),
  v('kuro', '黑釉西薩', 'trad', '#3B3A44', '#5C5B68', '#24232B', '#121216', {
    note: '黑得發亮，很威風',
    story: '沖繩人相信壞東西會從外面跑進來，所以西薩總是面向外面，盯著村子的入口或是對面的路口。一看到壞東西，就張大嘴巴把牠嚇跑。',
  }),
  v('gold', '金西薩', 'trad', '#E8B83A', '#F6D26B', '#B7871C', '#6E4E0A', {
    rare: true,
    sparkle: true,
    note: '傳說中會帶來好運',
    story: '沖繩童謠〈赤田首里殿內〉裡，唱到了金色的燈籠。大家提著亮亮的「黃金燈籠」，迎接傳說中帶來好收成和福氣的彌勒，所以金色是很吉利的顏色。',
  }),
  v('tomori', '富盛石西薩', 'trad', '#9C968A', '#BDB7AA', '#76705F', '#46423A', {
    pattern: 'stone',
    note: '最老的石雕西薩',
    story: '沖繩現存最古老的石雕大西薩住在八重瀨町富盛，是1689年刻的。那時村子常常發生火災，大家請這隻石雕西薩面向八重瀨岳守護，後來火災就變少了。',
  }),
  v('mon', '門西薩', 'trad', '#D8CFC0', '#EFE8DA', '#A89A80', '#5E5546', {
    pattern: 'masonry',
    note: '站在城門口',
    story: '首里城有一座「歡會門」，門口站著一對石雕西薩。「歡會」是歡迎的意思，從前中國的使者來到琉球，就是從這座門被迎進城裡的。',
  }),
  v('kawara', '碎瓦西薩', 'trad', '#D9543C', '#F07A5E', '#F2EEE6', '#7C2414', {
    pattern: 'shards',
    note: '碎瓦片拼成的',
    story: '沖繩的颱風很大。從前的人用白灰把紅瓦一片片黏牢，颱風就吹不走。屋頂上的西薩也是用碎瓦片和白灰拼起來的，所以每一隻都長得不一樣。',
  }),
  v('miya', '宮西薩', 'trad', '#5C7A5A', '#86A383', '#3E5A3C', '#22331F', {
    hat: 'rope',
    note: '守護神社',
    story: '西薩有好幾種：守著整個村子的叫「村落獅子」，守著神社的叫「宮獅子」，站在家家戶戶屋頂和門口的叫「家獅子」。',
  }),
  v('yaeyama', '八重山西薩', 'trad', '#F0A04B', '#F8C27E', '#C46A1E', '#6E3608', {
    pattern: 'minsa',
    note: '八重山的小西薩',
    story:
      '在石垣島、竹富島這些八重山的島上，大家把西薩叫做「西西（シーシー）」。身上的花紋是八重山的「敏沙（ミンサー）織」，五格和四格排在一起，代表「永遠在一起」。',
  }),

  // ---------- 海洋系列 ----------
  v('coral', '珊瑚西薩', 'sea', '#F27A8A', '#F9A9B3', '#D04F63', '#7E2433', {
    pattern: 'dots',
    note: '住在珊瑚礁旁邊',
    story: '珊瑚看起來像石頭，其實是很小很小的動物，一隻隻住在一起，慢慢長成大大的珊瑚礁。海水太熱的時候，珊瑚會變白生病，所以要好好愛護大海。',
  }),
  v('turtle', '海龜西薩', 'sea', '#6DAA5C', '#9CCB86', '#3F7A3A', '#23461F', {
    pattern: 'shell',
    note: '背著龜殼慢慢走',
    story: '每年夏天，海龜媽媽會在晚上爬上沙灘，挖洞生蛋。小海龜孵出來以後，會自己爬回大海。遇到海龜的時候，要安靜地遠遠看，不要打擾牠們。',
  }),
  v('fish', '熱帶魚西薩', 'sea', '#F7C843', '#FBE08A', '#2D7FD0', '#1B4B7E', {
    pattern: 'stripes',
    stripe: '#2D7FD0',
    note: '黃藍條紋，游得很快',
    story: '沖繩的縣魚叫「古魯昆（グルクン）」，是一群群游在珊瑚礁旁的藍色小魚。漁夫抓到以後，常常整條拿去炸，是沖繩餐桌上很常見的一道菜。',
  }),
  v('starsand', '星砂西薩', 'sea', '#EAD7AE', '#F6EBCF', '#C9AE76', '#6E5A33', {
    pattern: 'stars',
    hat: 'starfish',
    note: '身上沾滿星星沙',
    story: '竹富島和西表島的海灘上，有一種星星形狀的沙子，叫做星砂。其實那是很小很小的海洋生物留下來的殼，放在手心上，就像撿到一把小星星。',
  }),
  v('whaleshark', '鯨鯊西薩', 'sea', '#2F4F7F', '#5B7DB0', '#1D3557', '#0E1C30', {
    pattern: 'spots',
    rare: true,
    sparkle: true,
    note: '美麗海最大的明星',
    story: '鯨鯊是世界上最大的魚，身上有白色的點點。牠的嘴巴很大，吃的卻是小小的浮游生物。美麗海水族館的大水槽裡，就住著鯨鯊喔。',
  }),
  v('manta', '鬼蝠魟西薩', 'sea', '#2B3A55', '#E8EEF5', '#1A2538', '#0D1420', {
    pattern: 'patches',
    note: '在海裡飛翔',
    story: '鬼蝠魟又叫魔鬼魚，張開像翅膀一樣的大鰭，在海裡慢慢地「飛」。石垣島附近的海裡常常可以看到牠們，很多潛水的人專程去看。',
  }),
  v('clown', '小丑魚西薩', 'sea', '#F57C1F', '#FFB066', ['#FFFFFF', '#F57C1F'], '#5A2A05', {
    pattern: 'bands',
    note: '躲在海葵裡',
    story: '小丑魚住在海葵裡面。海葵的觸手會刺別的魚，卻不會刺小丑魚，所以海葵就像牠的家，保護牠不被大魚吃掉。',
  }),
  v('yadokari', '寄居蟹西薩', 'sea', '#E36A4E', '#F4977E', '#B3432B', '#5E1E10', {
    hat: 'shell',
    note: '背著貝殼房子',
    story: '寄居蟹會借貝殼當房子，長大了就換一個更大的殼。沖繩海邊的陸寄居蟹是受保護的天然紀念物，看到牠們，看看就好，不要帶回家喔。',
  }),
  v('dolphin', '海豚西薩', 'sea', '#6FA8D6', '#BFE0F5', '#4A82B5', '#1F4870', {
    pattern: 'waves',
    note: '最愛跳跳跳',
    story: '海豚很聰明，會用聲音和同伴說話，還會在海浪裡跳來跳去。在美麗海水族館旁邊的海豚劇場，可以看到海豚們精彩的表演。',
  }),
  v('pearl', '黑珍珠西薩', 'sea', '#2E2A3A', '#4C4660', ['#5B4E7A', '#3B6E6A', '#7A4E6E'], '#14111C', {
    hat: 'pearl',
    rare: true,
    sparkle: true,
    note: '閃著黑色光芒',
    story: '石垣島的川平灣是養黑珍珠的地方。貝殼要在乾淨的海裡慢慢長好幾年，才會長出一顆閃著黑色光芒的珍珠，所以非常珍貴。',
  }),

  // ---------- 美食系列 ----------
  v('beniimo', '紅芋西薩', 'food', '#8C56AA', '#B58BD0', '#5E3478', '#34183F', {
    note: '紅芋塔做的，香香甜甜',
    story: '讀谷村種了很多紫色的紅芋。1986年，讀谷村的點心店做出了紅芋塔，現在已經是沖繩最有名的伴手禮之一，吃起來香香甜甜的。',
  }),
  v('goya', '苦瓜西薩', 'food', '#5FAE4B', '#8CCB72', '#3E7F30', '#1F4517', {
    pattern: 'bumps',
    hat: 'leaf',
    note: '有點苦，但是很健康',
    story: '沖繩話叫苦瓜「勾壓（ゴーヤー）」。把苦瓜和豆腐、雞蛋、豬肉一起炒，就是有名的炒苦瓜。5月8日念起來像「勾壓」，所以是苦瓜日喔。',
  }),
  v('chinsuko', '金楚糕西薩', 'food', '#E2B77A', '#F1D3A3', '#B98845', '#6A4A1E', {
    pattern: 'crumbs',
    note: '酥酥的，小心不要碎掉',
    story: '金楚糕是琉球王國時代宮廷裡的點心，用麵粉、砂糖和豬油做成，吃起來酥酥的。現在有好多種口味，是很受歡迎的伴手禮。',
  }),
  v('kokuto', '黑糖西薩', 'food', '#7A4A2A', '#A06C47', '#4F2C14', '#2A160A', {
    pattern: 'crystals',
    note: '黑糖塊亮晶晶',
    story: '把甘蔗榨出來的汁慢慢煮、一直攪拌，就會變成黑糖。沖繩的波照間島、多良間島這些小島，都有自己做黑糖的工廠。',
  }),
  v('zenzai', '刨冰西薩', 'food', '#DDF1FA', '#FFFFFF', ['#FF8FB1', '#7CC8F2', '#FFD34E'], '#4B6B80', {
    hat: 'bean',
    rare: true,
    sparkle: true,
    note: '頭上有一顆紅豆',
    story: '沖繩的「善哉」和別的地方不一樣：在煮得甜甜的豆子上面，堆一大座刨冰，夏天吃最消暑。頭上那顆豆子，就是這碗冰的主角。',
  }),
  v('andagi', '沙翁西薩', 'food', '#C98A3E', '#E3AE66', '#9C6224', '#5A3510', {
    pattern: 'cracks',
    note: '笑開了口',
    story: '沙翁在沖繩叫「沙達安答吉（サーターアンダギー）」，意思是「用砂糖做的油炸點心」。炸好的時候表面會裂開，好像在笑，看起來很像中國點心「開口笑」。',
  }),
  v('soba', '沖繩麵西薩', 'food', '#F2E2B8', '#FFF4D6', '#E0C88E', '#7A6236', {
    pattern: 'noodles',
    note: '熱呼呼一大碗',
    story: '沖繩麵是用麵粉做的，湯頭用豬骨和柴魚熬煮，上面再放一大塊燉得軟軟的三層肉。每年的10月17日，是「沖繩麵之日」。',
  }),
  v('tacorice', '塔可飯西薩', 'food', '#E8B04A', '#F6D17E', ['#6BAA3A', '#D9443A', '#F2C43A'], '#6E4A10', {
    pattern: 'confetti',
    note: '香香辣辣好下飯',
    story: '塔可飯是1984年在金武町誕生的：把墨西哥塔可餅裡的絞肉、起司、生菜和番茄，直接放在白飯上，又快又好吃，大家都愛。',
  }),
  v('umibudo', '海葡萄西薩', 'food', '#4FAE6A', '#86D39A', '#2E8048', '#174A28', {
    pattern: 'grapes',
    note: '啵啵啵一顆顆',
    story: '海葡萄是一種海藻，一顆顆綠色小圓球，像一串迷你葡萄。咬下去會「啵」一聲爆開，鹹鹹的，有大海的味道。牠怕冷，不能放冰箱喔。',
  }),
  v('pine', '鳳梨西薩', 'food', '#F4C430', '#FBE07A', '#C79A12', '#6E5206', {
    pattern: 'crosshatch',
    hat: 'leaves',
    note: '頭上長葉子',
    story: '沖繩北部和石垣島種了很多鳳梨，從種下去到可以吃，要等上一年多。名護有一座鳳梨公園，可以坐著鳳梨造型的小車參觀。',
  }),

  // ---------- 祭典系列 ----------
  v('eisa', '太鼓西薩', 'fest', '#D9443A', '#F07A6E', '#8E231B', '#5A130D', {
    hat: 'band',
    pattern: 'drum',
    note: '跳艾薩舞的時候最帥',
    story: '艾薩是沖繩夏天盂蘭盆節時跳的舞。年輕人一邊敲太鼓、一邊在村子裡跳，把回家過節的祖先熱熱鬧鬧地送回去。',
  }),
  v('bingata', '紅型西薩', 'fest', '#F3B23F', '#FFD58A', '#D9443A', '#7A3A10', {
    pattern: 'flowers',
    note: '穿著紅型花布',
    story: '紅型是琉球傳統的染布，用鮮豔的顏色染出花、鳥和波浪的圖案。從前是王族和士族穿的衣服，現在也做成包包和手帕。',
  }),
  v('sanshin', '三線西薩', 'fest', '#4A3B33', '#7A6658', '#2A201B', '#120D0A', {
    pattern: 'scales',
    note: '會彈三線琴',
    story: '三線是沖繩的傳統樂器，琴身蒙著蛇皮，是從中國傳過來的。3月4日念起來像「三線」，所以是三線之日，大家會在這天一起彈三線。',
  }),
  v('hanabi', '煙火西薩', 'fest', '#27315C', '#4A578F', '#151C3A', '#0B0F22', {
    pattern: 'burst',
    note: '夏天祭典的煙火',
    story: '沖繩的夏天有很多祭典，晚上常常會在海邊放煙火。大大的煙火在海上一朵朵開出來，倒映在海面上，好像開了兩次花一樣。',
  }),
  v('king', '琉球王西薩', 'fest', '#C23A2B', '#E06A55', '#E8B83A', '#5A140D', {
    hat: 'crown',
    rare: true,
    sparkle: true,
    note: '首里城的國王',
    story: '很久以前，沖繩是一個叫「琉球王國」的國家，國王住在首里城。琉球的船和中國、日本、東南亞做生意，把各地的好東西帶回來。',
  }),
  v('haari', '爬龍船西薩', 'fest', '#1F6FA8', '#5FA1D6', ['#F2C43A', '#D9443A'], '#0D3557', {
    pattern: 'scales',
    note: '划呀划龍舟',
    story: '爬龍船是沖繩的划龍舟比賽，漁夫們用力划船，祈求出海平安、魚抓得多。那霸每年五月都會舉辦熱鬧的爬龍船比賽。',
  }),
  v('tsunahiki', '大綱挽西薩', 'fest', '#D9C089', '#EEDCAE', '#B09050', '#5E4A1E', {
    pattern: 'rope',
    note: '大家一起拉',
    story: '那霸大綱挽的大繩子有200公尺長、大約40噸重，1995年被金氏世界紀錄認證為世界最大的稻草繩。成千上萬的人一起拉，非常壯觀。',
  }),
  v('hatagashira', '旗頭西薩', 'fest', '#F2EEE6', '#FFFFFF', ['#D9443A', '#F2C43A', '#2D8FD0'], '#5E5546', {
    hat: 'flag',
    note: '高高舉起來',
    story: '旗頭是祭典時舉起來的高高旗竿，上面有華麗的裝飾，每個村子的都不一樣。大家輪流把它撐起來遊行，是村子的驕傲。',
  }),
  v('hanagasa', '花笠西薩', 'fest', '#F2A0B8', '#FFD0DC', '#D9607E', '#7A2440', {
    hat: 'hanagasa',
    note: '戴著大花帽',
    story: '花笠是跳琉球舞蹈時戴的帽子，上面的裝飾像一朵大大的花。跳舞的人戴著它慢慢轉身，就像一朵花在風裡輕輕搖。',
  }),
  v('shishimai', '獅子舞西薩', 'fest', '#E7D7B1', '#F5EAD0', '#C9B37E', '#5A4A26', {
    pattern: 'fringe',
    rare: true,
    sparkle: true,
    note: '毛茸茸跳舞',
    story: '沖繩的村子在祭典時會跳獅子舞：兩個人鑽進毛茸茸的獅子裡，一起跳動。大家相信獅子能趕走壞東西，保佑村子平平安安。',
  }),

  // ---------- 動物系列 ----------
  v('yamaneko', '西表山貓西薩', 'animal', '#8A7A5A', '#B3A380', '#5E523A', '#2E281C', {
    pattern: 'darkspots',
    hat: 'ears',
    nose: '#C98A7A',
    rare: true,
    sparkle: true,
    note: '西表島的森林之王',
    story: '西表山貓只住在西表島，全世界大約只有一百隻，是日本的特別天然紀念物。島上的路邊有「小心山貓」的牌子，開車要慢慢的。',
  }),
  v('kuina', '山原秧雞西薩', 'animal', '#4A4F55', '#6E747A', '#2E3236', '#16181A', {
    pattern: 'barred',
    nose: '#D9443A',
    note: '不會飛但跑很快',
    story: '山原秧雞住在沖繩北部的山原森林，1981年才被發現，是日本唯一不會飛的鳥。牠有紅紅的嘴巴和腳，跑起來非常快。',
  }),
  v('yashigani', '椰子蟹西薩', 'animal', '#4B5AA0', '#7C88C4', '#2E3A78', '#141A40', {
    hat: 'claws',
    note: '大螯力氣大',
    story: '椰子蟹是寄居蟹的親戚，也是陸地上最大的蟹，大螯的力氣非常大。牠白天躲在洞裡，晚上才出來找東西吃，在八重山的島上可以找到。',
  }),
  v('jugon', '儒艮西薩', 'animal', '#9AA7AE', '#C3CDD2', '#77858C', '#3A454B', {
    hat: 'leaf',
    nose: '#77858C',
    note: '溫柔的海中美人魚',
    story: '儒艮住在溫暖的海裡，最愛吃海草。傳說人們把在海面露出頭的儒艮看成了美人魚。沖繩的儒艮非常稀少，需要大家好好保護。',
  }),
  v('zatou', '座頭鯨西薩', 'animal', '#33475B', '#E8EEF2', '#22313F', '#0E1820', {
    pattern: 'grooves',
    hat: 'spout',
    note: '冬天來生寶寶',
    story: '每年冬天，座頭鯨會游到慶良間群島附近溫暖的海裡生寶寶。運氣好的話，可以看到牠們跳出海面，濺起好大好大的水花。',
  }),

  // ---------- 工藝系列 ----------
  v('tsuboya', '壺屋燒西薩', 'craft', '#D9C9A8', '#EFE4CC', '#3E6E9C', '#5A4630', {
    pattern: 'swirl',
    note: '陶器的故鄉',
    story: '1682年，琉球王府把各地的窯集中到那霸的壺屋，從此這裡就成了陶器的故鄉。壺屋還留著石板小路和古老的窯，走起來很有味道。',
  }),
  v('shikki', '琉球漆器西薩', 'craft', '#A3231A', '#C9473A', '#1E1210', '#3E0C08', {
    pattern: 'gold',
    note: '亮晶晶的漆',
    story: '琉球漆器要一層一層地刷上漆，再用金色和亮晶晶的貝殼做裝飾。從前琉球國王常把漆器當作禮物，送給中國和日本。',
  }),
  v('bashofu', '芭蕉布西薩', 'craft', '#D8C27A', '#EBDBA4', '#A68E4A', '#5A4A1C', {
    pattern: 'plaid',
    note: '涼涼的芭蕉布',
    story: '芭蕉布是用芭蕉的纖維織成的布，穿起來輕輕涼涼，很適合炎熱的沖繩。從種芭蕉、取纖維到織成布，每一步都要用手慢慢完成。',
  }),
  v('shuriori', '首里織西薩', 'craft', '#3A5FA0', '#6A8BC6', '#23407A', '#101F40', {
    pattern: 'kasuri',
    note: '王族穿的布',
    story: '首里織是從前在首里城附近織的布，主要給王族和士族穿。織布的人用不同顏色的線，織出格子和小花紋，每一匹都要花很多工夫。',
  }),
  v('glass', '琉球玻璃西薩', 'craft', '#6EC3D9', '#B4E6F0', ['#3FA7C9', '#6ED3B8', '#F2C43A'], '#1E6E88', {
    pattern: 'bubbles',
    rare: true,
    sparkle: true,
    note: '藏著小氣泡',
    story: '戰爭結束後，沖繩的人把美軍喝完的汽水和啤酒瓶收集起來，熔化以後重新吹成杯子和碗。玻璃裡面的小氣泡，就是琉球玻璃的特色。',
  }),
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
