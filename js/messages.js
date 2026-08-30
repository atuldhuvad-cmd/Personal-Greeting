const FESTIVAL_OPTIONS = [
  'Diwali',
  'Holi',
  'Navratri',
  'Uttarayan / Makar Sankranti',
  'Raksha Bandhan',
  'Janmashtami',
  'Ganesh Chaturthi',
  'Dussehra',
  'Bestu Varas (Gujarati New Year)',
  'Independence Day',
  'Republic Day',
  'Valentine\'s Day',
  'Christmas',
  'Eid',
  'New Year',
  'Thanksgiving',
  'Other'
];

const OCCASIONS = [
  { id: 'birthday', icon: '🎂', name: 'Birthday', hint: 'Celebrate their year', fields: [['recipient', 'Recipient name']] },
  { id: 'anniversary', icon: '💍', name: 'Anniversary', hint: 'A shared milestone', fields: [['spouse1', 'Spouse 1 name'], ['spouse2', 'Spouse 2 name'], ['year', 'Anniversary year', 'number']] },
  { id: 'baby', icon: '👶', name: 'New Baby', hint: 'Welcome a little one', fields: [['baby', 'Baby name'], ['parents', 'Parent name(s)'], ['note', 'Gender or custom note']] },
  { id: 'congratulations', icon: '🎉', name: 'Congratulations', hint: 'Celebrate a win', fields: [['recipient', 'Recipient name'], ['reason', 'Achievement or reason']] },
  { id: 'housewarming', icon: '🏡', name: 'New Home', hint: 'Warm their new space', fields: [['recipient', 'Recipient or family name']] },
  { id: 'graduation', icon: '🎓', name: 'Graduation', hint: 'Honour their success', fields: [['recipient', 'Graduate name'], ['reason', 'Course or degree']] },
  { id: 'retirement', icon: '🌴', name: 'Retirement', hint: 'A new chapter', fields: [['recipient', 'Retiree name']] },
  { id: 'getwell', icon: '💐', name: 'Get Well', hint: 'Send care and hope', fields: [['recipient', 'Recipient name']] },
  { id: 'festival', icon: '🎆', name: 'Festival', hint: 'Share festive joy & wellness', fields: [['festival', 'Festival', 'select', FESTIVAL_OPTIONS], ['recipient', 'Recipient name']] },
  { id: 'thanks', icon: '💛', name: 'Friendship / Thanks', hint: 'Show appreciation', fields: [['recipient', 'Friend name']] },
  { id: 'custom', icon: '✍️', name: 'Custom', hint: 'Create any occasion', fields: [['title', 'Occasion title'], ['recipient', 'Recipient name']] }
];

const TONES = [
  ['joyful', '😊', 'Joyful'],
  ['warm', '🌸', 'Warm'],
  ['candid', '💬', 'Candid'],
  ['funny', '😂', 'Funny'],
  ['formal', '👔', 'Formal'],
  ['heartfelt', '❤️', 'Heartfelt']
];

const FESTIVAL_TONE_MESSAGES = {
  'Raksha Bandhan': {
    joyful: [
      'Celebrating the sweetest bond of love, laughter, and lifelong protection! May this Rakhi bring endless smiles, joy, and wonderful memories to our relationship.',
      'Big smiles and festive cheer for this Rakhi! May our bond grow stronger with each passing year, filled with laughter, happiness, and celebrations.',
      'Here’s to the most fun, loving, and supportive sibling! May this Raksha Bandhan shower you with good health, success, and pure joy.'
    ],
    warm: [
      'Sending warmest Raksha Bandhan wishes. May this sacred thread always protect your happiness, good health, and peace of mind.',
      'Thinking of you with warmth and affection on this special day. May our sacred bond always bring comfort, happiness, and strength.',
      'With so much love and gentle wishes on Raksha Bandhan. May every day bring you peace, good health, and cherished moments.'
    ],
    candid: [
      'Happy Raksha Bandhan! Grateful for every memory, every argument, and all the unconditional support. Lucky to have you by my side.',
      'Just wanted to celebrate having the most amazing sibling. Thanks for always having my back, no matter what!',
      'Hey, happy Rakhi! Growing up together has been the best adventure, and I wouldn\'t trade it for the world.'
    ],
    funny: [
      'Happy Raksha Bandhan! Time to celebrate having the best sibling in the world (and claim your official festival gift right now!).',
      'Official notice: It is Rakhi time! I promise not to annoy you for at least the next 24 hours. Enjoy the sweets!',
      'Breaking news: You have the coolest sibling ever. Consider this card your official reminder to send my gift immediately!'
    ],
    formal: [
      'Wishing you and your family a joyous and auspicious Raksha Bandhan. May this sacred festival bestow peace, prosperity, and harmony.',
      'Heartiest greetings on the auspicious occasion of Raksha Bandhan. May the sacred bond of protection bring lasting success and wellness.',
      'Please accept our warmest greetings on Raksha Bandhan. Wishing you health, happiness, and flourishing achievements ahead.'
    ],
    heartfelt: [
      'A thread of love, a lifetime of gratitude. Thank you for always being my pillar of strength and endless care. Happy Raksha Bandhan!',
      'From the heart, this is for you. Words can hardly express how grateful I am for your love, protection, and unconditional support.',
      'Some bonds make life truly beautiful. Holding this sacred connection close today and always. Wishing you boundless happiness.'
    ]
  },
  'Diwali': {
    joyful: [
      'Let the celebrations begin! May the festival of lights fill your home with radiant sparklers, sweet delicacies, and boundless joy.',
      'Wishing you a dazzling Diwali bursting with laughter, prosperity, vibrant colors, and unforgettable festive cheer!',
      'Light up the diyas and celebrate wildly! May this Diwali illuminate every corner of your life with happiness and good health.'
    ],
    warm: [
      'May the warm glow of Diwali lamps bring peace, comfort, and good fortune to you and your loved ones.',
      'Sending warm Diwali blessings your way. May your home be blessed with light, love, and sweet togetherness.',
      'May this auspicious season surround your family with gentle warmth, harmony, and cherished blessings.'
    ],
    candid: [
      'Happy Diwali! Hope you enjoy delicious sweets, sparkling lights, and great times with the people who matter most.',
      'Wishing you a safe and joyful Diwali! May this year bring you closer to all your dreams.',
      'Happy Deepavali! Enjoy every single sweet and make the most of this festive break.'
    ],
    funny: [
      'Official Diwali warning: Calories from festive sweets do not count this week! Celebrate guilt-free and enjoy every bite!',
      'May your Diwali be brighter than your neighbor\'s decorations and your bank account overflow with Lakshmi\'s blessings!',
      'Time to light lamps, eat endless kaju katli, and pretend we will start a diet on Monday. Happy Diwali!'
    ],
    formal: [
      'Wishing you and your esteemed family a prosperous and peaceful Diwali. May the divine lights guide you to enduring success.',
      'Please accept our sincere greetings on the auspicious occasion of Deepavali. May this season bring flourishing growth and health.',
      'Heartiest Diwali greetings. May the festival of lights illuminate your path with prosperity, integrity, and wellness.'
    ],
    heartfelt: [
      'From our hearts to yours, wishing you a Diwali filled with divine grace, peace, good health, and everlasting love.',
      'May the sacred lights of Deepavali dispel all darkness and bring serenity and fulfillment to your soul.',
      'Holding your friendship close this festive season. May this Diwali be your most memorable and joyful celebration yet.'
    ]
  },
  'Holi': {
    joyful: [
      'Rang Barse! May the vibrant colors of Holi paint your life with pure joy, exuberant laughter, and boundless energy!',
      'Splash on the gulal and let the celebrations begin! Wishing you an unforgettable Holi filled with festive music and fun.',
      'May every shade of red, yellow, and blue bring excitement, good health, and sweet moments to your life!'
    ],
    warm: [
      'Wishing you a gentle and beautiful Holi. May the colors of spring bring harmony, peace, and warmth to your home.',
      'May the sweetness of gujiyas and the warmth of loved ones make this Holi truly heartwarming and special.',
      'Sending you warm and colorful wishes for a peaceful, joyful, and healthy Holi celebration.'
    ],
    candid: [
      'Happy Holi! Put on your oldest clothes, grab the pichkari, and have an absolute blast with colors today!',
      'Wishing you a super fun Holi with great friends, awesome food, and zero stubborn color stains tomorrow!',
      'Happy Festival of Colors! Hope your day is as bright and lively as you are.'
    ],
    funny: [
      'Official Holi advice: Play safe, run fast, and do not let anyone catch you with permanent purple color! Have fun!',
      'Consider this your permission to look like a walking rainbow today! Happy colorful Holi!',
      'May your Holi be filled with fun and your face return to its normal color by tomorrow morning!'
    ],
    formal: [
      'Wishing you and your family a vibrant and joyous Holi. May this festival of spring foster harmony, health, and success.',
      'Please accept our warm greetings on the occasion of Holi. May the season bring fresh vitality and prosperous new beginnings.',
      'Heartiest greetings on Holi. May the vibrant festival inspire unity, goodwill, and wholesome well-being.'
    ],
    heartfelt: [
      'May the sacred colors of Holi wash away all worries and bless your life with deep peace, genuine love, and good health.',
      'Grateful for the color and happiness you bring into our lives every day. Wishing you a truly blessed Holi.',
      'Celebrating the beauty of life, friendship, and togetherness with you this Holi. May your heart be forever joyful.'
    ]
  },
  'Navratri': {
    joyful: [
      'Chalo Garba Ramva! May the energetic rhythms of dhol and dandiya fill your nine nights with exhilarating joy and vibrant health!',
      'Whirl into the magic of Navratri! Wishing you nine nights of non-stop dance, colorful chaniya cholis, and divine blessings.',
      'Let the celebrations begin! May Maa Durga’s grace bring music, energy, and radiant happiness to your heart.'
    ],
    warm: [
      'May the divine presence of Maa Durga fill your home with peace, strength, and gentle blessings throughout Navratri.',
      'Wishing you warm and auspicious Navratri nights filled with devotion, family togetherness, and wholesome health.',
      'May these sacred nine days bring calm devotion and renewed vitality to you and your loved ones.'
    ],
    candid: [
      'Happy Navratri! Get your dandiya sticks ready, dance your heart out, and enjoy every single beat!',
      'Wishing you an amazing Garba season! May your feet never tire and your spirit always shine.',
      'Happy Navratri! Hope you enjoy the energetic nights, gorgeous traditional outfits, and festive food.'
    ],
    funny: [
      'Official Navratri workout plan: 3 hours of Garba every night! Who needs a gym when you have dandiya beats? Happy Navratri!',
      'May your Garba steps be perfectly in sync and your feet not hurt tomorrow morning! Enjoy the dance!',
      'Time for nine nights of dance, traditional glam, and showing everyone who the true Garba champion is!'
    ],
    formal: [
      'Wishing you and your family an auspicious Navratri. May Divine Shakti bestow courage, wisdom, and prosperous health upon you.',
      'Heartiest greetings on the holy occasion of Navratri. May Goddess Durga bless your endeavors with strength and success.',
      'Please accept our warm wishes for a blessed Navratri. May these nine nights inspire devotion, wellness, and peace.'
    ],
    heartfelt: [
      'Praying that Maa Durga showers her divine grace, boundless protection, and inner peace on you and your family.',
      'May the sacred energy of Navratri illuminate your soul and grant you strength, good health, and true fulfillment.',
      'With deep reverence and affection, wishing you a spiritual, radiant, and joyous Navratri celebration.'
    ]
  },
  'Uttarayan / Makar Sankranti': {
    joyful: [
      'Kai Po Che! May your hopes, dreams, and aspirations soar high in the sunny azure sky this Uttarayan!',
      'Loud cheers, colorful skies, and sweet til-gul! Wishing you a high-flying and sun-kissed Makar Sankranti!',
      'Let the rooftop celebrations begin! May your life be as colorful and soaring as a kite in the Uttarayan breeze.'
    ],
    warm: [
      'Til-gul ghya, god god bola! May the warmth of the sun and the sweetness of jaggery fill your home with peace and good health.',
      'Wishing you a blessed Makar Sankranti. May this harvest season bring warmth, nourishment, and abundance.',
      'May the golden rays of the Uttarayan sun bless you and your family with health, harmony, and prosperity.'
    ],
    candid: [
      'Happy Uttarayan! Grab your firki, catch the wind, and may your kite fly the highest over every rooftop today!',
      'Wishing you a super fun Uttarayan! Enjoy the chikki, undhiyu, and awesome kite battles with friends.',
      'Happy Makar Sankranti! Hope you have an exhilarating day under the sun with great music and food.'
    ],
    funny: [
      'Official Uttarayan rule: Shout "Lapet!" as loud as you can, and eat undhiyu until you can’t move! Have a blast!',
      'May your manja be sharp, your kites fly uninterrupted, and nobody cut your string today! Kai Po Che!',
      'Remember to look up at the kites and not trip over the rooftop! Have a safe and thrilling Uttarayan!'
    ],
    formal: [
      'Wishing you a prosperous Makar Sankranti and Uttarayan. May the transition of the sun usher in new opportunities and health.',
      'Heartiest greetings on Uttarayan. May this auspicious harvest festival bring success, clarity, and growth to all your endeavors.',
      'Please accept our warm greetings on Makar Sankranti. Wishing you and your organization continued ascension and prosperity.'
    ],
    heartfelt: [
      'Just as kites rise against the wind, may you overcome every challenge and reach extraordinary heights of peace and happiness.',
      'May the sacred Uttarayan sun illuminate your life with good health, deep wisdom, and cherished memories.',
      'Sending heartfelt blessings on Makar Sankranti. May your days ahead be filled with sunshine, harvest, and love.'
    ]
  },
  'Janmashtami': {
    joyful: [
      'Haathi Ghoda Paalkhi, Jai Kanhaiya Laal Ki! May Lord Krishna’s birth bring festive music, joy, and divine sweetness to your home!',
      'Celebrate with joy and great cheer! May Bal Gopal bless your family with playful laughter, good health, and prosperous abundance.',
      'Let the melodies of Krishna’s flute fill your heart with pure bliss, lively energy, and endless celebrations!'
    ],
    warm: [
      'May the divine grace of Lord Krishna bring tranquility, good health, and spiritual warmth to your household.',
      'Wishing you a peaceful and sacred Janmashtami. May Kanha always guide and protect you with love.',
      'May the holy blessings of Shree Krishna surround your family with comfort, harmony, and sweet togetherness.'
    ],
    candid: [
      'Happy Janmashtami! Enjoy the festive dahi handi energy, sweet makhan treats, and special moments with loved ones.',
      'Wishing you a joyous Janmashtami! May Lord Krishna steal all your worries and leave you with pure happiness.',
      'Happy Krishna Janmotsav! Hope your day is filled with sweet prasadam, devotion, and smiles.'
    ],
    funny: [
      'May Lord Krishna steal your worries just like he steals makhan! Enjoy the sweets and happy Janmashtami!',
      'Time to enjoy delicious butter and sweets without feeling guilty. Bal Gopal approved! Happy Janmashtami!',
      'Wishing you as much charm and fun as Kanha himself today. Have a wonderful celebration!'
    ],
    formal: [
      'Wishing you and your family an auspicious Krishna Janmashtami. May the divine teachings of Lord Krishna inspire wisdom and success.',
      'Heartiest greetings on Janmashtami. May the blessings of Lord Krishna grant peace, prosperity, and wellness in your life.',
      'Please accept our warm wishes on this holy occasion. May Janmashtami bring spiritual fulfillment and righteous triumph.'
    ],
    heartfelt: [
      'May Lord Krishna’s divine flute play melodies of love, resilience, peace, and eternal grace in your heart.',
      'Praying that Bal Gopal bestows good health, serenity, and spiritual light on you and your cherished ones.',
      'Holding deep gratitude for your presence in our lives. May Lord Krishna shower you with his supreme blessings.'
    ]
  },
  'Ganesh Chaturthi': {
    joyful: [
      'Ganpati Bappa Morya! May Lord Ganesha’s arrival bring vibrant energy, sweet modaks, and grand celebrations to your life!',
      'Welcome Bappa with loud dhol beats and joyous cheers! May he bless your home with boundless prosperity and happiness.',
      'Let the festivities begin! Wishing you an exciting and joyous Ganeshotsav filled with blessings and festive treats.'
    ],
    warm: [
      'May Lord Vighnaharta remove all obstacles from your path and bless your home with peace, wisdom, and good health.',
      'Sending warm Ganesh Chaturthi wishes. May Bappa bestow harmony, contentment, and protection upon your loved ones.',
      'May the auspicious presence of Lord Ganesha bring serene warmth and auspicious new beginnings to your life.'
    ],
    candid: [
      'Happy Ganesh Chaturthi! Hope you enjoy delicious modaks, great aartis, and quality time with family and friends.',
      'Wishing you a blessed and happy Ganeshotsav! May Bappa fulfill all your sincere wishes this year.',
      'Happy Bappa festival! May all your challenges melt away like steamed modaks.'
    ],
    funny: [
      'May your problems be as small as Ganesha\'s mouse and your happiness as big as his appetite for modaks!',
      'Official festival diet: 21 modaks for Bappa, and at least 21 for you! Happy Ganesh Chaturthi!',
      'Bappa says: Eat healthy modaks, celebrate responsibly, and spread joy everywhere you go!'
    ],
    formal: [
      'Wishing you and your family an auspicious Ganesh Chaturthi. May Lord Ganesha remove all impediments and grant enduring success.',
      'Heartiest greetings on Ganeshotsav. May the blessings of Vighnaharta foster wisdom, prosperity, and good health in your endeavors.',
      'Please accept our warm greetings on Ganesh Chaturthi. Wishing you auspicious beginnings and flourishing achievements.'
    ],
    heartfelt: [
      'May the divine grace of Lord Ganesha illuminate your journey with clarity, righteous courage, and profound peace.',
      'Praying that Siddhivinayak blesses you and your family with radiant health, spiritual fulfillment, and endless joy.',
      'With deep affection and reverence, wishing you a sacred and transformative Ganesh Chaturthi.'
    ]
  },
  'Bestu Varas (Gujarati New Year)': {
    joyful: [
      'Nutan Varshabhinandan! May this new year begin with fresh vitality, exciting goals, joyful laughter, and wholesome health!',
      'Saal Mubarak! Wishing you 365 days of prosperity, sweet celebrations, family togetherness, and great success!',
      'Let’s celebrate a wonderful new beginning! May this year overflow with happiness, good cheer, and auspicious moments.'
    ],
    warm: [
      'Nutan Varshabhinandan to you and your family. May the year ahead bring serenity, sound health, and warm comfort.',
      'Wishing you a blessed and peaceful Gujarati New Year. May your home be enriched with love, harmony, and blessings.',
      'May the sacred Kalash and Shubh Labh bring gentle warmth, prosperity, and good fortune to your household.'
    ],
    candid: [
      'Saal Mubarak! Wishing you an incredible year ahead packed with great adventures, good health, and memorable achievements.',
      'Happy Gujarati New Year! Hope you enjoy delicious festive snacks and wonderful moments with family.',
      'Nutan Varshabhinandan! May this year turn out to be your most fulfilling and happiest one yet.'
    ],
    funny: [
      'Saal Mubarak! May your new year resolutions last longer than the Diwali sweets on the table! Have a blast!',
      'New Year, new goals, same awesome you! Wishing you a year full of fun, laughter, and zero stress!',
      'Nutan Varshabhinandan! May your bank balance grow faster than your to-do list this year!'
    ],
    formal: [
      'Nutan Varshabhinandan. Wishing you and your esteemed organization a prosperous, healthy, and successful New Year.',
      'Please accept our heartiest greetings on the Gujarati New Year. May the coming year yield rewarding growth and harmony.',
      'Saal Mubarak. May this auspicious new year inaugurate a period of enduring health, integrity, and distinguished success.'
    ],
    heartfelt: [
      'As a new chapter unfolds, we pray that God blesses you with robust health, peaceful days, and cherished love.',
      'Thank you for your friendship and support. Wishing you a profoundly meaningful, joyful, and blessed New Year.',
      'May the dawn of this New Year bring divine grace, contentment, and abundant happiness to your life.'
    ]
  },
  'Thanksgiving': {
    joyful: [
      'Happy Thanksgiving! Wishing you a table full of good food and a heart full of gratitude.',
      'Let the celebrations begin! May your Thanksgiving be filled with laughter, love, and delicious moments.',
      'Sending bright and joyful Thanksgiving wishes your way!'
    ],
    warm: [
      'Wishing you a warm and cozy Thanksgiving, surrounded by the people who mean the most to you.',
      'Sending heartfelt Thanksgiving wishes, filled with warmth and gratitude.',
      'May this Thanksgiving bring you comfort, gentle joy, and cherished time with loved ones.'
    ],
    candid: [
      'Happy Thanksgiving! Hope you enjoy great food, good company, and a well-earned break.',
      'Wishing you a wonderful Thanksgiving — eat well, laugh often, and enjoy every bit of it.',
      'Happy Turkey Day! Hope your table is full and your day is even better.'
    ],
    funny: [
      'Happy Thanksgiving! May your stretchy pants and your appetite be perfectly matched today.',
      'Official notice: it is officially okay to have seconds (and thirds) today. Happy Thanksgiving!',
      'Wishing you a Thanksgiving with zero kitchen disasters and unlimited pie. Good luck!'
    ],
    formal: [
      'Wishing you and your family a joyful and gracious Thanksgiving filled with warmth and gratitude.',
      'Please accept our warmest Thanksgiving greetings. May this season bring you peace and prosperity.',
      'Heartfelt Thanksgiving wishes to you and your family — may gratitude and grace fill your home.'
    ],
    heartfelt: [
      'Grateful for you today and always. Wishing you a Thanksgiving filled with love and meaning.',
      'This Thanksgiving, I am especially thankful for you. Wishing you warmth, love, and togetherness.',
      'May this Thanksgiving remind you how deeply you are loved and appreciated.'
    ]
  }
};

const OCC_LINES = {
  birthday: 'May this day feel extra special. May the year ahead bring laughter, good health, exciting adventures, and beautiful memories.',
  anniversary: 'May your partnership grow richer, kinder, and more joyful with every passing milestone year.',
  baby: 'May this precious little arrival fill your home with wonder, sweet laughter, gentle warmth, and boundless love.',
  congratulations: 'Your dedication and hard work have led to this wonderful achievement. Enjoy every single moment of your success.',
  housewarming: 'May your new home hold cozy comfort, hearty laughter, warm gatherings, and memories you will treasure forever.',
  graduation: 'Your determination has opened a brilliant new door. Step forward with confidence, pride, and high aspirations.',
  retirement: 'May this well-earned new chapter bring freedom, exciting discoveries, relaxed days, and deep happiness.',
  getwell: 'Sending healing thoughts and positive energy. May each new day bring renewed strength, comfort, and quick recovery.',
  festival: 'May the festive celebration fill your home with luminous light, good health, peace, and joyous togetherness.',
  thanks: 'Thank you for the genuine kindness, wonderful support, and heartfelt cheer you bring into my life.',
  custom: 'May this special occasion become an unforgettable memory that you always cherish and celebrate.'
};

const DEFAULT_FESTIVAL_LINES = {
  'Dussehra': 'May the victory of good over evil inspire courage, positivity, wellness, and righteous triumph in your life.',
  'Independence Day': 'Celebrating freedom, unity, and responsible citizenship. May our nation thrive in health, strength, and harmony.',
  'Republic Day': 'Honouring the spirit of our Constitution and unity. Wishing you a proud, healthy, and inspiring Republic Day.',
  'Valentine\'s Day': 'Celebrating the power of meaningful connection, mutual care, gentle love, and lasting happiness.',
  'Christmas': 'May the warmth of Christmas fill your home with peace, hearty laughter, goodwill, and good health.',
  'Eid': 'Eid Mubarak! May this joyous festival bring serenity, gratitude, abundant blessings, and togetherness.',
  'New Year': 'Wishing you 365 days of vibrant health, ambitious goals, joyful laughter, and flourishing success.',
  'Thanksgiving': 'May Thanksgiving bring heartfelt gratitude, cozy comfort, and cherished moments with your loved ones.',
  'Other': 'May this joyous festival bring light, prosperity, peace, and togetherness to your family.'
};

function subjectFor(o, d) {
  if (o === 'anniversary') return `${d.spouse1 || 'A wonderful couple'} & ${d.spouse2 || ''}`.replace(/ & $/, '');
  if (o === 'baby') return d.baby || d.parents || 'your beautiful family';
  return d.recipient || 'you';
}

function generatedMessage(occasion, tone, data, index = 0) {
  const fest = data.festival;
  
  // If it's a festival with defined multi-tone messages
  if (occasion === 'festival' && fest && FESTIVAL_TONE_MESSAGES[fest]) {
    const toneGroup = FESTIVAL_TONE_MESSAGES[fest][tone] || FESTIVAL_TONE_MESSAGES[fest].joyful;
    const msg = toneGroup[index % toneGroup.length];
    return msg;
  }

  // If festival without detailed tone map, use default festival line + tone opener
  if (occasion === 'festival' && fest) {
    const line = DEFAULT_FESTIVAL_LINES[fest] || DEFAULT_FESTIVAL_LINES.Other;
    const openers = {
      joyful: ['Let the celebrations begin! ', 'Sending bright and joyful festive wishes! ', 'Big smiles and festive cheer! '],
      warm: ['Sending warmest festive blessings. ', 'With so much affection and warm wishes. ', 'Thinking warmly of you this season. '],
      candid: ['Happy festivities! ', 'Hope you have an awesome celebration! ', 'Enjoy the festive season to the fullest! '],
      funny: ['Official festival alert: time to celebrate wildly! ', 'Enjoy the sweets and celebrations! ', 'May your festival be full of fun and zero stress! '],
      formal: ['Please accept our cordial greetings on this auspicious occasion. ', 'Wishing you and your family a prosperous celebration. ', 'Heartiest greetings on this festive occasion. '],
      heartfelt: ['From the heart, wishing you peace, grace, and abundance. ', 'Holding this special celebration close with deep gratitude. ', 'May divine blessings touch every aspect of your life. ']
    }[tone] || [''];
    const opener = openers[index % openers.length] || '';
    return `${opener}${line}`.replace(/\s+/g, ' ').trim();
  }

  // For general occasions (birthday, anniversary, etc.)
  const occLine = OCC_LINES[occasion] || OCC_LINES.custom;
  let detail = '';
  if (occasion === 'anniversary' && data.year) detail = ` Happy ${ordinal(data.year)} anniversary!`;
  if (['congratulations', 'graduation'].includes(occasion) && data.reason) detail = ` Congratulations on ${data.reason}!`;
  if (occasion === 'custom' && data.title) detail = ` Wishing you a wonderful ${data.title}!`;
  if (occasion === 'baby' && data.note) detail = ` ${data.note}.`;

  const toneOpeners = {
    joyful: ['Big smiles for this special day! ', 'Let the celebrations begin! ', 'Today is all about celebrating you! '],
    warm: ['Warmest wishes to you. ', 'Sending gentle, loving wishes. ', 'May this day feel extra special. '],
    candid: ['Hey! So happy to celebrate this with you. ', 'A big shout-out on this special moment! ', 'Just wanted to celebrate this amazing milestone with you! '],
    funny: ['Official notice: it is time to celebrate! ', 'Breaking news: today belongs to you! ', 'Cue the cake, confetti, and wild celebrations! '],
    formal: ['Please accept our warm congratulations and best wishes. ', 'It is a pleasure to celebrate this distinguished milestone. ', 'Sincere wishes for continued health and success. '],
    heartfelt: ['From the bottom of my heart, this is for you. ', 'Some moments make life truly beautiful. ', 'Words can hardly express how much we celebrate you today. ']
  }[tone] || [''];

  const opener = toneOpeners[index % toneOpeners.length] || '';
  const endings = ['May every moment shine.', 'Celebrate beautifully.', 'May today become a truly memorable day.', 'Here’s to everything wonderful ahead.', 'With every good wish for today and beyond.'];
  const ending = endings[index % endings.length];
  return `${opener}${occLine}${detail} ${ending}`.replace(/\s+/g, ' ').trim();
}

function ordinal(value) {
  const n = Number(value), m = n % 100;
  if (m >= 11 && m <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
}
