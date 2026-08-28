const FESTIVAL_OPTIONS=[
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

const OCCASIONS=[
  {id:'birthday',icon:'🎂',name:'Birthday',hint:'Celebrate their year',fields:[['recipient','Recipient name']]},
  {id:'anniversary',icon:'💍',name:'Anniversary',hint:'A shared milestone',fields:[['spouse1','Spouse 1 name'],['spouse2','Spouse 2 name'],['year','Anniversary year','number']]},
  {id:'baby',icon:'👶',name:'New Baby',hint:'Welcome a little one',fields:[['baby','Baby name'],['parents','Parent name(s)'],['note','Gender or custom note']]},
  {id:'congratulations',icon:'🎉',name:'Congratulations',hint:'Celebrate a win',fields:[['recipient','Recipient name'],['reason','Achievement or reason']]},
  {id:'housewarming',icon:'🏡',name:'New Home',hint:'Warm their new space',fields:[['recipient','Recipient or family name']]},
  {id:'graduation',icon:'🎓',name:'Graduation',hint:'Honour their success',fields:[['recipient','Graduate name'],['reason','Course or degree']]},
  {id:'retirement',icon:'🌴',name:'Retirement',hint:'A new chapter',fields:[['recipient','Retiree name']]},
  {id:'getwell',icon:'💐',name:'Get Well',hint:'Send care and hope',fields:[['recipient','Recipient name']]},
  {id:'festival',icon:'🎆',name:'Festival',hint:'Share festive joy & wellness',fields:[['festival','Festival','select',FESTIVAL_OPTIONS],['recipient','Recipient name']]},
  {id:'thanks',icon:'💛',name:'Friendship / Thanks',hint:'Show appreciation',fields:[['recipient','Friend name']]},
  {id:'custom',icon:'✍️',name:'Custom',hint:'Create any occasion',fields:[['title','Occasion title'],['recipient','Recipient name']]}
];

const TONES=[
  ['joyful','😊','Joyful'],
  ['warm','🌸','Warm'],
  ['candid','💬','Candid'],
  ['funny','😂','Funny'],
  ['formal','👔','Formal'],
  ['heartfelt','❤️','Heartfelt']
];

const OPENERS={
  joyful:['Big smiles for','Here’s to an amazing','Let the celebrations begin for','Sending bright and joyful wishes to','Today is all about'],
  warm:['Warmest wishes to','With so much affection for','Sending gentle, loving wishes to','May this day feel extra special for','Thinking warmly of'],
  candid:['Hey','A big shout-out to','So happy for','Just wanted to celebrate','This one is for'],
  funny:['Official notice: it is time to celebrate','Breaking news: today belongs to','Cue the cake and confetti for','No sensible celebration would be complete without','Consider this your permission to celebrate wildly,'],
  formal:['Sincere wishes to','Please accept our warm congratulations,','With best wishes to','It is a pleasure to celebrate','Heartiest greetings to'],
  heartfelt:['From the heart, this is for','With love and gratitude for','Some people make life more beautiful—','Holding this special moment close for','Words can hardly express how much we celebrate']
};

const OCC_LINES={
  birthday:'May this day feel extra special. May the year ahead bring laughter, good health and beautiful memories.',
  anniversary:'May your partnership grow richer, kinder and more joyful with every year.',
  baby:'May this little arrival fill your home with wonder, laughter and love.',
  congratulations:'Your dedication has led to this wonderful moment. Enjoy every bit of it.',
  housewarming:'May every room hold comfort, laughter and memories you will treasure.',
  graduation:'Your hard work opened a new door. Step through it with confidence.',
  retirement:'May this new chapter bring freedom, discovery and well-earned happiness.',
  getwell:'May each new day bring renewed strength, comfort and healing.',
  festival:'May the celebration fill your home with light, peace, health and togetherness.',
  thanks:'Thank you for the kindness, laughter and support you bring into life.',
  custom:'May this special moment become a memory you always cherish.'
};

const FESTIVAL_LINES={
  'Diwali':'May the festival of lights illuminate your life with peace, prosperity, good health and boundless happiness.',
  'Holi':'May the vibrant colors of Holi bring pure joy, harmony, glowing health and sweet memories.',
  'Navratri':'May Divine Shakti bless your life with vibrant energy, joy, health and devotion through nine magical nights.',
  'Uttarayan / Makar Sankranti':'May your aspirations soar high like colorful kites under the sunny, joyous Uttarayan sky.',
  'Raksha Bandhan':'May this sacred thread celebrate lifelong protection, selfless care, affection and strong bonds.',
  'Janmashtami':'May Lord Krishna’s flute fill your home with melodies of love, peace, grace and good health.',
  'Ganesh Chaturthi':'May Lord Ganesha bestow wisdom, prosperity, health and remove all obstacles from your path.',
  'Dussehra':'May the victory of good over evil inspire courage, positivity, wellness and righteous triumph in your life.',
  'Bestu Varas (Gujarati New Year)':'Nutan Varshabhinandan! May this new year begin with fresh vitality, success and wholesome health.',
  'Independence Day':'Celebrating freedom, unity and responsible citizenship. May our nation thrive in health and harmony.',
  'Republic Day':'Honouring the spirit of our Constitution and unity. Wishing you a proud, healthy and inspiring Republic Day.',
  'Valentine\'s Day':'Celebrating the power of meaningful connection, mutual care, gentle love and lasting happiness.',
  'Christmas':'May the warmth of Christmas fill your home with peace, hearty laughter, goodwill and good health.',
  'Eid':'Eid Mubarak! May this joyous festival bring serenity, gratitude, abundant blessings and togetherness.',
  'New Year':'Wishing you 365 days of vibrant health, ambitious goals, joyful laughter and flourishing success.',
  'Thanksgiving':'May Thanksgiving bring heartfelt gratitude, cozy comfort and cherished moments with your loved ones.'
};

function subjectFor(o,d){
  if(o==='anniversary')return `${d.spouse1||'A wonderful couple'} & ${d.spouse2||''}`.replace(/ & $/,'');
  if(o==='baby')return d.baby||d.parents||'your beautiful family';
  return d.recipient||'you';
}

function generatedMessage(occasion,tone,data,index=0){
  const line=occasion==='festival'&&data.festival&&FESTIVAL_LINES[data.festival]?FESTIVAL_LINES[data.festival]:OCC_LINES[occasion]||OCC_LINES.custom;
  let detail='';
  if(occasion==='anniversary'&&data.year)detail=` Happy ${ordinal(data.year)} anniversary.`;
  if(['congratulations','graduation'].includes(occasion)&&data.reason)detail=` Congratulations on ${data.reason}.`;
  if(occasion==='festival'&&data.festival==='Other')detail=' May this celebration bring peace, light and togetherness.';
  if(occasion==='custom'&&data.title)detail=` Wishing you a wonderful ${data.title}.`;
  if(occasion==='baby'&&data.note)detail=` ${data.note}.`;
  const endings=[
    'May every moment shine with happiness.',
    'Celebrate safely and beautifully.',
    'May today become a truly memorable day.',
    'Here’s to everything wonderful ahead.',
    'With every good wish for today and beyond.'
  ];
  return `${line} ${detail} ${endings[index%endings.length]}`.replace(/\s+/g,' ').trim();
}

function ordinal(value){
  const n=Number(value),m=n%100;
  if(m>=11&&m<=13)return `${n}th`;
  return `${n}${{1:'st',2:'nd',3:'rd'}[n%10]||'th'}`;
}
