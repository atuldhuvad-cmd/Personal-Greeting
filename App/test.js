

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (let reg of regs) { reg.update(); }
  });
}



const $=id=>document.getElementById(id),cvs=$("poster"),ctx=cvs.getContext("2d");let rec=null,palette="Festival Gold",generatedKey="",artworkImage=null,artworkId="none",qaReport=null,_rendering=false;
function onEl(id,ev,fn){const el=$(id);if(!el)return false;el.addEventListener(ev,fn);return true}
function resolveVisibleStyle(name){return STYLES.includes(name)?name:"Auto Theme"}
function syncStyleChips(){
  const v=$("style")?$("style").value:"";
  document.querySelectorAll("#posterQuickChips .chip").forEach(c=>c.classList.toggle("active",c.dataset.style===v));
}
const store={get(k,d=[]){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
function key(){return JSON.stringify([$("date").value,$("occasionEn").value,$("messageEn").value,$("signature").value,palette,$("style").value,artworkId,$("artworkZoom").value,$("artworkFocus").value])}
function invalidate(){generatedKey="";$("download").disabled=true;$("sharePoster").disabled=true;$("status").textContent="Changes detected — generate before download."}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
  }
}

function wrap(text,width,font){ctx.font=font;let lines=[],line="";for(const word of text.trim().split(/\s+/)){const t=line?line+" "+word:word;if(line&&ctx.measureText(t).width>width){lines.push(line);line=word}else line=t}if(line)lines.push(line);return lines}

function removeWeekdayReference(text,lang="en"){
  let s=String(text||"").trim();
  if(lang==="gu"){
    const patterns=[
      /^આ\s+(સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર|રવિવાર)ના\s+દિવસે,\s*/i,
      /^આ\s+(સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર|રવિવાર),\s*/i,
      /^(સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર|રવિવાર)ના\s+દિવસે,\s*/i
    ];
    patterns.forEach(p=>s=s.replace(p,""));
  }else{
    const days="Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday";
    s=s.replace(new RegExp("^On this ("+days+"),?\\s*","i"),"");
    s=s.replace(new RegExp("^This ("+days+"),?\\s*","i"),"");
    s=s.replace(new RegExp("^Let this ("+days+")\\s+","i"),"Let ");
  }
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function currentEnglishMessage(){return removeWeekdayReference($("messageEn")?$("messageEn").value:"","en")}
function currentGujaratiMessage(){const el=$("messageGu");return el?removeWeekdayReference(el.value,"gu"):""}

function fit(text,width,maxLines,start,min,family,weight="700"){for(let size=start;size>=12;size-=2){const font=`${weight} ${size}px ${family}`;const lines=wrap(text,width,font);if(lines.length<=maxLines)return{font,lines,size,overflow:size<min}}const size=12,font=`${weight} ${size}px ${family}`;return{font,lines:wrap(text,width,font),size,overflow:true}}
function fitBox(text, maxW, maxH, startSize = 74, minSize = 42, fontName = "Georgia", fontWeight = "700", lineSpacing = 1.25) {
  let font = startSize;
  const words = (text || "").split(" ");

  while (font >= minSize) {
    ctx.font = `${fontWeight} ${font}px ${fontName}`;
    let lines = [];
    let curLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = curLine ? curLine + " " + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && curLine) {
        lines.push(curLine);
        curLine = words[i];
      } else {
        curLine = testLine;
      }
    }
    if (curLine) lines.push(curLine);

    const lineHeight = Math.round(font * lineSpacing);
    const totalH = lines.length * lineHeight;

    if (totalH <= maxH || font === minSize) {
      return {
        font: `${fontWeight} ${font}px ${fontName}`,
        fontSize: font,
        lines: lines,
        lineHeight: lineHeight,
        totalHeight: totalH
      };
    }
    font -= 2;
  }
  
  return {
    font: `${fontWeight} ${minSize}px ${fontName}`,
    fontSize: minSize,
    lines: [text],
    lineHeight: Math.round(minSize * lineSpacing),
    totalHeight: Math.round(minSize * lineSpacing)
  };
}

function drawLines(f,x,y,color,align="center",shadow){ctx.save();ctx.font=f.font;ctx.fillStyle=color;ctx.textAlign=align;if(shadow){ctx.shadowColor=shadow.color||"rgba(0,0,0,0.38)";ctx.shadowBlur=shadow.blur||12;ctx.shadowOffsetY=shadow.y||1;ctx.shadowOffsetX=0}f.lines.forEach((line,i)=>ctx.fillText(line,x,y+i*f.lineHeight));ctx.restore();return y+f.lines.length*f.lineHeight}
function texture(p){ctx.save();ctx.globalAlpha=.045;for(let y=0;y<1350;y+=9){ctx.fillStyle=y%18===0?p.accent:p.gold;ctx.fillRect(0,y,1080,1)}for(let x=0;x<1080;x+=13){ctx.fillStyle=p.ink;ctx.fillRect(x,0,1,1350)}ctx.restore()}
function bg(p){const g=ctx.createLinearGradient(0,0,1080,1350);g.addColorStop(0,p.a);g.addColorStop(.48,p.soft);g.addColorStop(1,p.b);ctx.fillStyle=g;ctx.fillRect(0,0,1080,1350);texture(p)}
function frame(p){ctx.strokeStyle=p.gold;ctx.lineWidth=5;rr(35,35,1010,1280,30);ctx.stroke();ctx.strokeStyle="#ffffff9c";ctx.lineWidth=2;rr(49,49,982,1252,23);ctx.stroke()}
function hexA(hex,a){const h=String(hex||"#000").replace("#","");const full=h.length===3?h.split("").map(c=>c+c).join(""):h.slice(0,6);const n=parseInt(full,16);if(!isFinite(n))return "rgba(0,0,0,"+a+")";return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"}
function sigName(){if(!$("signature"))return "Dr. Atul";return $("signature").value.trim();}
function themeTitle(){return ($("occasionEn")&&$("occasionEn").value.trim())||""}
function editorialDate(){const d=new Date(($("date")?$("date").value:"")+"T00:00:00");if(isNaN(d.getTime()))return{line:"",full:"",compact:"",month:"",day:"",year:"",weekday:""};const mon=d.toLocaleDateString("en-US",{month:"short"}).toUpperCase();const day=String(d.getDate()).padStart(2,"0");const wd=d.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase();const year=String(d.getFullYear());const full=d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}).toUpperCase();return{line:mon+" "+day+"  •  "+wd,full,compact:day+" / "+String(d.getMonth()+1).padStart(2,"0")+" / "+year,month:mon,day,year,weekday:wd}}
function quoteScaleRange(text){const words=(text||"").trim().split(/\s+/).filter(Boolean).length;if(words<=5)return{start:110,min:78};if(words<=15)return{start:88,min:66};if(words<=30)return{start:72,min:54};return{start:60,min:42}}
function fitQuote(text,maxW,maxH,fontName,weight="500",spacing=1.22){const r=quoteScaleRange(text);const areaCap=Math.max(r.min,Math.min(r.start,Math.round(maxH/1.35)));return fitBox(text,maxW,maxH,areaCap,r.min,fontName,weight,spacing)}
const HERO_WORDS=["KINDNESS","COURAGE","HOPE","GRATITUDE","BELIEVE","RISE","PEACE","WISDOM","LOVE","STRENGTH","FAITH","LIGHT","LEARNING","COMPASSION"];
function heroKeyword(){const t=(themeTitle()+" "+currentEnglishMessage()).toUpperCase();for(const w of HERO_WORDS){if(t.includes(w))return w}const occ=themeTitle().replace(/\s+day$/i,"").trim().split(/\s+/)[0]||"HOPE";return occ.toUpperCase().slice(0,14)}
function posterThemeBlob(){return [themeTitle(),typeof currentEnglishMessage==="function"?currentEnglishMessage():"",rec&&rec.Occasion_English,rec&&(rec.Emotion||rec.Visual_Mood),rec&&rec.Category].filter(Boolean).join(" ")}
function classifyThemeFamily(blob){const title=(themeTitle()||"").toLowerCase();const t=String(blob||"").toLowerCase();if(/\b(kindness|compassion|family|gratitude)\b/.test(title))return "kindness";if(/\b(courage|resilience|purpose)\b/.test(title))return "courage";if(/\b(wisdom|learning|education)\b/.test(title))return "wisdom";if(/\b(peace|faith|spiritual|reflection|meditation)\b/.test(title))return "peace";if(/\b(kindness|compassion|family|gratitude)\b/.test(t))return "kindness";if(/\b(courage|resilience|purpose)\b/.test(t))return "courage";if(/\b(wisdom|learning|education|knowledge)\b/.test(t))return "wisdom";if(/\b(peace|faith|spiritual|meditation|mindful|balance)\b/.test(t))return "peace";if(/\b(festival|diwali|dhanteras|holi|navratri)\b/.test(t))return "festival";if(/\b(strength|victory|determination)\b/.test(t)&&!/\bkindness\b/.test(t))return "courage";if(/\b(love|friend)\b/.test(t))return "kindness";if(/\b(nature|forest|tree)\b/.test(t))return "nature";return "kindness"}
function pickThemePhotoSrc(styleName){const family=classifyThemeFamily(posterThemeBlob());const style=styleName||_activePosterStyle;const PHOTO={kindness:"artwork/BuiltIn/theme-kindness.jpg",wisdom:"artwork/BuiltIn/theme-wisdom.jpg",courage:"artwork/BuiltIn/theme-courage.jpg",festival:"artwork/BuiltIn/theme-festival.jpg",nature:"artwork/BuiltIn/theme-kindness.jpg"};if(style==="Modern Glassmorphic"){if(family==="wisdom")return PHOTO.wisdom;if(family==="courage")return PHOTO.courage;return PHOTO.kindness}if(style==="Hero Focus"){if(family==="courage")return PHOTO.courage;if(family==="festival")return PHOTO.festival;if(family==="peace")return PHOTO.kindness;return PHOTO.wisdom}if(style==="Sacred Arch"){if(family==="wisdom")return PHOTO.wisdom;if(family==="courage")return PHOTO.courage;if(family==="festival")return PHOTO.festival;return PHOTO.kindness}if(style==="Cinematic Editorial"){if(family==="kindness"||family==="peace")return PHOTO.kindness;if(family==="wisdom")return PHOTO.wisdom;if(family==="festival")return PHOTO.festival;return PHOTO.courage}return PHOTO.kindness}
function compositionCrop(){const family=classifyThemeFamily(posterThemeBlob());const style=_activePosterStyle;if(style==="Modern Glassmorphic"){if(family==="courage")return{zoom:1.08,focus:0.1,focusX:0.04};if(family==="wisdom")return{zoom:1.1,focus:-0.02,focusX:0.08};return{zoom:1.08,focus:0.22,focusX:0.02}}if(style==="Hero Focus"){if(family==="courage")return{zoom:1.16,focus:0.1,focusX:0.05};if(family==="festival")return{zoom:1.14,focus:0.16,focusX:0};return{zoom:1.22,focus:0,focusX:-0.42}}if(style==="Sacred Arch"){if(family==="courage")return{zoom:1.12,focus:-0.1,focusX:0.08};if(family==="wisdom")return{zoom:1.1,focus:-0.12,focusX:0.04};return{zoom:1.1,focus:-0.08,focusX:0.1}}if(style==="Cinematic Editorial"){if(family==="kindness"||family==="peace")return{zoom:1.18,focus:-0.12,focusX:0.22};if(family==="wisdom")return{zoom:1.22,focus:0.04,focusX:0.12};return{zoom:1.22,focus:0.04,focusX:0.08}}return{zoom:1.1,focus:0,focusX:0}}
function resolveHeroImage(){if(artworkImage&&(artworkImage.naturalWidth||artworkImage.width)>0)return{img:artworkImage,zoom:Number($("artworkZoom").value)||1,focus:Number($("artworkFocus").value)||0};const themeImg=getThemePhotoImage();if(themeImg&&themeImg.complete&&themeImg.naturalWidth>0)return{img:themeImg,zoom:1,focus:0};return{img:null,zoom:1,focus:0}}
function drawGrain(x,y,w,h,alpha=0.035){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle="#1a120c";for(let i=0;i<220;i++){ctx.fillRect(x+((i*97)%w),y+((i*53)%h),1.15,1.15)}ctx.restore()}
function drawVignette(x,y,w,h,strength=0.28){const g=ctx.createRadialGradient(x+w/2,y+h/2,Math.min(w,h)*0.22,x+w/2,y+h/2,Math.max(w,h)*0.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(8,6,4,"+strength+")");ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}
function coverDraw(img,x,y,w,h,zoom=1,focus=0,focusX=0){if(!img)return;const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;if(!iw||!ih||!w||!h||!isFinite(w)||!isFinite(h))return;const z=Number(zoom);const f=Number(focus);const fx=Number(focusX);const safeZoom=(isFinite(z)&&z>0)?z:1;const safeFocus=isFinite(f)?f:0;const safeFocusX=isFinite(fx)?fx:0;const base=Math.max(w/iw,h/ih)*safeZoom;if(!isFinite(base)||base<=0)return;const sw=w/base,sh=h/base;let sx=(iw-sw)/2+safeFocusX*(iw-sw)/2,sy=(ih-sh)/2+safeFocus*(ih-sh)/2;sx=Math.max(0,Math.min(iw-sw,sx));sy=Math.max(0,Math.min(ih-sh,sy));ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
function treatmentFilter(name){if(name==="Quiet Matte")return "saturate(0.58) contrast(0.92) sepia(0.16) brightness(1.03)";if(name==="Warm Lifestyle")return "saturate(0.94) contrast(0.97) sepia(0.14) brightness(1.05)";if(name==="Sacred Atmosphere")return "saturate(0.8) contrast(1.05) brightness(0.95)";if(name==="Cinematic Grade")return "saturate(0.48) contrast(1.16) brightness(0.94)";return ""}
function drawImageFill(p,x,y,w,h,opts={}){ctx.save();if(opts.radius){rr(x,y,w,h,opts.radius);ctx.clip()}else{ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip()}const hero=resolveHeroImage();const zoom=(opts.zoom||1)*hero.zoom;const focus=(opts.focus!=null)?opts.focus:hero.focus;const focusX=opts.focusX||0;const filt=opts.filter||treatmentFilter(opts.treatment);if(filt)ctx.filter=filt;if(hero.img){coverDraw(hero.img,x,y,w,h,zoom,focus,focusX)}else{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,p.b);g.addColorStop(1,p.a);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);generatedHero(p,x,y,w,h)}ctx.filter="none";if(opts.treatment)applyImageTreatment(opts.treatment,x,y,w,h);if(opts.duotone){ctx.fillStyle=hexA(opts.duotone,0.22);ctx.fillRect(x,y,w,h)}if(opts.vignette)drawVignette(x,y,w,h,opts.vignette);if(opts.fadeBottom){const g=ctx.createLinearGradient(x,y+h*(1-opts.fadeBottom),x,y+h);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,opts.fadeColor||"rgba(8,8,12,0.88)");ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}if(opts.fadeLeft){const g=ctx.createLinearGradient(x,y,x+w*opts.fadeLeft,y);g.addColorStop(0,opts.fadeColor||"rgba(8,8,12,0.82)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}if(opts.grain)drawGrain(x,y,w,h,opts.grain);ctx.restore()}
function drawQuietBrand(x,y,color,align="left"){ctx.save();ctx.globalAlpha=0.55;ctx.textAlign=align;ctx.fillStyle=color;ctx.font='600 11px "Manrope",sans-serif';ctx.fillText("INDIA INSPIRATION STUDIO",x,y);ctx.restore()}
function drawQuietSig(x,y,color,align="right",font){const s=sigName();if(!s)return;ctx.textAlign=align;ctx.fillStyle=color;ctx.font=font||'italic 500 26px "Cormorant Garamond",Georgia,serif';ctx.fillText(s,x,y)}


const THEME_PHOTO_CACHE = {};
let _activePosterStyle = "Modern Glassmorphic";

function getThemePhotoImage() {
  const src = pickThemePhotoSrc(_activePosterStyle);
  if (!THEME_PHOTO_CACHE[src]) {
    const img = new Image();
    img.onload = () => { if (typeof rec !== "undefined" && rec) render(); };
    img.onerror = () => { img._failed = true; if (typeof rec !== "undefined" && rec) render(); };
    img.src = src;
    THEME_PHOTO_CACHE[src] = img;
  }
  return THEME_PHOTO_CACHE[src];
}


// 10 COMPOSITION STYLES + AUTO THEME
const STYLES = [
  "Auto Theme",
  "Modern Glassmorphic",
  "Hero Focus",
  "Sacred Arch",
  "Cinematic Editorial"
];

// 6 SEMANTIC COLOR PALETTES (70% Base, 20% Secondary, 8% Typography, 2% Gold Accent)
const PALETTES = {
  "Vedic Indigo": { b: "#182448", secondary: "#222228", soft: "#F6F0E4", a: "#D8C6A5", accent: "#C5A45D", gold: "#C5A45D", ink: "#F6F0E4" },
  "Crimson Sandstone": { b: "#7B2430", secondary: "#35221E", soft: "#F6EDE0", a: "#C98B68", accent: "#B98A4A", gold: "#B98A4A", ink: "#F6EDE0" },
  "Sage Temple": { b: "#486358", secondary: "#283630", soft: "#EEE9DD", a: "#A7B4A1", accent: "#A88B51", gold: "#A88B51", ink: "#EEE9DD" },
  "Saffron Ruby": { b: "#E59B34", secondary: "#43243A", soft: "#FFF4DE", a: "#D9A08B", accent: "#982E3F", gold: "#982E3F", ink: "#FFF4DE" },
  "Lotus Rose": { b: "#B97C82", secondary: "#6A303A", soft: "#F7EFE5", a: "#DEA4A1", accent: "#BA9760", gold: "#BA9760", ink: "#F7EFE5" },
  "Emerald Noir": { b: "#123E38", secondary: "#141918", soft: "#F5F2EA", a: "#789C8F", accent: "#D9C297", gold: "#D9C297", ink: "#F5F2EA" },

  "Royal Saffron": { b: "#C75E22", secondary: "#381D15", soft: "#FFF8EA", a: "#F7D9A3", accent: "#8E2E21", gold: "#E5B85D", ink: "#381D15" },
  "Peacock Royal": { b: "#087070", secondary: "#12343A", soft: "#F5FFFC", a: "#DCEDE6", accent: "#075866", gold: "#D8B65D", ink: "#12343A" },
  "Lotus Pink": { b: "#B65378", secondary: "#4A2131", soft: "#FFF7FA", a: "#F8E1E8", accent: "#8D3659", gold: "#D9A76D", ink: "#4A2131" },
  "Monsoon Green": { b: "#446A50", secondary: "#23382A", soft: "#F8FFF5", a: "#E3ECDD", accent: "#34573F", gold: "#C9AA67", ink: "#23382A" },
  "Midnight Indigo": { b: "#292E62", secondary: "#14172D", soft: "#F7F7FF", a: "#DEE0F1", accent: "#454A89", gold: "#D2BC78", ink: "#14172D" },
  "Heritage Sandstone": { b: "#9B5F40", secondary: "#40271C", soft: "#FFF9F2", a: "#F1E1CC", accent: "#7A3E2C", gold: "#D2A05C", ink: "#40271C" },
  "Festival Gold": { b: "#7D2635", secondary: "#3A1D20", soft: "#FFF9EB", a: "#FFF0C9", accent: "#8E293D", gold: "#E8C46E", ink: "#3A1D20" },

};

// 4 REUSABLE TYPOGRAPHY PRESETS
const TYPO_PRESETS = {
  A: { quoteFont: '"Cormorant Garamond", Georgia, serif', metaFont: '"Manrope", sans-serif', sigFont: '"Cormorant Garamond", Georgia, serif', sigStyle: "italic" },
  B: { quoteFont: '"Bodoni Moda", Georgia, serif', metaFont: '"Inter", sans-serif', sigFont: '"Bodoni Moda", Georgia, serif', sigStyle: "italic" },
  C: { quoteFont: '"EB Garamond", Georgia, serif', metaFont: '"DM Sans", sans-serif', sigFont: '"EB Garamond", Georgia, serif', sigStyle: "italic" },
  D: { heroFont: '"Cinzel", Georgia, serif', quoteFont: '"Cormorant Garamond", Georgia, serif', metaFont: '"Inter", sans-serif', sigFont: '"Inter", sans-serif', sigStyle: "normal" }
};

// IMAGE MASK MESH FUNCTIONS
function drawSacredArch(ctx, x, y, w, h) {
  ctx.beginPath();
  const r = w / 2;
  const archApexY = y;
  const archSideY = y + r * 0.7;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, archSideY);
  ctx.quadraticCurveTo(x, archApexY, x + r, archApexY);
  ctx.quadraticCurveTo(x + w, archApexY, x + w, archSideY);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawTornPaper(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 10);
  ctx.lineTo(x + w - 15, y + 5);
  ctx.lineTo(x + w - 5, y + h - 15);
  ctx.lineTo(x + 15, y + h - 5);
  ctx.closePath();
}

// CANVAS NON-DESTRUCTIVE IMAGE FILTERS & JAALI BACKGROUND
function drawBackgroundJaali(ctx) {
  ctx.save();
  const glow = ctx.createRadialGradient(540, 180, 30, 540, 520, 980);
  glow.addColorStop(0, "rgba(196,163,106,0.09)");
  glow.addColorStop(0.42, "rgba(24,33,61,0)");
  glow.addColorStop(1, "rgba(8,12,24,0.42)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = "rgba(196, 163, 106, 0.045)";
  ctx.lineWidth = 1;
  for (let x = 40; x < 1080; x += 220) {
    for (let y = 40; y < 1350; y += 220) {
      ctx.beginPath();
      ctx.arc(x, y, 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function isLightColor(hex){const h=String(hex||"#000").replace("#","");const full=h.length===3?h.split("").map(c=>c+c).join(""):h.slice(0,6);const n=parseInt(full,16);if(!isFinite(n))return false;const r=(n>>16)&255,g=(n>>8)&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>168}
function hexRgb(hex){const h=String(hex||"#000").replace("#","");const full=h.length===3?h.split("").map(c=>c+c).join(""):h.slice(0,6);const n=parseInt(full,16);if(!isFinite(n))return [0,0,0];return [(n>>16)&255,(n>>8)&255,n&255]}
function mixHex(a,b,t){const A=hexRgb(a),B=hexRgb(b);const m=Math.max(0,Math.min(1,Number(t)||0));return "#"+[0,1,2].map(i=>Math.round(A[i]+(B[i]-A[i])*m).toString(16).padStart(2,"0")).join("")}
function paperInk(p){return isLightColor(p.ink)?(p.secondary||"#241814"):p.ink}
function photoInk(p){return isLightColor(p.ink)?p.ink:"#F4EFE6"}
function composeArtPalette(styleName, userP) {
  const u = userP || PALETTES["Vedic Indigo"];
  if (styleName === "Modern Glassmorphic") {
    const burgundy = mixHex("#7C3F4B", u.accent || "#7C3F4B", 0.08);
    return { b: "#EAE3D7", a: "#F3EFE7", soft: "#F3EFE7", secondary: "#272421", accent: burgundy, gold: burgundy, ink: "#272421", date: "#82776D", theme: burgundy, message: "#272421", signature: mixHex("#7C3F4B", "#82776D", 0.28), paper: "#F3EFE7", parchment: "#EAE3D7" };
  }
  if (styleName === "Hero Focus") {
    const caramel = mixHex("#C4A574", u.gold || u.accent || "#C4A574", 0.1);
    return { b: "#F4E6D0", a: "#FBF6EE", soft: "#F4E6D0", secondary: "#3D2A1F", accent: "#5A3A28", gold: caramel, ink: "#3D2A1F", date: "#8B6A52", theme: "#5A3A28", message: "#3D2A1F", signature: "#B08958", paper: "#FBF6EE", parchment: "#F4E6D0" };
  }
  if (styleName === "Sacred Arch") {
    const gold = mixHex("#C4A36A", u.gold || "#C4A36A", 0.14);
    return { b: "#18213D", a: "#11182B", soft: "#F3EBDD", secondary: "#11182B", accent: gold, gold, ink: "#F3EBDD", date: "#AAA093", theme: gold, message: "#F3EBDD", signature: mixHex("#C4A36A", "#AAA093", 0.22) };
  }
  if (styleName === "Cinematic Editorial") {
    const champagne = mixHex("#C6A76B", u.gold || "#C6A76B", 0.08);
    return { b: "#0B1020", a: "#151D38", soft: "#F7F5EF", secondary: "#0B1020", accent: champagne, gold: champagne, ink: "#F7F5EF", date: "#A9AFBA", theme: "#F7F5EF", message: "#F7F5EF", signature: mixHex("#C6A76B", "#A9AFBA", 0.28) };
  }
  return u;
}
function applyImageTreatment(treatment, x, y, w, h) {
  ctx.save();
  if (treatment === "Warm Film" || treatment === "Warm Lifestyle") {
    ctx.fillStyle = "rgba(232, 186, 118, 0.14)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255, 244, 228, 0.06)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Quiet Matte") {
    ctx.fillStyle = "rgba(243, 239, 231, 0.16)";
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(90, 78, 68, 0.06)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Sacred Atmosphere") {
    ctx.fillStyle = "rgba(17, 24, 43, 0.16)";
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(196, 163, 106, 0.14)";
    ctx.fillRect(x, y, w, h);
  } else   if (treatment === "Cinematic Grade") {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(11, 16, 32, 0.28)";
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(18, 26, 52, 0.16)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Spiritual Indigo") {
    ctx.fillStyle = "rgba(24, 36, 72, 0.18)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Matte Botanical") {
    ctx.fillStyle = "rgba(72, 99, 88, 0.15)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Festival Radiance") {
    ctx.fillStyle = "rgba(245, 195, 80, 0.16)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Mono Luxe") {
    ctx.globalCompositeOperation = "saturation";
    ctx.fillStyle = "rgba(128,128,128,0.7)";
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(18, 16, 14, 0.16)";
    ctx.fillRect(x, y, w, h);
  } else if (treatment === "Indigo Shadow") {
    ctx.fillStyle = "rgba(12, 18, 42, 0.28)";
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function generatedHero(p,x,y,w,h){
  ctx.save();
  ctx.translate(x+w/2, y+h/2);
  const name = ((rec && rec.Occasion_English) || "").toLowerCase();
  const emotion = ((rec && (rec.Emotion || rec.Visual_Mood)) || "").toLowerCase();
  const category = ((rec && rec.Category) || "").toLowerCase();

  // Background gradient for hero box
  const hg = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
  if (name.includes("kindness") || name.includes("love") || name.includes("peace") || emotion.includes("compassion")) {
    hg.addColorStop(0, "#5A1A2E"); hg.addColorStop(0.5, "#9C3852"); hg.addColorStop(1, "#3D0F1E");
  } else if (name.includes("learning") || name.includes("wisdom") || name.includes("education") || emotion.includes("wisdom")) {
    hg.addColorStop(0, "#0F2027"); hg.addColorStop(0.5, "#203A43"); hg.addColorStop(1, "#2C5364");
  } else if (name.includes("courage") || name.includes("strength") || name.includes("victory")) {
    hg.addColorStop(0, "#4A00E0"); hg.addColorStop(0.5, "#8E2DE2"); hg.addColorStop(1, "#240046");
  } else if (name.includes("nature") || name.includes("green") || category.includes("nature")) {
    hg.addColorStop(0, "#134E5E"); hg.addColorStop(1, "#71B280");
  } else {
    hg.addColorStop(0, p.b); hg.addColorStop(0.5, p.accent); hg.addColorStop(1, p.b);
  }
  ctx.fillStyle = hg;
  ctx.fillRect(-w/2, -h/2, w, h);

  // Soft ambient radial glow
  const rg = ctx.createRadialGradient(0, 0, 10, 0, 0, 160);
  rg.addColorStop(0, "rgba(255, 235, 170, 0.45)");
  rg.addColorStop(0.6, "rgba(255, 200, 100, 0.15)");
  rg.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI * 2); ctx.fill();

  // Draw Specific Theme Artwork
  if (name.includes("kindness") || name.includes("love") || name.includes("peace") || emotion.includes("compassion")) {
    // 3D Glowing Heart of Light & Golden Lotus Rays
    ctx.strokeStyle = "#E8C46E"; ctx.lineWidth = 4;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 50, Math.sin(a) * 50);
      ctx.lineTo(Math.cos(a) * 115, Math.sin(a) * 115);
      ctx.stroke();
    }
    // Heart path
    ctx.fillStyle = "rgba(232, 196, 110, 0.3)";
    ctx.strokeStyle = "#F5E6C8"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 45);
    ctx.bezierCurveTo(-85, -45, -65, -115, 0, -50);
    ctx.bezierCurveTo(65, -115, 85, -45, 0, 45);
    ctx.fill(); ctx.stroke();
    // Inner Golden Glow
    ctx.fillStyle = "#FFD700";
    ctx.beginPath(); ctx.arc(0, -25, 14, 0, Math.PI * 2); ctx.fill();
  } else if (name.includes("learning") || name.includes("wisdom") || name.includes("education") || emotion.includes("wisdom")) {
    // Star of Knowledge & Open Book Rays
    ctx.strokeStyle = "#E8C46E"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 6);
      ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(0, -110); ctx.stroke();
      ctx.restore();
    }
    // Golden Open Book Artwork
    ctx.fillStyle = "rgba(245, 230, 200, 0.9)";
    ctx.strokeStyle = "#E8C46E"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 25);
    ctx.quadraticCurveTo(-50, -15, -95, 5); ctx.lineTo(-95, -55); ctx.quadraticCurveTo(-50, -75, 0, -35);
    ctx.quadraticCurveTo(50, -75, 95, -55); ctx.lineTo(95, 5); ctx.quadraticCurveTo(50, -15, 0, 25);
    ctx.fill(); ctx.stroke();
  } else if (name.includes("diwali") || name.includes("dhanteras") || name.includes("light")) {
    // Festive Diya
    ctx.fillStyle = "#E8C46E"; ctx.beginPath(); ctx.ellipse(0, 50, 140, 60, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = "#FFF"; ctx.lineWidth = 4; ctx.stroke();
    const fg = ctx.createLinearGradient(0, -130, 0, 30);
    fg.addColorStop(0, "#FFFFFF"); fg.addColorStop(0.4, "#FFD700"); fg.addColorStop(1, "#FF4500");
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, -130);
    ctx.bezierCurveTo(70, -40, 40, 20, 0, 30); ctx.bezierCurveTo(-40, 20, -70, -40, 0, -130); ctx.fill();
  } else {
    // Universal Ashok Chakra & Radiant Sunburst
    ctx.strokeStyle = "#E8C46E"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(0, 0, 115, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 24; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 12);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(105, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#E8C46E"; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  }

  // Floating Gold Bokeh Particles
  ctx.fillStyle = "rgba(255, 235, 170, 0.7)";
  const particles = [[-220, -80], [240, -90], [-190, 80], [210, 70], [-120, -110], [140, -100]];
  particles.forEach(([px, py]) => {
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
}

function hero(p){const x=105,y=250,w=870,h=430;ctx.save();rr(x,y,w,h,40);ctx.clip();if(artworkImage){coverDraw(artworkImage,x,y,w,h,Number($("artworkZoom").value),Number($("artworkFocus").value));const ov=ctx.createLinearGradient(x,y,x,y+h);ov.addColorStop(0,"rgba(0,0,0,.04)");ov.addColorStop(1,"rgba(0,0,0,.28)");ctx.fillStyle=ov;ctx.fillRect(x,y,w,h)}else{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,p.b);g.addColorStop(1,p.a);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);generatedHero(p,x,y,w,h)}ctx.restore();ctx.fillStyle="#ffffffdd";rr(135,610,810,44,20);ctx.fill();ctx.fillStyle=p.ink;ctx.textAlign="center";ctx.font="700 20px system-ui";ctx.fillText("INSPIRATION", 540, 639);}
function drawHeroArea(p,x,y,w,h,radius=36,shade=true){
  ctx.save();
  rr(x,y,w,h,radius);
  ctx.clip();
  if(artworkImage){
    coverDraw(artworkImage,x,y,w,h,Number($("artworkZoom").value),Number($("artworkFocus").value));
  } else {
    const themeImg = getThemePhotoImage(rec ? rec.Occasion_English : "", rec ? (rec.Emotion || rec.Visual_Mood) : "", rec ? rec.Category : "");
    if (themeImg && themeImg.complete && themeImg.naturalWidth > 0) {
      coverDraw(themeImg, x, y, w, h, 1, 0);
      const paletteTint = ctx.createLinearGradient(x, y, x + w, y + h);
      paletteTint.addColorStop(0, p.b + "22");
      paletteTint.addColorStop(1, p.accent + "44");
      ctx.fillStyle = paletteTint;
      ctx.fillRect(x, y, w, h);
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, p.b);
      g.addColorStop(1, p.a);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      generatedHero(p, x, y, w, h);
    }
  }
  if(shade){
    const ov=ctx.createLinearGradient(x,y,x,y+h);
    ov.addColorStop(0,"rgba(0,0,0,.04)");
    ov.addColorStop(1,"rgba(0,0,0,.35)");
    ctx.fillStyle=ov;
    ctx.fillRect(x,y,w,h);
  }
  ctx.restore();
}

function drawCompactFooter(p,y=1210){ctx.strokeStyle=p.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,y-25);ctx.lineTo(990,y-25);ctx.stroke();ctx.textAlign="left";ctx.fillStyle=p.ink;ctx.font="700 18px Georgia";ctx.fillText("TODAY'S INSPIRATION",95,y+15);ctx.textAlign="right";ctx.font="italic 700 27px Georgia";ctx.fillText($("signature")?$("signature").value.trim():"Your Name",985,y+15);ctx.font="600 15px system-ui";ctx.fillStyle=p.accent;ctx.fillText(new Date($("date").value+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}),985,y+43)}

function drawRestrainedFooter(p,y=1260,fontFamily='"Manrope",sans-serif'){ctx.strokeStyle=p.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,y-30);ctx.lineTo(990,y-30);ctx.stroke();ctx.textAlign="left";ctx.fillStyle=p.ink;ctx.font='700 16px '+fontFamily;ctx.fillText("TODAY'S INSPIRATION",95,y+5);ctx.textAlign="right";ctx.font='italic 700 24px Georgia';ctx.fillText($("signature")?$("signature").value.trim():"Your Name",985,y+5);ctx.font='600 14px '+fontFamily;ctx.fillStyle=p.accent;ctx.fillText(new Date($("date").value+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}),985,y+30)}

function layoutCheck(en, gu, sig) {
  const issues = [];
  if (!en || !en.lines || en.lines.length === 0) issues.push("English message blank");
  return issues;
}

function getAutoTheme(dateStr) {
  const record = (typeof DATASET !== "undefined" && Array.isArray(DATASET))
    ? (DATASET.find(x => x.Date === dateStr) || rec)
    : rec;
  const theme = [
    record && record.Occasion_English,
    record && (record.Emotion || record.Visual_Mood),
    record && record.Category,
    record && record.Message_English,
    themeTitle()
  ].filter(Boolean).join(" ").toLowerCase();
  let hash = 0;
  for (let i = 0; i < (dateStr || "").length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);
  const paletteKeys = Object.keys(PALETTES);

  let styleName = "Hero Focus";
  if (theme.includes("kindness") || theme.includes("family") || theme.includes("gratitude") || theme.includes("love") || theme.includes("compassion")) {
    styleName = hash % 2 === 0 ? "Hero Focus" : "Modern Glassmorphic";
  } else if (theme.includes("wisdom") || theme.includes("reflection") || theme.includes("spiritual") || theme.includes("peace") || theme.includes("balance") || theme.includes("mindfulness") || theme.includes("faith")) {
    styleName = hash % 2 === 0 ? "Sacred Arch" : "Modern Glassmorphic";
  } else if (theme.includes("courage") || theme.includes("strength") || theme.includes("resilience") || theme.includes("determination") || theme.includes("purpose") || theme.includes("focus") || theme.includes("action")) {
    styleName = hash % 2 === 0 ? "Cinematic Editorial" : "Hero Focus";
  } else {
    const activeManualStyles = ["Modern Glassmorphic", "Hero Focus", "Sacred Arch", "Cinematic Editorial"];
    styleName = activeManualStyles[(hash >> 2) % activeManualStyles.length];
  }

  return {
    palette: paletteKeys[hash % paletteKeys.length],
    style: styleName
  };
}

function drawMandalaCorner(x, y, scaleX, scaleY, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 0.5); ctx.stroke();
  for (let a = 0.1; a < Math.PI * 0.5; a += 0.3) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 45, Math.sin(a) * 45, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function renderGlassmorphic(p_old) {
  const p = { soft: "#ECE5DA", b: "#F3EFE7", a: "#EAE3D7", gold: "#7A3045", accent: "#7A3045", ink: "#2A2A2A" };
  const T = TYPO_PRESETS.A;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const paper = "#F3EFE7";

  // Single continuous paper background
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1080, 1350);

  const imgH = 486;
  const crop = compositionCrop();
  
  // Image placed directly on paper (no local vignette/grain to avoid doubling)
  drawImageFill(p, 0, 0, 1080, imgH, {
    zoom: crop.zoom, focus: crop.focus, focusX: crop.focusX,
    treatment: "Quiet Matte"
  });

  // Global subtle texture over entire canvas (image + paper)
  drawVignette(0, 0, 1080, 1350, 0.04);
  drawGrain(0, 0, 1080, 1350, 0.02);

  const headX = 540;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = p.date || "#82776D";
  ctx.font = '600 32px "Inter",sans-serif';
  ctx.fillText((dt.full || dt.line).toUpperCase(), headX, imgH + 78);

  ctx.fillStyle = p.theme || "#7C3F4B";
  ctx.font = '500 52px "Cormorant Garamond",Georgia,serif';
  ctx.fillText(themeTitle(), headX, imgH + 148);
  ctx.restore();

  ctx.strokeStyle = hexA(p.accent || "#7C3F4B", 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headX - 58, imgH + 176);
  ctx.lineTo(headX + 58, imgH + 176);
  ctx.stroke();

  const en = fitQuote(quote, 920, 520, T.quoteFont, "500", 1.28);
  drawLines(en, 80, imgH + 230, p.message || "#272421", "left");

  drawQuietSig(80, Math.min(imgH + 230 + en.totalHeight + 46, 1264), p.signature || "#7C3F4B", "left", 'italic 500 26px "Cormorant Garamond",Georgia,serif');
  drawQuietBrand(1000, 1292, hexA(p.date || "#82776D", 0.9), "right");
  return { en };
}

function renderRoyalHeritage(p) {
  const T = TYPO_PRESETS.D;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = paperInk(p);
  ctx.fillStyle = p.b;
  ctx.fillRect(0, 0, 1080, 1350);
  drawImageFill(p, 0, 0, 448, 1350, { zoom: 1.2, focus: 0.1, focusX: -0.28, treatment: "Spiritual Indigo", vignette: 0.2, duotone: p.b });
  ctx.fillStyle = "#F4EFE6";
  ctx.fillRect(448, 0, 632, 1350);
  drawGrain(448, 0, 632, 1350, 0.022);
  ctx.fillStyle = hexA(p.gold, 0.55);
  ctx.fillRect(448, 0, 1, 1350);
  ctx.strokeStyle = hexA(p.gold, 0.38);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(476, 48, 22, Math.PI, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(1032, 48, 22, Math.PI * 1.5, 0); ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(ink, 0.48);
  ctx.font = '600 12px "Inter",sans-serif';
  ctx.fillText(dt.compact, 504, 96);
  ctx.fillStyle = p.accent;
  ctx.font = '600 13px "Cinzel",Georgia,serif';
  ctx.fillText(themeTitle().toUpperCase(), 504, 138);
  ctx.strokeStyle = hexA(p.gold, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(504, 158); ctx.lineTo(684, 158); ctx.stroke();
  const en = fitQuote(quote, 500, 900, T.quoteFont, "500", 1.28);
  drawLines(en, 504, 198, ink, "left");
  drawQuietSig(504, Math.min(198 + en.totalHeight + 48, 1248), p.accent, "left", 'italic 500 26px "Cormorant Garamond",Georgia,serif');
  drawQuietBrand(504, 1304, ink, "left");
  return { en };
}

function renderClassic(p) {
  const T = TYPO_PRESETS.C;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = "#2A211C";
  ctx.fillStyle = "#F7F1E6";
  ctx.fillRect(0, 0, 1080, 1350);
  drawGrain(0, 0, 1080, 1350, 0.045);
  ctx.strokeStyle = "rgba(42,33,28,0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 1000, 1270);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(42,33,28,0.45)";
  ctx.font = '600 11px "DM Sans",sans-serif';
  ctx.fillText(dt.month + "  " + dt.year, 88, 92);
  ctx.fillStyle = ink;
  ctx.font = '500 36px "EB Garamond",Georgia,serif';
  ctx.fillText(dt.day, 88, 132);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(42,33,28,0.42)";
  ctx.font = '600 11px "DM Sans",sans-serif';
  ctx.fillText(themeTitle().toUpperCase(), 992, 118);
  drawImageFill(p, 88, 168, 720, 468, { zoom: 1.1, focus: -0.08, focusX: 0.18, treatment: "Warm Film", grain: 0.02 });
  ctx.strokeStyle = hexA(p.gold, 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(88, 668); ctx.lineTo(168, 668); ctx.stroke();
  const en = fitQuote(quote, 900, 500, T.quoteFont, "500", 1.26);
  drawLines(en, 88, 708, ink, "left");
  drawQuietSig(992, 1272, p.accent, "right", 'italic 500 26px "EB Garamond",Georgia,serif');
  drawQuietBrand(88, 1302, ink, "left");
  return { en };
}

function renderHeroFocus(p_old) {
  const p = { soft: "#F9F6F0", b: "#EADFD4", a: "#D4C4B7", gold: "#C19A6B", accent: "#A67A53", ink: "#3E281F" };
  const T = TYPO_PRESETS.A;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const band = p.parchment || "#F4E6D0";
  const isLong = (quote || "").length > 115;
  const imgH = isLong ? 780 : 880;
  const crop = compositionCrop();

  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 1080, 1350);

  drawImageFill(p, 0, 0, 1080, imgH, {
    zoom: crop.zoom, focus: crop.focus, focusX: crop.focusX,
    treatment: "Warm Lifestyle", vignette: 0.06,
    fadeBottom: 0.2, fadeColor: "rgba(244,230,208,0.97)",
    grain: 0.04
  });

  ctx.fillStyle = band;
  ctx.fillRect(0, imgH, 1080, 1350 - imgH);

  const headX = 540;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = p.date || "#8B6A52";
  ctx.font = '600 32px "Inter",sans-serif';
  ctx.fillText((dt.full || dt.line).toUpperCase(), headX, imgH + 58);

  ctx.fillStyle = p.theme || "#5A3A28";
  ctx.font = '500 50px "Cormorant Garamond",Georgia,serif';
  ctx.fillText(themeTitle(), headX, imgH + 116);
  ctx.restore();

  ctx.strokeStyle = hexA(p.gold || "#C4A574", 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(headX - 54, imgH + 138); ctx.lineTo(headX + 54, imgH + 138); ctx.stroke();

  const quoteMaxH = 1350 - imgH - 210;
  const en = fitQuote(quote, 920, quoteMaxH, T.quoteFont, "500", 1.24);
  const quoteY = imgH + 176;
  drawLines(en, 80, quoteY, p.message || "#3D2A1F", "left");

  drawQuietSig(80, Math.min(quoteY + en.totalHeight + 40, 1296), p.signature || "#B08958", "left", 'italic 500 26px "Cormorant Garamond",Georgia,serif');
  drawQuietBrand(1000, 1310, hexA(p.date || "#8B6A52", 0.9), "right");
  return { en };
}

function renderEditorialPremium(p) {
  const T = TYPO_PRESETS.B;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = "#1C1916";
  ctx.fillStyle = "#F3EEE4";
  ctx.fillRect(0, 0, 1080, 1350);

  const isLong = quote.length > 115;
  // Copy-length-aware column proportions:
  // Short/Medium quote: Photo 48% (518px), Type 52% (562px)
  // Long quote: Photo 40% (432px), Type 60% (648px)
  const photoW = isLong ? 432 : 518;
  const typeX = photoW + 48;
  const typeW = 1080 - typeX - 48;

  drawImageFill(p, 0, 0, photoW, 1350, { zoom: 1.16, focus: 0.04, focusX: -0.3, treatment: "Matte Botanical", vignette: 0.14 });

  ctx.fillStyle = "#F3EEE4";
  ctx.fillRect(photoW, 0, 1080 - photoW, 1350);
  ctx.fillStyle = hexA(ink, 0.18);
  ctx.fillRect(photoW, 0, 1, 1350);

  // Vertical Date Treatment on Photo Column
  ctx.save();
  ctx.translate(36, 1180);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.76)";
  ctx.font = '600 11px "Inter",sans-serif';
  ctx.fillText(dt.line, 0, 0);
  ctx.restore();

  // Type Column Header
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(ink, 0.42);
  ctx.font = '600 11px "Inter",sans-serif';
  ctx.fillText("STUDIO  •  " + dt.year, typeX, 84);

  const title = fitBox(themeTitle(), typeW, 120, 48, 26, T.quoteFont, "600", 1.04);
  drawLines(title, typeX, 128, p.accent, "left");

  ctx.strokeStyle = hexA(p.gold, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(typeX, 128 + title.totalHeight + 14); ctx.lineTo(typeX + 168, 128 + title.totalHeight + 14); ctx.stroke();

  const en = fitQuote(quote, typeW, 880, T.quoteFont, "500", 1.24);
  drawLines(en, typeX, 128 + title.totalHeight + 46, ink, "left");

  drawQuietSig(typeX, 1256, p.accent, "left", 'italic 500 22px "Bodoni Moda",Georgia,serif');
  drawQuietBrand(typeX, 1302, ink, "left");
  return { en };
}

function renderSacredArch(p_old) {
  const p = { b: "#0F172A", soft: "#FDFBF7", gold: "#C29B62", accent: "#D4AF37", ink: "#FFFFFF", a: "#1E293B" };
  const T = TYPO_PRESETS.D;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  ctx.fillStyle = "#11182B";
  ctx.fillRect(0, 0, 1080, 1350);
  drawBackgroundJaali(ctx);
  const archX = 70, archY = 36, archW = 940, archH = 820;
  const crop = compositionCrop();
  ctx.save();
  drawSacredArch(ctx, archX, archY, archW, archH);
  ctx.clip();
  drawImageFill(p, archX, archY, archW, archH, {
    zoom: crop.zoom, focus: crop.focus, focusX: crop.focusX,
    treatment: "Sacred Atmosphere", vignette: 0.16, grain: 0.018
  });
  ctx.restore();
  ctx.strokeStyle = hexA(p.gold || "#C4A36A", 0.62);
  ctx.lineWidth = 1.25;
  drawSacredArch(ctx, archX, archY, archW, archH);
  ctx.stroke();
  const headX = archX + archW / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = p.date || "#AAA093";
  ctx.font = '600 32px "Inter",sans-serif';
  ctx.fillText((dt.full || dt.line).toUpperCase(), headX, 900);
  ctx.fillStyle = p.theme || p.gold || "#C4A36A";
  ctx.font = '500 48px "Cinzel",Georgia,serif';
  ctx.fillText(themeTitle().toUpperCase(), headX, 958);
  ctx.restore();
  const en = fitQuote(quote, 900, 250, T.quoteFont, "500", 1.24);
  drawLines(en, 88, 1010, p.message || "#F3EBDD", "left", { color: "rgba(8,12,24,0.35)", blur: 8, y: 1 });
  drawQuietSig(88, Math.min(1010 + en.totalHeight + 40, 1296), p.signature || hexA(p.gold || "#C4A36A", 0.9), "left", 'italic 500 28px "Cinzel",Georgia,serif');
  drawQuietBrand(992, 1312, hexA(p.date || "#AAA093", 0.85), "right");
  return { en };
}

function renderCinematicEditorial(p_old) {
  const p = { b: "#050A15", soft: "#FFFFFF", gold: "#E2D8C0", accent: "#C6B287", ink: "#FFFFFF", a: "#111827" };
  const T = TYPO_PRESETS.B;
  const dt = editorialDate();
  const quote = currentEnglishMessage();

  ctx.fillStyle = "#0B1020";
  ctx.fillRect(0, 0, 1080, 1350);
  const crop = compositionCrop();
  drawImageFill(p, 0, 0, 1080, 1350, {
    zoom: crop.zoom, focus: crop.focus, focusX: crop.focusX,
    treatment: "Cinematic Grade", vignette: 0.2,
    fadeBottom: 0.44, fadeColor: "rgba(11, 16, 32, 0.72)",
    grain: 0.03
  });

  ctx.fillStyle = hexA(p.gold || "#C6A76B", 0.82);
  ctx.fillRect(0, 0, 1080, 3);

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = p.date || "#A9AFBA";
  ctx.font = '600 32px "Inter",sans-serif';
  ctx.fillText((dt.full || dt.line).toUpperCase(), 540, 86);

  ctx.fillStyle = p.theme || "#F7F5EF";
  ctx.font = '700 52px "Bodoni Moda",Georgia,serif';
  ctx.fillText(themeTitle().toUpperCase(), 540, 150);
  ctx.restore();

  const en = fitQuote(quote, 920, 420, T.quoteFont, "500", 1.18);
  const quoteY = Math.min(1040, Math.max(780, 1288 - en.totalHeight - 86));
  drawLines(en, 64, quoteY, p.message || "#F7F5EF", "left", { color: "rgba(6,10,20,0.55)", blur: 14, y: 2 });
  drawQuietSig(64, Math.min(quoteY + en.totalHeight + 38, 1306), p.signature || hexA(p.gold || "#C6A76B", 0.85), "left", 'italic 500 24px "Bodoni Moda",Georgia,serif');
  drawQuietBrand(1016, 1318, "rgba(169, 175, 186, 0.7)", "right");
  return { en };
}

function renderMonumentalTypography(p) {
  const T = TYPO_PRESETS.D;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = paperInk(p);

  // Soft Quiet Background with subtle grain
  ctx.fillStyle = p.soft;
  ctx.fillRect(0, 0, 1080, 1350);
  drawGrain(0, 0, 1080, 1350, 0.03);

  const word = heroKeyword().toUpperCase();
  const len = word.length;

  // 1. UPPER ZONE: Small Metadata Line + Dominant 100% Unobscured Hero Word
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(ink, 0.52);
  ctx.font = '600 12px "Inter",sans-serif';
  ctx.fillText(dt.line, 72, 75);

  // Dynamic Font Sizing for Hero Word with ctx.measureText() bounds checking
  let wordFontSize = 180;
  if (len <= 4) wordFontSize = 220;       // RISE, HOPE
  else if (len <= 7) wordFontSize = 155;  // COURAGE, BELIEVE
  else wordFontSize = 130;                // KINDNESS, GRATITUDE

  ctx.save();
  ctx.textAlign = "left";
  ctx.font = '700 ' + wordFontSize + 'px "Cinzel",Georgia,serif';
  let tw = ctx.measureText(word).width;

  // Ensure hero word fits safely within 930px maximum width bounds
  const maxW = 930;
  if (tw > maxW) {
    wordFontSize = Math.floor(wordFontSize * maxW / tw);
    ctx.font = '700 ' + wordFontSize + 'px "Cinzel",Georgia,serif';
    tw = ctx.measureText(word).width;
  }

  // Draw Hero Word with crisp ink contrast at y = 270 (100% readable, ZERO photo overlap)
  ctx.fillStyle = p.accent;
  ctx.fillText(word, 72, 270);
  ctx.restore();

  // Thin Accent Separator Rule beneath Hero Word
  ctx.strokeStyle = hexA(p.gold, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 305);
  ctx.lineTo(210, 305);
  ctx.stroke();

  // 2. MIDDLE & RIGHT ZONE: Restrained Offset Vertical Photo (Spatially separate below y = 330, ZERO letter overlap)
  const imgX = 560;
  const imgY = 330;
  const imgW = 448;
  const imgH = 680;

  drawImageFill(p, imgX, imgY, imgW, imgH, { zoom: 1.22, focus: 0.08, focusX: 0.22, treatment: "Mono Luxe", vignette: 0.18, grain: 0.02 });

  // Thin Gold Hairline Frame
  ctx.strokeStyle = hexA(p.gold, 0.55);
  ctx.lineWidth = 1;
  ctx.strokeRect(imgX, imgY, imgW, imgH);

  // 3. LOWER-LEFT ZONE: Inspirational Quote & Quiet Signature (Below y = 350)
  const maxQuoteW = 440;
  const en = fitQuote(quote, maxQuoteW, 580, T.quoteFont, "500", 1.24);
  const quoteY = 370;

  drawLines(en, 72, quoteY, ink, "left");

  drawQuietSig(72, Math.min(quoteY + en.totalHeight + 36, 1260), p.accent, "left");
  drawQuietBrand(1008, 1316, hexA(ink, 0.55), "right");
  return { en };
}

function renderPoetryCollage(p) {
  const T = TYPO_PRESETS.C;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = "#2A211C";
  ctx.fillStyle = "#EFE6D6";
  ctx.fillRect(0, 0, 1080, 1350);
  drawGrain(0, 0, 1080, 1350, 0.05);
  ctx.save();
  ctx.translate(92, 78);
  ctx.rotate(-0.012);
  drawImageFill(p, 0, 0, 680, 430, { zoom: 1.08, focus: -0.06, focusX: -0.08, treatment: "Warm Film", grain: 0.03 });
  ctx.restore();
  ctx.save();
  ctx.translate(168, 548);
  ctx.rotate(0.01);
  ctx.fillStyle = "rgba(210, 186, 140, 0.55)";
  ctx.fillRect(0, 0, 46, 16);
  ctx.restore();
  ctx.save();
  ctx.translate(72, 560);
  ctx.rotate(-0.008);
  ctx.fillStyle = "#F7F1E4";
  ctx.fillRect(0, 0, 936, 680);
  ctx.strokeStyle = "rgba(42,33,28,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 916, 660);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(42,33,28,0.42)";
  ctx.font = '600 11px "DM Sans",sans-serif';
  ctx.fillText(dt.line, 108, 620);
  ctx.fillStyle = "rgba(42,33,28,0.55)";
  ctx.font = 'italic 500 16px "EB Garamond",Georgia,serif';
  ctx.fillText(themeTitle(), 108, 648);
  const en = fitQuote(quote, 860, 420, T.quoteFont, "italic 500", 1.32);
  drawLines(en, 108, 700, ink, "left");
  drawQuietSig(108, Math.min(700 + en.totalHeight + 40, 1288), p.accent, "left", 'italic 500 24px "EB Garamond",Georgia,serif');
  drawQuietBrand(992, 1314, ink, "right");
  return { en };
}

function renderGalleryEditorial(p) {
  const T = TYPO_PRESETS.B;
  const dt = editorialDate();
  const quote = currentEnglishMessage();
  const ink = "#1A1714";
  ctx.fillStyle = "#F7F4EE";
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(ink, 0.4);
  ctx.font = '600 11px "Inter",sans-serif';
  ctx.fillText("PLATE  •  " + dt.compact, 88, 72);
  ctx.textAlign = "right";
  ctx.fillText(themeTitle().toUpperCase(), 992, 72);
  drawImageFill(p, 88, 108, 680, 560, { zoom: 1.08, focus: -0.04, focusX: 0.16, treatment: "Mono Luxe", vignette: 0.12, grain: 0.018 });
  ctx.strokeStyle = hexA(ink, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(88, 700); ctx.lineTo(280, 700); ctx.stroke();
  const en = fitQuote(quote, 900, 460, T.quoteFont, "500", 1.22);
  drawLines(en, 88, 746, ink, "left");
  ctx.textAlign = "left";
  ctx.fillStyle = hexA(ink, 0.38);
  ctx.font = '600 11px "Inter",sans-serif';
  ctx.fillText("SERIES 01", 88, 1308);
  drawQuietSig(992, 1288, p.accent, "right", 'italic 500 22px "Bodoni Moda",Georgia,serif');
  drawQuietBrand(992, 1316, ink, "right");
  return { en };
}


function renderNeonTheme(p_old) {
  const p = { b: "#0A0D17", soft: "#141A2F", gold: "#54E6FF", accent: "#FF5ACD", ink: "#F8FAFF", a: "#A7B1C9" };
  const T = TYPO_PRESETS.A;
  const dt = editorialDate();
  const quote = currentEnglishMessage();

  // Background
  ctx.fillStyle = p.b;
  ctx.fillRect(0, 0, 1080, 1350);

  // Optional subtle image
  const crop = compositionCrop();
  ctx.globalAlpha = 0.15; // Extremely subdued
  drawImageFill(p, 0, 0, 1080, 1350, {
    zoom: crop.zoom, focus: crop.focus, focusX: crop.focusX,
    treatment: "Cinematic Grade"
  });
  ctx.globalAlpha = 1.0;

  // Blue-violet haze
  const wash = ctx.createRadialGradient(540, 675, 200, 540, 675, 800);
  wash.addColorStop(0, "rgba(84,230,255,0.06)");
  wash.addColorStop(1, "rgba(84,230,255,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1080, 1350);

  // Very soft global vignette & texture
  drawVignette(0, 0, 1080, 1350, 0.15);
  drawGrain(0, 0, 1080, 1350, 0.025);

  ctx.textAlign = "center";
  
  const en = fitQuote(quote, 820, 600, '500 52px "Inter",sans-serif', "500", 1.35);
  
  // Layout spacing
  // Total height calculation to center the block slightly above middle
  const totalH = 40 + 80 + 120 + (en.lines.length * 70); 
  let currentY = (1350 - totalH) / 2;
  // Shift slightly up for premium poster feel
  currentY -= 60;

  // Date
  ctx.fillStyle = p.a; // #A7B1C9
  ctx.font = '600 22px "Inter",sans-serif';
  ctx.shadowColor = p.gold;
  ctx.shadowBlur = 4; // Minimal glow
  ctx.fillText((dt.full || dt.line).toUpperCase(), 540, currentY);
  currentY += 80;

  // Theme
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 72px "Inter",sans-serif';
  ctx.shadowColor = p.gold; // #54E6FF
  ctx.shadowBlur = 24; // Strongest glow
  ctx.fillText(themeTitle().toUpperCase(), 540, currentY);
  // Optional second layer for sharp core + soft outer
  ctx.shadowBlur = 0;
  ctx.fillText(themeTitle().toUpperCase(), 540, currentY);
  currentY += 140;

  // Message
  ctx.shadowColor = "rgba(84,230,255,0.4)";
  ctx.shadowBlur = 12; // Restrained glow for readability
  ctx.font = '400 52px "Inter",sans-serif';
  ctx.fillStyle = p.ink; // #F8FAFF
  en.lines.forEach((line) => {
    ctx.fillText(line, 540, currentY);
    currentY += 70;
  });
  
  currentY += 60;

  // Signature
  ctx.shadowColor = p.accent; // #FF5ACD
  ctx.shadowBlur = 8;
  drawQuietSig(540, currentY, p.a, "center", 'italic 400 24px "Inter",sans-serif');
  
  // Brand
  ctx.shadowBlur = 0;
  drawQuietBrand(540, 1280, hexA(p.a, 0.5), "center");

  return { en };
}

function render() {
  if(_rendering) return;
  _rendering=true;
  try {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.filter = "none";
  ctx.beginPath();
  ctx.clearRect(0, 0, 1080, 1350);
  if(!rec) return;
  let pName = palette || "Vedic Indigo";
  let styleName = $("style") ? $("style").value : "Auto Theme";

  if (styleName === "Auto Theme") {
    const auto = getAutoTheme($("date").value);
    styleName = auto.style;
    pName = auto.palette;
  }
  _activePosterStyle = styleName;
  const userP = PALETTES[pName] || PALETTES["Vedic Indigo"];
  const p = composeArtPalette(styleName, userP);

  let fits = { en: { lines: [] } };
  try {
    if (styleName === "Sacred Arch") fits = renderSacredArch(p);
    else if (styleName === "Cinematic Editorial") fits = renderCinematicEditorial(p);
    else if (styleName === "Neon") fits = renderNeonTheme(p);
    else if (styleName === "Monumental Typography") fits = renderMonumentalTypography(p);
    else if (styleName === "Poetry Collage") fits = renderPoetryCollage(p);
    else if (styleName === "Gallery Editorial") fits = renderGalleryEditorial(p);
    else if (styleName === "Modern Glassmorphic") fits = renderGlassmorphic(p);
    else if (styleName === "Royal Heritage") fits = renderRoyalHeritage(p);
    else if (styleName === "Classic Inspiration") fits = renderClassic(p);
    else if (styleName === "Editorial Premium") fits = renderEditorialPremium(p);
    else if (styleName === "Hero Focus") fits = renderHeroFocus(p);
    else fits = renderGlassmorphic(p);
  } catch (err) {
    console.error("Render error:", err);
    ctx.fillStyle = "#FFFDF9";
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = "#cc0000";
    ctx.font = "700 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Render Error: " + (err.message || "Unknown"), 540, 675);
  }

  const issues = layoutCheck(fits ? fits.en : null, null, $("signature") ? $("signature").value : "");
  generatedKey = key();
  if ($("download")) $("download").disabled = false;
  if ($("sharePoster")) $("sharePoster").disabled = false;
  if ($("status")) $("status").textContent = "Generated \u2022 " + styleName + " \u2022 1080 \u00d7 1350";
  syncStyleChips();
  } finally {
    _rendering = false;
  }
}

function customMap(){return store.get("iis-custom-messages",{})}
function currentCustom(){return customMap()[rec.Date]||null}
function applyCustomIfAny(){const c=currentCustom();if(c){$("messageEn").value=c.en;if($("messageGu"))$("messageGu").value=c.gu||""}updateEditorState()}
function updateEditorState(){const c=currentCustom();const saved=c&&$("messageEn").value===c.en;if($("editDot"))$("editDot").classList.toggle("custom",Boolean(c));if($("editStateText"))$("editStateText").textContent=c?(saved?"Custom message saved":"Custom message exists — unsaved changes"):"Original dataset message"}
function lineCount(text){return text?text.split(/\r?\n/).length:0}
function estimatedFit(text,lang){
  if(!text||!text.trim())return{label:"Message is blank",cls:"fit-bad"};
  const fitResult=fit(text.trim(),800,8,44,22,"Georgia");
  const lines=fitResult.lines.length;
  const sz=fitResult.size;
  if(sz>=36&&lines<=5)return{label:"Fits perfectly",cls:"fit-good"};
  if(sz>=26&&lines<=8)return{label:"May need smaller font",cls:"fit-warn"};
  return{label:"Too long for selected layout",cls:"fit-bad"};
}
function updateEditorMetrics(){
  const en = $("messageEn") ? $("messageEn").value : "";
  if ($("enCount")) $("enCount").textContent = en.length + " characters \u2022 " + lineCount(en) + " lines";
  const ef = estimatedFit(en, "en");
  if ($("enFit")) { $("enFit").textContent = ef.label; $("enFit").className = ef.cls; }
  updateEditorState();
}
function saveCustomMessages(){const en=$("messageEn").value.trim();if(!en){$("savedNotice").textContent="English message is required.";return}const gu=$("messageGu")?$("messageGu").value.trim():"";const all=customMap();all[rec.Date]={en,gu,savedAt:new Date().toISOString()};store.set("iis-custom-messages",all);$("savedNotice").textContent="Saved";updateEditorMetrics();invalidate()}
function resetEnglish(){$("messageEn").value=removeWeekdayReference(rec.Message_English,"en");updateEditorMetrics();invalidate()}
function resetGujarati(){if($("messageGu"))$("messageGu").value=removeWeekdayReference(rec.Message_Gujarati||"","gu");updateEditorMetrics();invalidate()}
function restoreOriginal(){const all=customMap();delete all[rec.Date];store.set("iis-custom-messages",all);$("messageEn").value=removeWeekdayReference(rec.Message_English,"en");if($("messageGu"))$("messageGu").value=removeWeekdayReference(rec.Message_Gujarati||"","gu");$("savedNotice").textContent="Original restored";updateEditorMetrics();invalidate();render()}




const IMAGE_DB_NAME="daily-inspiration-images";
const IMAGE_DB_VERSION=1;
const IMAGE_STORE="generatedImages";
function openImageDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(IMAGE_DB_NAME,IMAGE_DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(IMAGE_STORE)){const s=db.createObjectStore(IMAGE_STORE,{keyPath:"id"});s.createIndex("createdAt","createdAt")}};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error)
  })
}
async function saveGeneratedImage(blob,meta){
  if(!blob)return;
  try{
    const db=await openImageDb();
    const tx=db.transaction(IMAGE_STORE,"readwrite");
    tx.objectStore(IMAGE_STORE).put({
      id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt:new Date().toISOString(),
      size:blob.size||0,
      blob,
      meta
    });
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
    updateImageStorageStats()
  }catch{}
}
async function listGeneratedImages(){
  try{
    const db=await openImageDb();
    const tx=db.transaction(IMAGE_STORE,"readonly");
    const req=tx.objectStore(IMAGE_STORE).getAll();
    const rows=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});
    db.close();return rows
  }catch{return []}
}
async function deleteGeneratedImagesOlderThan(days){
  const cutoff=Date.now()-days*86400000;
  try{
    const db=await openImageDb();
    const tx=db.transaction(IMAGE_STORE,"readwrite");
    const storeObj=tx.objectStore(IMAGE_STORE);
    const req=storeObj.openCursor();
    let removed=0;
    await new Promise((resolve,reject)=>{
      req.onsuccess=()=>{const cur=req.result;if(!cur)return resolve();if(new Date(cur.value.createdAt).getTime()<cutoff){cur.delete();removed++}cur.continue()};
      req.onerror=()=>reject(req.error)
    });
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
    localStorage.setItem("daily-inspiration-last-cleanup",new Date().toISOString());
    await updateImageStorageStats();
    return removed
  }catch{return 0}
}
async function deleteAllGeneratedImages(){
  try{
    const db=await openImageDb();
    const tx=db.transaction(IMAGE_STORE,"readwrite");
    tx.objectStore(IMAGE_STORE).clear();
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
    localStorage.setItem("daily-inspiration-last-cleanup",new Date().toISOString());
    await updateImageStorageStats()
  }catch{}
}
async function updateImageStorageStats(){
  const rows=await listGeneratedImages();
  const bytes=rows.reduce((sum,row)=>sum+(row.size||0),0);
  if($("storedImageCount"))$("storedImageCount").textContent=String(rows.length);
  if($("storedImageSize"))$("storedImageSize").textContent=`${(bytes/1048576).toFixed(2)} MB`;
  const last=localStorage.getItem("daily-inspiration-last-cleanup");
  if($("lastCleanup"))$("lastCleanup").value=last?new Date(last).toLocaleString("en-IN"):"Never"
}
async function runScheduledCleanup(){
  const mode=localStorage.getItem("daily-inspiration-cleanup-mode")||"off";
  if(mode!=="7")return;
  const last=localStorage.getItem("daily-inspiration-last-cleanup");
  if(!last||Date.now()-new Date(last).getTime()>=7*86400000){
    await deleteGeneratedImagesOlderThan(7)
  }
}

function preferences(){return store.get("daily-inspiration-preferences",{signature:"Dr. Atul",palette:"Festival Gold",style:"Classic Inspiration"})}
function applyPreferences(){const p=preferences();$("signature").value = p.signature !== undefined ? p.signature : "Dr. Atul";if(PALETTES[p.palette])palette=p.palette;$("style").value=resolveVisibleStyle(p.style)}
function populateSettings(){const p=preferences();$("defaultSignature").value = p.signature !== undefined ? p.signature : "Dr. Atul";clearNode($("defaultPalette"));Object.keys(PALETTES).forEach(name=>{const o=document.createElement("option");o.value=o.textContent=name;$("defaultPalette").appendChild(o)});clearNode($("defaultStyle"));STYLES.forEach(name=>{const o=document.createElement("option");o.value=o.textContent=name;$("defaultStyle").appendChild(o)});$("defaultPalette").value=p.palette||"Festival Gold";$("defaultStyle").value=resolveVisibleStyle(p.style)}
function savePreferences(){const p={signature:$("defaultSignature").value.trim(),palette:$("defaultPalette").value,style:$("defaultStyle").value};store.set("daily-inspiration-preferences",p);$("signature").value=p.signature;palette=p.palette;$("style").value=p.style;syncPalette();invalidate();render();showToast("Preferences saved")}
function resetPreferences(){store.set("daily-inspiration-preferences",{signature:"Dr. Atul",palette:"Festival Gold",style:"Classic Inspiration"});populateSettings();applyPreferences();syncPalette();invalidate();render();showToast("Preferences reset")}
function loadCleanupSettings(){
  if(!$("cleanupMode"))return;
  $("cleanupMode").value=localStorage.getItem("daily-inspiration-cleanup-mode")||"off";
  updateImageStorageStats()
}
function saveCleanupMode(){
  localStorage.setItem("daily-inspiration-cleanup-mode",$("cleanupMode").value);
  showToast("Cleanup preference saved")
}


function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(showToast._timer);showToast._timer=setTimeout(()=>t.classList.remove("show"),1800)}
function englishCaption(){const sig=$("signature")?$("signature").value.trim():"Dr. Atul";const sigStr=sig?`\n\n— ${sig}`:"";return `${$("occasionEn").value}\n\n${currentEnglishMessage()}${sigStr}`;}
function gujaratiCaption(){const occ=$("occasionGu");const title=occ?occ.value:(rec&&rec.Occasion_Gujarati?rec.Occasion_Gujarati:"");const sig=$("signature")?$("signature").value.trim():"Dr. Atul";const sigStr=sig?`\n\n— ${sig}`:"";return `${title}\n\n${currentGujaratiMessage()}${sigStr}`;}
function bilingualCaption(){return `${englishCaption()}\n\n${gujaratiCaption()}`}
async function copyText(text,label){try{await navigator.clipboard.writeText(text);showToast(`${label} copied`)}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();showToast(`${label} copied`)}}
function canvasBlob(){return new Promise(resolve=>cvs.toBlob(resolve,"image/png"))}
async function shareCurrentPoster(){
 if(generatedKey!==key())return invalidate();
 const blob=await canvasBlob();if(!blob){showToast("Unable to prepare PNG");return}
 const file=new File([blob],`${$("date").value}_${$("occasionEn").value.replace(/[^a-z0-9]+/gi,"-")}_EN-GU.png`,{type:"image/png"});
 const data={title:$("occasionEn").value,text:bilingualCaption(),files:[file]};
 try{
   if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share(data);showToast("Share sheet opened")}
   else if(navigator.share){await navigator.share({title:data.title,text:data.text});showToast("Caption shared")}
   else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("PNG downloaded; caption copied");await copyText(data.text,"Bilingual caption")}
 }catch(err){if(err&&err.name!=="AbortError")showToast("Sharing failed")}
}
function exportUserEdits(){
 const payload={app:"Daily Inspiration",version:"2.3",exportedAt:new Date().toISOString(),customMessages:customMap(),favorites:favoriteDates(),signature:$("signature").value};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Daily_Inspiration_My_Backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("Edits exported")
}
function importUserEdits(file){
 if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result);if(!payload.customMessages||typeof payload.customMessages!=="object")throw new Error("Invalid backup");store.set("iis-custom-messages",payload.customMessages);if(Array.isArray(payload.favorites))store.set("iis-favorites",payload.favorites);if(payload.signature)$("signature").value=payload.signature;applyCustomIfAny();updateEditorMetrics();updateFavoriteButton();invalidate();render();showToast("Edits imported")}catch{showToast("Invalid edits backup")}};reader.readAsText(file)
}

function getLocalDateString(d=new Date()){
  const year=d.getFullYear();
  const month=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}
function getTodayDatasetDate(){
  const todayStr=getLocalDateString();
  if(DATASET.some(r=>r.Date===todayStr)) return todayStr;
  const year=todayStr.slice(0,4);
  const sameYearDates=DATASET.filter(r=>r.Date.startsWith(year+'-'));
  if(sameYearDates.length>0){
    const todayMs=new Date(todayStr+'T00:00:00').getTime();
    const sorted=sameYearDates.slice().sort((a,b)=>{
      return Math.abs(new Date(a.Date+'T00:00:00').getTime()-todayMs) - Math.abs(new Date(b.Date+'T00:00:00').getTime()-todayMs);
    });
    return sorted[0].Date;
  }
  return DATASET[0].Date;
}
function load(d){rec=DATASET.find(x=>x.Date===d)||DATASET[0];$("date").value=rec.Date;$("occasionEn").value=rec.Occasion_English;if($("occasionGu"))$("occasionGu").value=rec.Occasion_Gujarati||"";$("messageEn").value=removeWeekdayReference(rec.Message_English,"en");if($("messageGu"))$("messageGu").value=removeWeekdayReference(rec.Message_Gujarati||"","gu");palette=PALETTES[rec.Palette]?rec.Palette:"Festival Gold";$("style").value=resolveVisibleStyle(rec.Style);$("context").textContent=rec.Cultural_Context;$("emotion").textContent=rec.Emotion||rec.Visual_Mood;$("category").textContent=rec.Category;$("why").textContent=rec.Why_This_Day;$("why").classList.remove("show");clearArtwork(false);syncPalette();applyCustomIfAny();updateEditorMetrics();invalidate();render();updateFavoriteButton()}
function syncPalette(){document.querySelectorAll(".swatch").forEach(b=>b.classList.toggle("active",b.dataset.p===palette))}
function setArtwork(file){if(!file)return;const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{if(artworkImage&&artworkImage._url)URL.revokeObjectURL(artworkImage._url);img._url=url;artworkImage=img;artworkId=`${file.name}:${file.size}:${file.lastModified}`;clearNode($("artworkPreview"));const p=document.createElement("img");p.src=url;$("artworkPreview").appendChild(p);$("artworkZoom").value="1";$("artworkFocus").value="0";invalidate();render()};img.onerror=()=>{URL.revokeObjectURL(url);alert("Unable to load this image.")};img.src=url}
function clearArtwork(doRender=true){if(artworkImage&&artworkImage._url)URL.revokeObjectURL(artworkImage._url);artworkImage=null;artworkId="none";$("artworkPreview").textContent="No local artwork selected";$("artworkFile").value="";$("artworkZoom").value="1";$("artworkFocus").value="0";invalidate();if(doRender)render()}
function addHistory(){let h=store.get("iis-history",[]);const qaEl=$("layoutQa");h.unshift({date:rec.Date,occasion:$("occasionEn").value,when:new Date().toISOString(),palette,style:$("style").value,artwork:artworkImage?"local":"motif",layoutQa:qaEl?qaEl.textContent:""});h=h.slice(0,30);store.set("iis-history",h);renderHistory()}
function favoriteDates(){return store.get("iis-favorites",[])}
function toggleFavorite(){let f=favoriteDates();f=f.includes(rec.Date)?f.filter(x=>x!==rec.Date):[...f,rec.Date];store.set("iis-favorites",f);updateFavoriteButton();renderFavorites()}
function updateFavoriteButton(){$("favoriteBtn").textContent=favoriteDates().includes(rec.Date)?"Remove favorite":"Add to favorites"}
function clearNode(node){while(node.firstChild)node.removeChild(node.firstChild)}
function appendTextElement(parent,tag,text,className=""){
 const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(text??"");parent.appendChild(el);return el
}
function emptyState(box,message){clearNode(box);appendTextElement(box,"div",message,"empty")}
function card(r){
 const d=document.createElement("article");d.className="card";
 appendTextElement(d,"div",r.Date,"date");appendTextElement(d,"h3",r.Occasion_English);appendTextElement(d,"div",r.Occasion_Gujarati,"gu");
 appendTextElement(d,"p",removeWeekdayReference(r.Message_English,"en"));const gu=appendTextElement(d,"p",removeWeekdayReference(r.Message_Gujarati,"gu"));gu.lang="gu";
 const actions=document.createElement("div");actions.className="card-actions";const open=appendTextElement(actions,"button","Open","primary open");open.type="button";open.onclick=()=>{show("studio");load(r.Date)};d.appendChild(actions);return d
}
function renderCalendar(){const q=$("search").value.toLowerCase(),m=$("monthFilter").value,c=$("categoryFilter").value,x=$("contextFilter").value;const box=$("calendarCards");clearNode(box);const list=DATASET.filter(r=>(!q||JSON.stringify(r).toLowerCase().includes(q))&&(!m||r.Date.slice(5,7)===m)&&(!c||r.Category===c)&&(!x||r.Cultural_Context===x));if(!list.length){emptyState(box,"No matching days.");return}list.slice(0,120).forEach(r=>box.appendChild(card(r)))}
function renderFavorites(){const box=$("favoriteCards");clearNode(box);const list=DATASET.filter(r=>favoriteDates().includes(r.Date));if(!list.length){emptyState(box,"No favorites saved.");return}list.forEach(r=>box.appendChild(card(r)))}
function renderHistory(){const box=$("historyList");clearNode(box);const list=store.get("iis-history",[]);if(!list.length){emptyState(box,"No generated-poster history.");return}list.forEach(h=>{const d=document.createElement("div");d.className="history-item";const info=document.createElement("div");appendTextElement(info,"strong",h.occasion);info.appendChild(document.createElement("br"));appendTextElement(info,"small",`${h.date} • ${new Date(h.when).toLocaleString("en-IN")} • ${h.artwork||"motif"} • ${h.layoutQa||""}`);const button=appendTextElement(d,"button","Open","secondary");button.type="button";button.onclick=()=>{show("studio");load(h.date)};d.insertBefore(info,button);box.appendChild(d)})}
function runDatasetQa(){const failures=[],warnings=[];const dates=new Set();const en=new Map(),gu=new Map();for(const r of DATASET){if(dates.has(r.Date))failures.push(`${r.Date}: duplicate date`);dates.add(r.Date);if(!/^2026-\d{2}-\d{2}$/.test(r.Date))failures.push(`${r.Date}: invalid date format`);if(!r.Occasion_English||!r.Occasion_Gujarati||!r.Message_English||!r.Message_Gujarati)failures.push(`${r.Date}: blank required field`);if(!/[\u0A80-\u0AFF]/.test(r.Message_Gujarati))failures.push(`${r.Date}: Gujarati Unicode missing`);if(!PALETTES[r.Palette])failures.push(`${r.Date}: unsupported palette ${r.Palette}`);if(!r.Style)failures.push(`${r.Date}: blank source style`);if(r.Message_English.length>240)warnings.push(`${r.Date}: long English message (${r.Message_English.length})`);if(r.Message_Gujarati.length>220)warnings.push(`${r.Date}: long Gujarati message (${r.Message_Gujarati.length})`);en.set(r.Message_English,(en.get(r.Message_English)||0)+1);gu.set(r.Message_Gujarati,(gu.get(r.Message_Gujarati)||0)+1)}
for(const [t,n] of en)if(n>1)warnings.push(`English message repeated ${n} times: ${t.slice(0,70)}…`);for(const [t,n] of gu)if(n>1)warnings.push(`Gujarati message repeated ${n} times: ${t.slice(0,70)}…`);
const jan=DATASET.find(r=>r.Date==="2026-01-01");if(!jan||!["Global","Western"].includes(jan.Cultural_Context))failures.push("1 January must use Global or Western context");
qaReport={generatedAt:new Date().toISOString(),rows:DATASET.length,uniqueDates:dates.size,failures,warnings,pass:failures.length===0&&DATASET.length===365&&dates.size===365};renderQa();return qaReport}
function renderQa(){
 const summary=$("qaSummary"),list=$("qaList");clearNode(summary);clearNode(list);
 [["Rows",qaReport.rows],["Unique dates",qaReport.uniqueDates],["Failures",qaReport.failures.length],["Warnings",qaReport.warnings.length]].forEach(([label,value])=>{const item=document.createElement("div");item.className="meta";appendTextElement(item,"b",label);appendTextElement(item,"span",value);summary.appendChild(item)});
 const top=document.createElement("div");top.className="qa-item";appendTextElement(top,"strong","Overall result");appendTextElement(top,"span",qaReport.pass?"PASS":"FAIL",qaReport.pass?"qa-pass":"qa-fail");list.appendChild(top);
 [...qaReport.failures.map(x=>["FAIL",x]),...qaReport.warnings.map(x=>["WARN",x])].slice(0,200).forEach(([type,message])=>{const item=document.createElement("div");item.className="qa-item";appendTextElement(item,"strong",type,type==="FAIL"?"qa-fail":"");appendTextElement(item,"span",message);list.appendChild(item)});
 if(!qaReport.failures.length&&!qaReport.warnings.length){const item=document.createElement("div");item.className="qa-item";item.textContent="No dataset issues detected.";list.appendChild(item)}
}
function exportQa(){if(!qaReport)runDatasetQa();const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(qaReport,null,2)],{type:"application/json"}));a.download="Daily_Inspiration_v2_3_QA_Report.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.screen===id));if(id==="calendar")renderCalendar();if(id==="contacts")renderContacts();if(id==="favorites")renderFavorites();if(id==="history")renderHistory();if(id==="qa"&&!qaReport)runDatasetQa()}



const SMART_THEMES=["VIP Family", "Executive Blue", "Nature Green", "Classic Gold", "Premium Gift", "Black & Gold Luxury", "Navy Ribbon Premium", "White Marble", "Marble with Cake", "Burgundy Luxury"];
const MESSAGE_LIBRARY={
 "Birthday":{
  "Classic":(n,a)=>`Happy Birthday, ${n}! Wishing you good health, happiness and many wonderful years ahead.`,
  "Modern":(n,a)=>`Happy Birthday, ${n}! May the year ahead bring fresh opportunities, joyful moments and lasting memories.`,
  "Inspirational":(n,a)=>`Happy Birthday, ${n}! May every new year inspire bigger dreams, stronger purpose and greater happiness.`
 },
 "Festival Greeting":{
  "Classic":(n,a)=>a?`Warm wishes to you and your loved ones for ${a}, ${n}. May the occasion bring peace, good health and meaningful time together.`:`Warm festival wishes, ${n}. May the occasion bring peace, good health and meaningful time with those who matter most.`,
  "Modern":(n,a)=>a?`Wishing you a joyful ${a}, ${n}. May its celebrations bring renewed energy, warm connections and lasting memories.`:`Festival wishes, ${n}. May the celebration bring renewed energy, warm connections and lasting memories.`,
  "Inspirational":(n,a)=>a?`May ${a} inspire hope, gratitude and a stronger sense of purpose, ${n}. Wishing you and your loved ones a meaningful celebration.`:`May this festive occasion inspire hope, gratitude and a stronger sense of purpose, ${n}. Wishing you and your loved ones a meaningful celebration.`
 },
 "Wedding Anniversary":{
  "Classic":(n,a)=>`Happy Anniversary, ${n}! Wishing you many more years of love, trust and togetherness.`,
  "Modern":(n,a)=>`Happy Anniversary, ${n}! May your journey together keep growing with laughter, warmth and beautiful memories.`,
  "Inspirational":(n,a)=>`Happy Anniversary, ${n}! A strong partnership turns shared dreams into a meaningful life.`
 },
 "Retirement":{
  "Classic":(n,a)=>`Happy Retirement, ${n}! Wishing you peace, good health and a fulfilling new chapter.`,
  "Modern":(n,a)=>`Happy Retirement, ${n}! May the days ahead bring freedom, travel, rest and new experiences.`,
  "Inspirational":(n,a)=>`Happy Retirement, ${n}! A completed career opens the door to fresh purpose and joyful possibilities.`
 },
 "Graduation":{
  "Classic":(n,a)=>`Congratulations, ${n}! Your hard work has earned a proud and well-deserved success.`,
  "Modern":(n,a)=>`Congratulations, ${n}! A new chapter begins with bigger possibilities and exciting opportunities.`,
  "Inspirational":(n,a)=>`Congratulations, ${n}! Let this achievement become the first step toward an even greater future.`
 },
 "Housewarming":{
  "Classic":(n,a)=>`Happy Housewarming, ${n}! May this home always be filled with peace, warmth and happiness.`,
  "Modern":(n,a)=>`Happy Housewarming, ${n}! May every room hold laughter, comfort and beautiful memories.`,
  "Inspirational":(n,a)=>`Happy Housewarming, ${n}! A new home is the beginning of many meaningful family moments.`
 },
 "Vacation Memory":{
  "Classic":(n,a)=>`Beautiful memories, ${n}! May this journey remain a treasured part of life.`,
  "Modern":(n,a)=>`Beautiful memories, ${n}! Great trips end, but their happiest moments stay forever.`,
  "Inspirational":(n,a)=>`Beautiful memories, ${n}! Every journey adds a new story to life.`
 },
 "Family Reunion":{
  "Classic":(n,a)=>`Together again, ${n}! Family time creates memories that remain close to the heart.`,
  "Modern":(n,a)=>`Together again, ${n}! Shared laughter makes every family gathering unforgettable.`,
  "Inspirational":(n,a)=>`Together again, ${n}! Strong families grow through time, care and togetherness.`
 },
 "New Baby":{
  "Classic":(n,a)=>`Welcome, ${n}! May this little one bring endless love, joy and blessings.`,
  "Modern":(n,a)=>`Welcome, ${n}! A tiny arrival has created a whole new world of happiness.`,
  "Inspirational":(n,a)=>`Welcome, ${n}! Every new life brings fresh hope and beautiful possibilities.`
 },
 "Thank You":{
  "Classic":(n,a)=>`Thank you, ${n}. Your kindness and support are deeply appreciated.`,
  "Modern":(n,a)=>`Thank you, ${n}. Your thoughtful gesture made a real and meaningful difference.`,
  "Inspirational":(n,a)=>`Thank you, ${n}. Kindness becomes powerful when it reaches someone at the right moment.`
 },
 "Get Well Soon":{
  "Classic":(n,a)=>`Get well soon, ${n}. Wishing you strength, comfort and a smooth recovery.`,
  "Modern":(n,a)=>`Get well soon, ${n}. Rest well and return stronger each day.`,
  "Inspirational":(n,a)=>`Get well soon, ${n}. Recovery begins with hope, patience and steady strength.`
 },
 "Congratulations":{
  "Classic":(n,a)=>a?`Congratulations on your ${a.toLowerCase()}, ${n}! Wishing you continued success and many more achievements.`:`Congratulations, ${n}! Wishing you continued success and many more achievements.`,
  "Modern":(n,a)=>a?`Congratulations on your ${a.toLowerCase()}, ${n}! May this milestone bring new opportunities and greater success.`:`Congratulations, ${n}! May this milestone bring new opportunities and greater success.`,
  "Inspirational":(n,a)=>a?`Congratulations on your ${a.toLowerCase()}, ${n}! Let this achievement inspire the next big step in your journey.`:`Congratulations, ${n}! Let this achievement inspire the next big step in your journey.`
 },
 "Achievement":{
  "Classic":(n,a)=>a?`Well done, ${n}! Your ${a.toLowerCase()} is a proud result of dedication and hard work.`:`Well done, ${n}! This achievement is a proud result of dedication and hard work.`,
  "Modern":(n,a)=>a?`Well done, ${n}! Your ${a.toLowerCase()} marks an exciting new milestone.`:`Well done, ${n}! This success marks an exciting new milestone.`,
  "Inspirational":(n,a)=>a?`Well done, ${n}! Your ${a.toLowerCase()} proves that focused effort creates remarkable results.`:`Well done, ${n}! Focused effort creates remarkable results.`
 },
 "Custom Occasion":{
  "Classic":(n,a)=>`Best wishes, ${n}! May this special occasion bring happiness and memorable moments.`,
  "Modern":(n,a)=>`Best wishes, ${n}! Celebrate this moment and enjoy every memory it creates.`,
  "Inspirational":(n,a)=>`Best wishes, ${n}! Every meaningful occasion can become the start of something beautiful.`
 }
};

const CANVA_TEMPLATE_DATA={"Executive Blue": "artwork/BuiltIn/executive-blue.jpg", "Nature Green": "artwork/BuiltIn/nature-green.jpg", "Classic Gold": "artwork/BuiltIn/classic-gold.jpg", "Premium Gift": "artwork/BuiltIn/premium-gift.jpg", "Black & Gold Luxury": "artwork/BuiltIn/black-and-gold-luxury.jpg", "Navy Ribbon Premium": "artwork/BuiltIn/navy-ribbon-premium.jpg", "White Marble": "artwork/BuiltIn/white-marble.jpg", "Marble with Cake": "artwork/BuiltIn/marble-with-cake.jpg", "Burgundy Luxury": "artwork/BuiltIn/burgundy-luxury.jpg"};
const CANVA_TEMPLATE_STYLE={"Executive Blue": {"panel": "#F6F1E8", "ink": "#18243B", "accent": "#B89145", "dark": false}, "Nature Green": {"panel": "#F4F0E5", "ink": "#173A2C", "accent": "#A88445", "dark": false}, "Classic Gold": {"panel": "#FBF4E5", "ink": "#552D2E", "accent": "#B28A45", "dark": false}, "Premium Gift": {"panel": "#FBF2E2", "ink": "#58322F", "accent": "#AE8543", "dark": false}, "Black & Gold Luxury": {"panel": "#161616", "ink": "#FFF6E4", "accent": "#D7B766", "dark": true}, "Navy Ribbon Premium": {"panel": "#17233D", "ink": "#FFF7E9", "accent": "#D6B76C", "dark": true}, "White Marble": {"panel": "#FAF5E9", "ink": "#30343C", "accent": "#B38B4B", "dark": false}, "Marble with Cake": {"panel": "#F8F5EE", "ink": "#1D2A3E", "accent": "#B78D45", "dark": false}, "VIP Family": {"panel": "#0D1B2A", "ink": "#F4EBD9", "accent": "#D4AF37", "dark": true},
    "Burgundy Luxury": {"panel": "#FBF2E8", "ink": "#612F3A", "accent": "#B38A4E", "dark": false}};
const CANVA_TEMPLATE_IMAGES={};
const CANVA_TEMPLATE_FAILED={};
// Templates are packaged files rather than inline data, so they resolve asynchronously.
// Until one loads, gRender() falls back to a palette gradient, which reads as a different
// design. Repaint when artwork arrives, restoring the export-gate state exactly so the
// repaint is purely visual and never enables/disables Download or Share on its own.
function repaintAfterTemplateLoad(){
 if(document.readyState==="loading")return;
 if(typeof gRender!=="function")return;
 const st=$("gStatus"),sh=$("gShare"),dl=$("gDownload");
 if(!st||!sh||!dl)return;
 const key=gGeneratedKey,text=st.textContent,shareOff=sh.disabled,downOff=dl.disabled;
 try{gRender()}catch(e){return}
 gGeneratedKey=key;st.textContent=text;sh.disabled=shareOff;dl.disabled=downOff;
}
Object.entries(CANVA_TEMPLATE_DATA).forEach(([name,src])=>{
 const img=new Image();
 img.onload=repaintAfterTemplateLoad;
 img.onerror=()=>{CANVA_TEMPLATE_FAILED[name]=true;console.warn("Template artwork failed to load:",name,src)};
 img.src=src;
 CANVA_TEMPLATE_IMAGES[name]=img;
});
function canvaTemplateReady(name){
 const img=CANVA_TEMPLATE_IMAGES[name];
 return !!(img&&img.complete&&img.naturalWidth);
}
function drawCanvaTemplate(name){
 const img=CANVA_TEMPLATE_IMAGES[name];
 if(!canvaTemplateReady(name))return false;
 gCtx.drawImage(img,0,0,1080,1350);
 return true;
}


let gEditedPhoto=null;
let gPhotoEditState={zoom:1,offsetX:0,offsetY:0,shape:"portrait"};
let gEditorDragging=false,gEditorLastX=0,gEditorLastY=0,gEditorPinchStart=0,gEditorZoomStart=1;

function activeGreetingPhoto(){return gEditedPhoto||gPhoto}

function editorCropRect(){
  const c=$("gPhotoEditorCanvas"),w=c.width,h=c.height;
  const shape=$("gEditorShape").value;
  if(shape==="square"||shape==="circle"){
    const s=Math.min(w,h)*0.72;
    return {x:(w-s)/2,y:(h-s)/2,w:s,h:s,shape};
  }
  const cw=w*0.64,ch=h*0.78;
  return {x:(w-cw)/2,y:(h-ch)/2,w:cw,h:ch,shape};
}

function drawPhotoEditor(){
  const c=$("gPhotoEditorCanvas"),ctx=c.getContext("2d"),img=gPhoto;
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle="#151515";ctx.fillRect(0,0,c.width,c.height);
  if(!img)return;
  const r=editorCropRect();
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
  const base=Math.max(r.w/iw,r.h/ih);
  const scale=base*gPhotoEditState.zoom;
  const dw=iw*scale,dh=ih*scale;
  const dx=r.x+(r.w-dw)/2+gPhotoEditState.offsetX;
  const dy=r.y+(r.h-dh)/2+gPhotoEditState.offsetY;
  ctx.drawImage(img,dx,dy,dw,dh);

  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.58)";
  ctx.beginPath();ctx.rect(0,0,c.width,c.height);
  if(r.shape==="circle")ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w/2,0,Math.PI*2,true);
  else ctx.roundRect(r.x,r.y,r.w,r.h,26);
  ctx.fill("evenodd");
  ctx.restore();

  ctx.save();
  ctx.strokeStyle="#D7B766";ctx.lineWidth=6;
  ctx.beginPath();
  if(r.shape==="circle")ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w/2,0,Math.PI*2);
  else ctx.roundRect(r.x,r.y,r.w,r.h,26);
  ctx.stroke();
  ctx.restore();
}

function openPhotoEditor(){
  if(!gPhoto){alert("Select a photo first.");return}
  gPhotoEditState={zoom:1,offsetX:0,offsetY:0,shape:"portrait"};
  $("gEditorZoom").value="1";$("gEditorShape").value="portrait";
  $("gPhotoEditor").classList.add("show");
  $("gPhotoEditor").setAttribute("aria-hidden","false");
  drawPhotoEditor();
}
function closePhotoEditor(){
  $("gPhotoEditor").classList.remove("show");
  $("gPhotoEditor").setAttribute("aria-hidden","true");
}
function applyPhotoEditor(){
 if(!gPhoto)return;const r=editorCropRect(),iw=gPhoto.naturalWidth||gPhoto.width,ih=gPhoto.naturalHeight||gPhoto.height;
 const base=Math.max(r.w/iw,r.h/ih),scale=base*gPhotoEditState.zoom,dw=iw*scale,dh=ih*scale;
 const dx=r.x+(r.w-dw)/2+gPhotoEditState.offsetX,dy=r.y+(r.h-dh)/2+gPhotoEditState.offsetY;
 const sx=Math.max(0,(r.x-dx)/scale),sy=Math.max(0,(r.y-dy)/scale),sw=Math.min(iw-sx,r.w/scale),sh=Math.min(ih-sy,r.h/scale);
 const outCanvas=document.createElement("canvas");outCanvas.width=r.shape==="portrait"?800:1000;outCanvas.height=1000;const o=outCanvas.getContext("2d");o.imageSmoothingEnabled=true;o.imageSmoothingQuality="high";
 o.drawImage(gPhoto,sx,sy,sw,sh,0,0,outCanvas.width,outCanvas.height);
 const img=new Image();img.onload=()=>{gEditedPhoto=img;gPhotoId="edited-"+Date.now();$("gPhotoZoom").value="1";$("gPhotoFocusX").value="0";$("gPhotoFocus").value="0";closePhotoEditor();gRender()};img.src=outCanvas.toDataURL("image/png")
}

function contactStore(){return store.get("daily-inspiration-contacts",[])}
function greetingHistory(){return store.get("daily-inspiration-history-lite",[])}
function saveGreetingMemory(){
 const name=$("gName").value.trim();
 if(!name)return;
 const rows=greetingHistory();
 rows.unshift({name:name.toLowerCase(),displayName:name,occasion:$("gOccasion").value,year:new Date($("gDate").value||Date.now()).getFullYear(),theme:$("gDesign").value,style:$("gMessageStyle").value});
 store.set("daily-inspiration-history-lite",rows.slice(0,300));
 updateGreetingHistoryNote()
}
function updateGreetingHistoryNote(){
 const name=$("gName").value.trim().toLowerCase();
 const occ=$("gOccasion").value;
 const rows=greetingHistory().filter(x=>x.name===name&&x.occasion===occ).sort((a,b)=>b.year-a.year);
 $("gHistoryNote").textContent=rows.length?`Last used: ${rows[0].theme} • ${rows[0].style} • ${rows[0].year}`:"First greeting for this person."
}
function dayThemeIndex(date){
 const d=new Date((date||new Date().toISOString().slice(0,10))+"T00:00:00");
 return (d.getDay()+d.getMonth()*2+d.getDate())%SMART_THEMES.length
}
function chooseSmartTheme(){
 const mode=$("gDesignMode").value;
 if(mode==="manual")return $("gDesign").value;
 const contact=$("gName").value.trim().toLowerCase();
 const recent=greetingHistory().filter(x=>x.name===contact).slice(0,10).map(x=>x.theme);
 let pool=SMART_THEMES.filter(t=>!recent.includes(t));
 if(!pool.length)pool=SMART_THEMES.filter(t=>t!==recent[0]);
 if(!pool.length)pool=[...SMART_THEMES];
 const idx=mode==="random"
   ? Math.floor(Math.random()*pool.length)
   : dayThemeIndex($("gDate").value)%pool.length;
 const selected=pool[idx];
 $("gDesign").value=selected;
 return selected
}
function getBirthdayMessage(name, rel, style) {
  const isSpouse = ["Wife", "Husband", "Spouse", "Fiancée", "Fiancé"].includes(rel);
  const isMedical = rel === "Medical Batchmate";
  const isProfessional = ["Colleague", "Doctor", "Teacher"].includes(rel);
  const isFamily = ["Mother", "Father", "Daughter", "Son", "Sister", "Brother", "Grandmother", "Grandfather", "Granddaughter", "Grandson", "Aunt", "Uncle", "Cousin", "Family", "Relative"].includes(rel);

  if (isSpouse) {
    if (style === "Modern") {
      return name
        ? `Happy Birthday, ${name}! May your day be filled with warm laughter, beautiful surprises and bright moments together.`
        : `Wishing you a wonderful birthday, filled with warm laughter, beautiful surprises and bright moments together.`;
    } else if (style === "Inspirational") {
      return name
        ? `Happy Birthday, ${name}! May every new year bring deeper happiness, shared dreams and lasting peace.`
        : `May every new year bring deeper happiness, shared dreams and lasting peace.`;
    } else {
      return name
        ? `Wishing you a beautiful birthday filled with happiness, good health and cherished moments, ${name}. May the year ahead bring you joy, peace and many wonderful memories together.`
        : `Wishing you a beautiful birthday filled with happiness, good health and cherished moments. May the year ahead bring joy, peace and many wonderful memories together.`;
    }
  }

  if (isMedical) {
    if (style === "Modern") {
      return name
        ? `Happy Birthday, ${name}! Here's to another great year of noble service, good health and well-deserved success.`
        : `Happy Birthday! Here's to another great year of noble service, good health and well-deserved success.`;
    } else if (style === "Inspirational") {
      return name
        ? `Happy Birthday, ${name}! May your dedication to health and healing continue to inspire everyone around you.`
        : `May your dedication to health and healing continue to inspire everyone around you.`;
    } else {
      return name
        ? `Wishing you a very Happy Birthday, ${name}! May the year ahead bring good health, professional fulfillment and continued success.`
        : `Wishing you a very Happy Birthday! May the year ahead bring good health, professional fulfillment and continued success.`;
    }
  }

  if (isProfessional) {
    if (style === "Modern") {
      return name
        ? `Happy Birthday, ${name}! Wishing you an excellent year filled with new achievements, rewarding work and great health.`
        : `Wishing you an excellent year filled with new achievements, rewarding work and great health.`;
    } else if (style === "Inspirational") {
      return name
        ? `Happy Birthday, ${name}! May your hard work and commitment continue to bring meaningful progress and success.`
        : `May hard work and commitment continue to bring meaningful progress and success.`;
    } else {
      return name
        ? `Wishing you a very Happy Birthday, ${name}. May the year ahead bring continued success, good health and prosperity.`
        : `Wishing you a very Happy Birthday. May the year ahead bring continued success, good health and prosperity.`;
    }
  }

  if (isFamily) {
    if (style === "Modern") {
      return name
        ? `Happy Birthday, ${name}! May the coming year bring wonderful memories, good health and abundant joy.`
        : `May the coming year bring wonderful memories, good health and abundant joy.`;
    } else if (style === "Inspirational") {
      return name
        ? `Happy Birthday, ${name}! May your warmth and presence continue to bring strength and joy to our family.`
        : `May warm presence and care continue to bring strength and joy to our family.`;
    } else {
      return name
        ? `Wishing you a joyful and blessed birthday, ${name}! May your day be filled with warm family moments, health and happiness.`
        : `Wishing you a joyful and blessed birthday! May your day be filled with warm family moments, health and happiness.`;
    }
  }

  if (style === "Modern") {
    return name
      ? `Happy Birthday, ${name}! May the year ahead bring fresh opportunities, joyful moments and lasting memories.`
      : `Happy Birthday! May the year ahead bring fresh opportunities, joyful moments and lasting memories.`;
  } else if (style === "Inspirational") {
    return name
      ? `Happy Birthday, ${name}! May every new year inspire bigger dreams, stronger purpose and greater happiness.`
      : `May every new year inspire bigger dreams, stronger purpose and greater happiness.`;
  } else {
    return name
      ? `Happy Birthday, ${name}! Wishing you good health, happiness and many wonderful years ahead.`
      : `Wishing a very Happy Birthday! May the year ahead bring good health, happiness and many wonderful years.`;
  }
}

function generateSmartMessage(){
  const occ = $("gOccasion").value;
  const style = $("gMessageStyle").value;
  const tone = $("gTone").value;
  const audience = $("gAudience").value;
  const rel = $("gRelation").value || "Friend";
  const rawName = $("gName").value.trim();
  const n2 = $("gSecondName").value.trim();
  const detail = $("gDetail").value.trim();
  const age = Number($("gAge").value) || 0;
  const years = Number($("gYears").value) || 0;

  let name = rawName;
  if (occ === "Wedding Anniversary" && n2) {
    name = rawName ? `${rawName} & ${n2}` : `Couple & ${n2}`;
  }

  let title = "";
  if (name) {
    if (occ === "Birthday") {
      if (["Wife", "Husband", "Spouse", "Fiancée", "Fiancé"].includes(rel) && tone === "Heartfelt") {
        title = `Happy Birthday, My Dear ${name}!`;
      } else {
        title = `Happy Birthday, ${name}!`;
      }
    } else if (occ === "Festival Greeting") {
      title = detail ? `${detail} Wishes, ${name}!` : `Festival Wishes, ${name}!`;
    } else if (occ === "Wedding Anniversary") {
      title = `Happy Anniversary, ${name}!`;
    } else if (occ === "Congratulations") {
      title = `Congratulations, ${name}!`;
    } else if (occ === "Achievement") {
      title = `Well Done, ${name}!`;
    } else if (occ === "Get Well Soon") {
      title = `Get Well Soon, ${name}`;
    } else if (occ === "Thank You") {
      title = `Thank You, ${name}`;
    } else if (occ === "New Baby") {
      title = `Welcome, ${name}!`;
    } else if (occ === "Family Reunion") {
      title = `Together Again — ${name}`;
    } else if (occ === "Vacation Memory") {
      title = `Beautiful Memories, ${name}`;
    } else if (occ === "Retirement") {
      title = `Happy Retirement, ${name}!`;
    } else if (occ === "Housewarming") {
      title = `Happy Housewarming, ${name}!`;
    } else if (occ === "Graduation") {
      title = `Congratulations, ${name}!`;
    } else {
      title = `Best Wishes, ${name}!`;
    }
  } else {
    const fallbackTitles = {
      "Birthday": "Happy Birthday!",
      "Festival Greeting": detail ? `${detail} Wishes!` : "Festival Wishes!",
      "Wedding Anniversary": "Happy Anniversary!",
      "Congratulations": "Congratulations!",
      "Achievement": "Well Done!",
      "Get Well Soon": "Get Well Soon",
      "Thank You": "Thank You",
      "New Baby": "Welcome Little One!",
      "Family Reunion": "Family Together Again!",
      "Vacation Memory": "Beautiful Memories!",
      "Retirement": "Happy Retirement!",
      "Housewarming": "Happy Housewarming!",
      "Graduation": "Congratulations!",
      "Custom Occasion": "Warmest Wishes!"
    };
    title = fallbackTitles[occ] || "Warmest Wishes!";
  }

  const toneLeads = {
    Heartfelt: "With warm affection, ",
    Elegant: "With warm regards, ",
    Inspirational: "May this moment inspire you: ",
    Formal: "Please accept our sincere wishes: ",
    Joyful: "With great joy, ",
    Religious: "With prayers and blessings, ",
    Simple: ""
  };
  const toneLead = toneLeads[tone] || "";

  let body = "";
  const fnMap = MESSAGE_LIBRARY[occ] || MESSAGE_LIBRARY["Custom Occasion"];

  if (occ === "Birthday") {
    body = getBirthdayMessage(name, rel, style);
  } else {
    const fn = fnMap[style] || fnMap["Classic"];
    body = fn(name || "Friend", detail);
  }

  let ageText = "";
  const isMilestoneAge = [18, 21, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100].includes(age);
  if (occ === "Birthday" && age > 0 && (isMilestoneAge || style === "Inspirational")) {
    ageText = ` Celebrating your ${ordinal(age)} birthday is a wonderful milestone.`;
  }

  const yearsAllowed = new Set(["Wedding Anniversary", "Retirement", "Work Anniversary", "Personal Milestone"]);
  const yearsText = yearsAllowed.has(occ) && years ? ` ${years} years make this occasion especially meaningful.` : "";
  const audienceText = audience === "medical" ? " May your compassion, skill and service continue to strengthen every life you touch." : "";

function combineToneLeadAndBody(toneLead, body) {
  if (!toneLead) return body;
  if (body.startsWith("Happy Birthday") || body.startsWith("Best wishes") || body.startsWith("Congratulations") || body.startsWith("Well done")) {
    return body;
  }
  if (toneLead.endsWith(", ") && body.length > 0) {
    return toneLead + body.charAt(0).toLowerCase() + body.slice(1);
  }
  return toneLead + body;
}

  $("gTitleEn").value = title;
  $("gMessageEn").value = combineToneLeadAndBody(toneLead, body) + ageText + yearsText + audienceText;

  gMetrics();
  gInvalidate();
  updateGreetingHistoryNote();
}

function renderContacts(){
 const q=($("cSearch")?.value||"").toLowerCase();const rows=contactStore().filter(c=>!q||JSON.stringify(c).toLowerCase().includes(q));const box=$("contactList");if(!box)return;clearNode(box);
 const today=new Date(),mmdd=String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");const todays=rows.filter(c=>(c.birthday||"").slice(5)===mmdd||(c.anniversary||"").slice(5)===mmdd);
 const stats=$("todayContacts");clearNode(stats);[["Today's greetings",todays.length],["Total contacts",rows.length]].forEach(([label,value])=>{const item=document.createElement("div");item.className="meta";appendTextElement(item,"b",label);appendTextElement(item,"span",value);stats.appendChild(item)});
 rows.forEach(c=>{const d=document.createElement("article");d.className="card";appendTextElement(d,"h3",c.name);appendTextElement(d,"div",c.relationship||"","date");appendTextElement(d,"p",`Birthday: ${c.birthday||"—"}
Anniversary: ${c.anniversary||"—"}`);const actions=document.createElement("div");actions.className="card-actions";const use=appendTextElement(actions,"button","Create greeting","primary use"),del=appendTextElement(actions,"button","Delete","secondary del");use.type=del.type="button";use.onclick=()=>{show("greeting");$("gName").value=c.name;$("gRelation").value=c.relationship||"Friend";if(c.theme){$("gDesignMode").value="manual";$("gDesign").value=c.theme}updateGreetingHistoryNote();generateSmartMessage();gRender()};del.onclick=()=>{store.set("daily-inspiration-contacts",contactStore().filter(x=>x.id!==c.id));renderContacts()};d.appendChild(actions);box.appendChild(d)})
}
function saveContact(){
 const name=$("cName").value.trim();if(!name){showToast("Name is required");return}
 const rows=contactStore();rows.push({id:Date.now(),name,relationship:$("cRelation").value,birthday:$("cBirthday").value,anniversary:$("cAnniversary").value,theme:$("cTheme").value,notes:$("cNotes").value.trim()});
 store.set("daily-inspiration-contacts",rows);clearContactForm();renderContacts();showToast("Contact saved")
}
function clearContactForm(){["cName","cBirthday","cAnniversary","cNotes"].forEach(id=>$(id).value="");$("cTheme").value=""}
function initContacts(){
 GREETING_RELATIONS.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("cRelation").appendChild(o)});
 SMART_THEMES.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("cTheme").appendChild(o)});
 $("cSave").onclick=saveContact;$("cClear").onclick=clearContactForm;$("cSearch").oninput=renderContacts;renderContacts()
}

const GREETING_OCCASIONS=["Birthday","Festival Greeting","Wedding Anniversary","Retirement","Graduation","Housewarming","Vacation Memory","Family Reunion","New Baby","Thank You","Get Well Soon","Congratulations","Achievement","Custom Occasion"];
const GREETING_RELATIONS=["Wife","Husband","Spouse","Couple","Fiancée","Fiancé","Mother","Father","Daughter","Son","Sister","Brother","Grandmother","Grandfather","Granddaughter","Grandson","Aunt","Uncle","Cousin","Family","Friend","Colleague","Medical Batchmate","Relative","Teacher","Doctor","Neighbour","Other"];
const GREETING_TONES=["Heartfelt","Elegant","Inspirational","Formal","Joyful","Religious","Simple"];
const GREETING_DESIGNS=[...SMART_THEMES];
const gCanvas=$("gPoster"),gCtx=gCanvas.getContext("2d");
let gPhoto=null,gPhotoUrl="",gPhotoId="none",gGeneratedKey="";

function gKey(){
  return JSON.stringify([
    $("gOccasion").value,$("gName").value,$("gSecondName").value,$("gAge").value,$("gYears").value,$("gDetail").value,$("gRelation").value,
    $("gTone").value,$("gDate").value,$("gTitleEn").value,$("gMessageEn").value,
    $("gDesignMode").value,$("gDesign").value,$("gMessageStyle").value,$("gAudience").value,gPhotoId,$("gPhotoStyle").value,$("gPhotoZoom").value,$("gPhotoFocusX").value,$("gPhotoFocus").value
  ])
}
function gInvalidate(){
  gGeneratedKey="";
  $("gShare").disabled=true;
  $("gDownload").disabled=true;
  $("gStatus").textContent="Changes detected — generate the greeting again."
}
function gMetrics(){
  const en=$("gMessageEn").value;
  $("gEnCount").textContent=`${en.length} characters`;
  const ef=estimatedFit(en,"en");
  $("gEnFit").textContent=ef.label;
  $("gEnFit").className=ef.cls
}
function ordinal(n){
  const v=n%100;
  return n+(["th","st","nd","rd"][(v-20)%10]||["th","st","nd","rd"][v]||"th")
}

function gConfigureFields(){
  const o=$("gOccasion").value;
  const show=(id,yes)=>$(id).style.display=yes?"block":"none";
  $("gNameLabel").textContent="Recipient name";
  $("gSecondNameLabel").textContent="Second person name (optional)";
  $("gAgeLabel").textContent="Age (optional)";
  $("gYearsLabel").textContent="Years / milestone (optional)";
  $("gDetailLabel").textContent="Additional detail (optional)";
  $("gDetail").placeholder="Optional detail";

  show("gSecondNameField",false);
  show("gAgeField",false);
  show("gYearsField",false);
  show("gDetailField",true);

  if(o==="Birthday"){
    show("gAgeField",true);
    $("gAgeLabel").textContent="Age (optional)";
    $("gDetailLabel").textContent="Nickname / special quality (optional)";
    $("gDetail").placeholder="e.g. Our sunshine";
  }else if(o==="Wedding Anniversary"){
    $("gNameLabel").textContent="First person name";
    show("gSecondNameField",true);
    show("gYearsField",true);
    $("gSecondNameLabel").textContent="Second person name";
    $("gYearsLabel").textContent="Anniversary year (optional)";
    $("gDetailLabel").textContent="Family name / short note (optional)";
    $("gDetail").placeholder="e.g. Shah Family";
  }else if(o==="Retirement"){
    show("gYearsField",true);
    $("gYearsLabel").textContent="Years of service (optional)";
    $("gDetailLabel").textContent="Designation / department (optional)";
    $("gDetail").placeholder="e.g. Medical Officer";
  }else if(o==="Graduation"){
    $("gDetailLabel").textContent="Degree / course (optional)";
    $("gDetail").placeholder="e.g. MBBS";
  }else if(o==="Housewarming"){
    $("gNameLabel").textContent="Person / family name";
    $("gDetailLabel").textContent="Home name / city (optional)";
    $("gDetail").placeholder="e.g. Shanti Nivas";
  }else if(o==="Vacation Memory"){
    $("gNameLabel").textContent="Person / family name";
    $("gDetailLabel").textContent="Destination / year (optional)";
    $("gDetail").placeholder="e.g. Kashmir 2026";
  }else if(o==="Family Reunion"){
    $("gNameLabel").textContent="Family name";
    $("gDetailLabel").textContent="Place / year (optional)";
    $("gDetail").placeholder="e.g. Ahmedabad 2026";
  }else if(o==="New Baby"){
    $("gNameLabel").textContent="Baby name";
    $("gDetailLabel").textContent="Parents / birth detail (optional)";
    $("gDetail").placeholder="e.g. Daughter of Amit & Neha";
  }else if(o==="Get Well Soon"){
    $("gDetailLabel").textContent="Short supportive note (optional)";
    $("gDetail").placeholder="e.g. We are all with you";
  }else if(o==="Achievement"||o==="Congratulations"){
    $("gDetailLabel").textContent="Achievement / award (optional)";
    $("gDetail").placeholder="e.g. Promotion, Gold Medal";
  }else if(o==="Custom Occasion"){
    $("gDetailLabel").textContent="Occasion detail (optional)";
    $("gDetail").placeholder="Describe the occasion";
  }
}

function gDefaults(){
  gConfigureFields();
  const o=$("gOccasion").value;
  const n=$("gName").value.trim()||"Dear Friend";
  const n2=$("gSecondName").value.trim();
  const age=Number($("gAge").value)||0;
  const years=Number($("gYears").value)||0;
  const detail=$("gDetail").value.trim();
  const ageText=age?` on your ${ordinal(age)} birthday`:"";
  const coupleName=n2?`${n} & ${n2}`:n;
  const anniversaryText=years?` as you celebrate ${years} wonderful years together`:"";
  const serviceText=years?` after ${years} years of dedicated service`:"";
  const detailSuffix=detail?` ${detail}.`:"";
  const map={
    "Birthday":[`Happy Birthday, ${n}!`,`Wishing you joy, good health and beautiful memories${ageText}.`],
    "Wedding Anniversary":[`Happy Anniversary, ${coupleName}!`,`May love, trust and togetherness grow stronger with every passing year${anniversaryText}.`],
    "Retirement":[`Happy Retirement, ${n}!`,`May this new chapter bring peace, freedom and fulfilling experiences${serviceText}.`],
    "Graduation":[`Congratulations, ${n}!`,`Your dedication has opened the door to a promising future.${detailSuffix}`],
    "Housewarming":[`Happy Housewarming, ${n}!`,`May this home always be filled with peace, warmth and happiness.${detailSuffix}`],
    "Vacation Memory":[`Beautiful Memories, ${detail||n}`,`Some journeys end, but their happiest moments stay with us forever.`],
    "Family Reunion":[`Together Again — ${n}`,`Family moments become the memories we treasure for a lifetime.${detailSuffix}`],
    "New Baby":[`Welcome, ${n}!`,`May this new life fill every heart with joy and wonder.${detailSuffix}`],
    "Thank You":[`Thank You, ${n}`,`Your kindness and support have made a meaningful difference.`],
    "Get Well Soon":[`Get Well Soon, ${n}`,`Wishing you strength, comfort and a smooth recovery.`],
    "Congratulations":[`Congratulations, ${n}!`,`May this achievement lead to many more proud moments.${detailSuffix}`],
    "Achievement":[`Well Done, ${n}!`,`Hard work and determination have created a proud achievement.${detailSuffix}`],
    "Custom Occasion":[`${n}`,`Wishing you happiness and memorable moments on this special occasion.`]
  };
  const v=map[o]||map["Custom Occasion"];
  $("gTitleEn").value=v[0];
  $("gMessageEn").value=v[1];
  gMetrics();
  gInvalidate()
}
function gSetPhoto(file){
  if(!file)return;
  const img=new Image();
  const url=URL.createObjectURL(file);
  img.onload=()=>{
    if(gPhotoUrl)URL.revokeObjectURL(gPhotoUrl);
    gPhoto=img;
    gPhotoUrl=url;
    gPhotoId=`${file.name}:${file.size}:${file.lastModified}`;
    clearNode($("gPhotoPreview"));
    const p=document.createElement("img");
    p.src=url;
    $("gPhotoPreview").appendChild(p);
    $("gPhotoZoom").value="1";
    $("gPhotoFocusX").value="0";
    $("gPhotoFocus").value="0.45";
    gInvalidate();
    gRender()
  };
  img.onerror=()=>{
    URL.revokeObjectURL(url);
    showToast("Unable to load photo")
  };
  img.src=url
}
function updateMobileLivePreview(){
  const box=$("gMobileLivePreviewBox");
  if(!box)return;
  const hasPhoto=!!activeGreetingPhoto()&&$("gPhotoStyle").value!=="none";
  box.classList.toggle("show",hasPhoto);
  if(hasPhoto){
    const liveCvs=$("gLivePhotoCanvas");
    if(liveCvs&&gCanvas){
      const lCtx=liveCvs.getContext("2d");
      lCtx.clearRect(0,0,360,450);
      lCtx.drawImage(gCanvas,0,0,1080,1350,0,0,360,450);
    }
  }
}
function updatePhotoControls(){const enabled=$("gPhotoStyle").value!=="none";$("gPhotoControls").style.opacity=enabled?"1":".45";$("gPhotoControls").querySelectorAll("input").forEach(el=>el.disabled=!enabled);$("gEditPhoto").disabled=!enabled;updateMobileLivePreview()}
function gClearPhoto(doRender=true){
  if(gPhotoUrl)URL.revokeObjectURL(gPhotoUrl);
  gPhoto=null;
  gPhotoUrl="";
  gPhotoId="none";
  $("gPhotoPreview").textContent="No photo selected";
  $("gPhotoFile").value="";
  $("gPhotoZoom").value="1";
  $("gPhotoFocusX").value="0";
  $("gPhotoFocus").value="0.45";
  gInvalidate();
  if(doRender)gRender()
}
function gPalette(){
  const d = ($("gDesign") && $("gDesign").value) ? $("gDesign").value : "VIP Family";
  if (typeof GREETING_PALETTES !== "undefined" && GREETING_PALETTES[d]) return GREETING_PALETTES[d];
  return { a: "#8E2E21", b: "#C75E22", soft: "#FFF8EA", accent: "#8E2E21", gold: "#E5B85D", ink: "#381D15" };
}
function gCoverDraw(img,x,y,w,h,zoom,focusY,focusX=0){
  const iw=img.naturalWidth||img.width;
  const ih=img.naturalHeight||img.height;
  const scale=Math.max(w/iw,h/ih)*zoom;
  const sw=w/scale,sh=h/scale;
  let sx=(iw-sw)/2+focusX*(iw-sw)/2;
  let sy=(ih-sh)/2+focusY*(ih-sh)/2;
  sx=Math.max(0,Math.min(iw-sw,sx));
  sy=Math.max(0,Math.min(ih-sh,sy));
  gCtx.drawImage(img,sx,sy,sw,sh,x,y,w,h)
}

const TEMPLATE_PHOTO_ZONES = {
    "VIP Family": {
      large: { px: 615, py: 70, pw: 400, ph: 1210, radius: 24, isCircle: false },
      small: { px: 660, py: 480, pw: 310, ph: 420, radius: 20, isCircle: false },
      circle: { px: 635, py: 510, pw: 360, ph: 360, radius: 180, isCircle: true }
    },
    "Premium Portrait Split": {
      large: { px: 615, py: 70, pw: 400, ph: 1210, radius: 24, isCircle: false },
      small: { px: 660, py: 480, pw: 310, ph: 420, radius: 20, isCircle: false },
      circle: { px: 635, py: 510, pw: 360, ph: 360, radius: 180, isCircle: true }
    },
    "Executive Blue": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Nature Green": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Classic Gold": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Premium Gift": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Black & Gold Luxury": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Navy Ribbon Premium": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "White Marble": {
      large: { px: 740, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 810, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 755, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Marble with Cake": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    },
    "Burgundy Luxury": {
      large: { px: 80, py: 960, pw: 260, ph: 330, radius: 26, isCircle: false },
      small: { px: 80, py: 1030, pw: 190, ph: 240, radius: 20, isCircle: false },
      circle: { px: 85, py: 980, pw: 240, ph: 240, radius: 120, isCircle: true }
    }
  };

function drawBirthdayDecorations(gCtx) {
  // 1. Gold Corner Filigree Ornaments
  gCtx.save();
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 3;
  gCtx.beginPath(); gCtx.arc(50, 50, 15, Math.PI, Math.PI * 1.5); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 50, 15, Math.PI * 1.5, 0); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(50, 1300, 15, Math.PI * 0.5, Math.PI); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 1300, 15, 0, Math.PI * 0.5); gCtx.stroke();
  gCtx.restore();

  // 2. Birthday Cake & Lit Candles (Lower Left Decorative Area X=175, Y=1120)
  gCtx.save();
  const cakeX = 175;
  const cakeY = 1120;
  gCtx.fillStyle = "#F5E6C8";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 3;
  gCtx.fillRect(cakeX - 60, cakeY, 120, 50);
  gCtx.strokeRect(cakeX - 60, cakeY, 120, 50);

  gCtx.fillStyle = "#D4AF37";
  for (let bx = -50; bx <= 40; bx += 20) {
    gCtx.beginPath();
    gCtx.arc(cakeX + bx + 5, cakeY, 6, 0, Math.PI);
    gCtx.fill();
  }

  gCtx.fillStyle = "#FFF9ED";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 3;
  gCtx.fillRect(cakeX - 40, cakeY - 40, 80, 40);
  gCtx.strokeRect(cakeX - 40, cakeY - 40, 80, 40);

  gCtx.fillStyle = "#D4AF37";
  for (let tx = -30; tx <= 20; tx += 15) {
    gCtx.beginPath();
    gCtx.arc(cakeX + tx + 5, cakeY - 40, 5, 0, Math.PI);
    gCtx.fill();
  }

  const candleXs = [-20, 0, 20];
  candleXs.forEach(cxOffset => {
    const candX = cakeX + cxOffset;
    const candY = cakeY - 40;
    gCtx.fillStyle = "#E5C158";
    gCtx.fillRect(candX - 3, candY - 20, 6, 20);
    gCtx.strokeStyle = "#4A3B18";
    gCtx.lineWidth = 1.5;
    gCtx.beginPath();
    gCtx.moveTo(candX, candY - 20);
    gCtx.lineTo(candX, candY - 24);
    gCtx.stroke();
    const flameGrad = gCtx.createRadialGradient(candX, candY - 28, 1, candX, candY - 28, 8);
    flameGrad.addColorStop(0, "#FFFFFF");
    flameGrad.addColorStop(0.3, "#FFD700");
    flameGrad.addColorStop(1, "rgba(255, 140, 0, 0)");
    gCtx.fillStyle = flameGrad;
    gCtx.beginPath();
    gCtx.arc(candX, candY - 28, 8, 0, Math.PI * 2);
    gCtx.fill();
  });
  gCtx.restore();

  // 3. Gift Boxes with Gold Ribbons (Lower Center X=320/395, Y=1110)
  gCtx.save();
  const g1X = 320, g1Y = 1110, g1W = 65, g1H = 60;
  gCtx.fillStyle = "#12223A";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 2.5;
  gCtx.fillRect(g1X, g1Y, g1W, g1H);
  gCtx.strokeRect(g1X, g1Y, g1W, g1H);
  gCtx.fillStyle = "#D4AF37";
  gCtx.fillRect(g1X + g1W / 2 - 5, g1Y, 10, g1H);
  gCtx.fillRect(g1X, g1Y + g1H / 2 - 5, g1W, 10);
  gCtx.beginPath();
  gCtx.arc(g1X + g1W / 2 - 8, g1Y - 4, 8, 0, Math.PI * 2);
  gCtx.arc(g1X + g1W / 2 + 8, g1Y - 4, 8, 0, Math.PI * 2);
  gCtx.fill();

  const g2X = 395, g2Y = 1125, g2W = 55, g2H = 45;
  gCtx.fillStyle = "#F5E6C8";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 2;
  gCtx.fillRect(g2X, g2Y, g2W, g2H);
  gCtx.strokeRect(g2X, g2Y, g2W, g2H);
  gCtx.fillStyle = "#D4AF37";
  gCtx.fillRect(g2X + g2W / 2 - 4, g2Y, 8, g2H);
  gCtx.beginPath();
  gCtx.arc(g2X + g2W / 2 - 6, g2Y - 3, 6, 0, Math.PI * 2);
  gCtx.arc(g2X + g2W / 2 + 6, g2Y - 3, 6, 0, Math.PI * 2);
  gCtx.fill();
  gCtx.restore();

  // 4. Shiny Metallic Balloons Clusters
  function drawSingleBalloon(bx, by, radius, colorHex) {
    gCtx.save();
    const balGrad = gCtx.createRadialGradient(bx - radius * 0.3, by - radius * 0.3, radius * 0.1, bx, by, radius);
    if (colorHex === "gold") {
      balGrad.addColorStop(0, "#FFF3D1");
      balGrad.addColorStop(0.5, "#D4AF37");
      balGrad.addColorStop(1, "#8A6D1B");
    } else if (colorHex === "navy") {
      balGrad.addColorStop(0, "#3D5A80");
      balGrad.addColorStop(0.5, "#1B2A4A");
      balGrad.addColorStop(1, "#0A1224");
    } else {
      balGrad.addColorStop(0, "#FFFFFF");
      balGrad.addColorStop(0.5, "#E6C687");
      balGrad.addColorStop(1, "#A38238");
    }
    gCtx.fillStyle = balGrad;
    gCtx.beginPath();
    if (typeof gCtx.ellipse === "function") {
      gCtx.ellipse(bx, by, radius * 0.85, radius, 0, 0, Math.PI * 2);
    } else {
      gCtx.arc(bx, by, radius, 0, Math.PI * 2);
    }
    gCtx.fill();
    gCtx.strokeStyle = "rgba(212, 175, 55, 0.7)";
    gCtx.lineWidth = 1.5;
    gCtx.beginPath();
    gCtx.moveTo(bx, by + radius);
    gCtx.lineTo(bx - 5, by + radius + 45);
    gCtx.stroke();
    gCtx.restore();
  }

  drawSingleBalloon(95, 1020, 24, "gold");
  drawSingleBalloon(125, 995, 26, "navy");
  drawSingleBalloon(155, 1030, 22, "cream");

  drawSingleBalloon(970, 85, 22, "gold");
  drawSingleBalloon(1005, 70, 25, "navy");
  drawSingleBalloon(1035, 100, 20, "cream");

  // 5. Floral & Botanical Accent at Lower Right Outer Frame Corner
  gCtx.save();
  const flowerX = 990, flowerY = 1220;
  gCtx.fillStyle = "#C5A059";
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
    const lx = flowerX + Math.cos(angle) * 22;
    const ly = flowerY + Math.sin(angle) * 22;
    gCtx.beginPath();
    gCtx.arc(lx, ly, 8, 0, Math.PI * 2);
    gCtx.fill();
  }
  gCtx.fillStyle = "#FFF7E6";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 1.5;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI * 2 / 5) {
    const px = flowerX + Math.cos(angle) * 10;
    const py = flowerY + Math.sin(angle) * 10;
    gCtx.beginPath();
    gCtx.arc(px, py, 10, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.stroke();
  }
  gCtx.fillStyle = "#D4AF37";
  gCtx.beginPath();
  gCtx.arc(flowerX, flowerY, 7, 0, Math.PI * 2);
  gCtx.fill();
  gCtx.restore();

  // 6. Confetti & Sparkles in Outer Margins
  gCtx.save();
  gCtx.fillStyle = "#D4AF37";
  const sparkles = [
    [50, 160], [45, 900], [550, 1020], [570, 1240], [1030, 300], [1040, 700], [1025, 1100], [250, 50]
  ];
  sparkles.forEach(([sx, sy]) => {
    gCtx.beginPath();
    gCtx.arc(sx, sy, 3, 0, Math.PI * 2);
    gCtx.fill();
  });
  gCtx.restore();
}

function drawAnniversaryDecorations(gCtx) {
  // 1. Gold Corner Filigree Ornaments
  gCtx.save();
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 3;
  gCtx.beginPath(); gCtx.arc(50, 50, 15, Math.PI, Math.PI * 1.5); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 50, 15, Math.PI * 1.5, 0); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(50, 1300, 15, Math.PI * 0.5, Math.PI); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 1300, 15, 0, Math.PI * 0.5); gCtx.stroke();
  gCtx.restore();

  // 2. Intertwined Gold Wedding Rings (Lower Left Decorative Area X=160/188, Y=1125)
  gCtx.save();
  const r1X = 160, r1Y = 1125, rRadius = 22;
  const r2X = 188, r2Y = 1125;

  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 6;
  gCtx.beginPath();
  gCtx.arc(r1X, r1Y, rRadius, 0, Math.PI * 2);
  gCtx.stroke();

  gCtx.strokeStyle = "#FFF3D1";
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.arc(r1X - 2, r1Y - 2, rRadius - 1, Math.PI * 0.8, Math.PI * 1.6);
  gCtx.stroke();

  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 6;
  gCtx.beginPath();
  gCtx.arc(r2X, r2Y, rRadius, 0, Math.PI * 2);
  gCtx.stroke();

  gCtx.strokeStyle = "#FFF3D1";
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.arc(r2X - 2, r2Y - 2, rRadius - 1, Math.PI * 0.8, Math.PI * 1.6);
  gCtx.stroke();
  gCtx.restore();

  // 3. Cream Floral & Gold Foliage Accent (Lower Left X=260, Y=1125)
  gCtx.save();
  const f1X = 260, f1Y = 1125;
  gCtx.fillStyle = "#C5A059";
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
    const lx = f1X + Math.cos(angle) * 18;
    const ly = f1Y + Math.sin(angle) * 18;
    gCtx.beginPath();
    gCtx.arc(lx, ly, 6, 0, Math.PI * 2);
    gCtx.fill();
  }
  gCtx.fillStyle = "#FFF7E6";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 1.5;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI * 2 / 5) {
    const px = f1X + Math.cos(angle) * 8;
    const py = f1Y + Math.sin(angle) * 8;
    gCtx.beginPath();
    gCtx.arc(px, py, 8, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.stroke();
  }
  gCtx.fillStyle = "#D4AF37";
  gCtx.beginPath();
  gCtx.arc(f1X, f1Y, 5, 0, Math.PI * 2);
  gCtx.fill();
  gCtx.restore();

  // 4. Subtle Gold Heart Motif (Lower Center X=350, Y=1125)
  gCtx.save();
  const hX = 350, hY = 1125;
  gCtx.strokeStyle = "#D4AF37";
  gCtx.fillStyle = "rgba(212, 175, 55, 0.15)";
  gCtx.lineWidth = 2.5;
  gCtx.beginPath();
  gCtx.moveTo(hX, hY + 12);
  gCtx.bezierCurveTo(hX - 22, hY - 10, hX - 18, hY - 25, hX, hY - 12);
  gCtx.bezierCurveTo(hX + 18, hY - 25, hX + 22, hY - 10, hX, hY + 12);
  gCtx.fill();
  gCtx.stroke();
  gCtx.restore();

  // 5. Cream Floral & Gold Foliage Accent (Lower Right Outer Corner X=990, Y=1220)
  gCtx.save();
  const flowerX = 990, flowerY = 1220;
  gCtx.fillStyle = "#C5A059";
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
    const lx = flowerX + Math.cos(angle) * 22;
    const ly = flowerY + Math.sin(angle) * 22;
    gCtx.beginPath();
    gCtx.arc(lx, ly, 8, 0, Math.PI * 2);
    gCtx.fill();
  }
  gCtx.fillStyle = "#FFF7E6";
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 1.5;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI * 2 / 5) {
    const px = flowerX + Math.cos(angle) * 10;
    const py = flowerY + Math.sin(angle) * 10;
    gCtx.beginPath();
    gCtx.arc(px, py, 10, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.stroke();
  }
  gCtx.fillStyle = "#D4AF37";
  gCtx.beginPath();
  gCtx.arc(flowerX, flowerY, 7, 0, Math.PI * 2);
  gCtx.fill();
  gCtx.restore();

  // 6. Confetti & Sparkles in Outer Margins
  gCtx.save();
  gCtx.fillStyle = "#D4AF37";
  const sparkles = [
    [50, 160], [45, 900], [550, 1020], [570, 1240], [1030, 300], [1040, 700], [1025, 1100], [250, 50]
  ];
  sparkles.forEach(([sx, sy]) => {
    gCtx.beginPath();
    gCtx.arc(sx, sy, 3, 0, Math.PI * 2);
    gCtx.fill();
  });
  gCtx.restore();
}

function drawGenericPremiumDecorations(gCtx) {
  gCtx.save();
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 3;
  gCtx.beginPath(); gCtx.arc(50, 50, 15, Math.PI, Math.PI * 1.5); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 50, 15, Math.PI * 1.5, 0); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(50, 1300, 15, Math.PI * 0.5, Math.PI); gCtx.stroke();
  gCtx.beginPath(); gCtx.arc(1030, 1300, 15, 0, Math.PI * 0.5); gCtx.stroke();

  const flowerX = 990, flowerY = 1220;
  gCtx.fillStyle = "#C5A059";
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
    const lx = flowerX + Math.cos(angle) * 22;
    const ly = flowerY + Math.sin(angle) * 22;
    gCtx.beginPath();
    gCtx.arc(lx, ly, 8, 0, Math.PI * 2);
    gCtx.fill();
  }

  gCtx.fillStyle = "#D4AF37";
  const sparkles = [
    [50, 160], [45, 900], [550, 1020], [570, 1240], [1030, 300], [1040, 700], [1025, 1100], [250, 50]
  ];
  sparkles.forEach(([sx, sy]) => {
    gCtx.beginPath();
    gCtx.arc(sx, sy, 3, 0, Math.PI * 2);
    gCtx.fill();
  });
  gCtx.restore();
}

function drawPremiumSplitDecorations(gCtx, occasion) {
  switch (occasion) {
    case "Birthday":
      drawBirthdayDecorations(gCtx);
      break;
    case "Wedding Anniversary":
      drawAnniversaryDecorations(gCtx);
      break;
    default:
      drawGenericPremiumDecorations(gCtx);
      break;
  }
}

function renderPremiumPortraitSplit(title, message, date, signature, style) {
  gCtx.clearRect(0, 0, 1080, 1350);

  const bg = gCtx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#0A1120");
  bg.addColorStop(0.5, "#101D32");
  bg.addColorStop(1, "#070D18");
  gCtx.fillStyle = bg;
  gCtx.fillRect(0, 0, 1080, 1350);

  gCtx.save();
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 4;
  gCtx.strokeRect(30, 30, 1020, 1290);

  gCtx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  gCtx.lineWidth = 1.5;
  gCtx.strokeRect(42, 42, 996, 1266);
  gCtx.restore();

  const leftPanelX = 65;
  const leftPanelWidth = 520;
  const centerX = leftPanelX + leftPanelWidth / 2;

  gCtx.save();
  gCtx.fillStyle = "rgba(12, 22, 38, 0.75)";
  gCtx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.roundRect(leftPanelX, 70, leftPanelWidth, 1210, 24);
  gCtx.fill();
  gCtx.stroke();
  gCtx.restore();

  if (date) {
    gCtx.textAlign = "center";
    gCtx.fillStyle = "#D4AF37";
    gCtx.font = "700 22px system-ui";
    gCtx.fillText(new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), centerX, 125);
  }

  const titleFit = fit(title, 460, 3, 52, 32, "Georgia");
  gCtx.textAlign = "center";
  gCtx.fillStyle = "#F5E6C8";
  gCtx.font = titleFit.font;
  let titleY = 195;
  titleFit.lines.forEach((line, i) => gCtx.fillText(line, centerX, titleY + i * titleFit.size * 1.1));

  const dividerY = titleY + (titleFit.lines.length - 1) * titleFit.size * 1.1 + titleFit.size + 25;
  gCtx.save();
  gCtx.strokeStyle = "#D4AF37";
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.moveTo(leftPanelX + 60, dividerY);
  gCtx.lineTo(leftPanelX + leftPanelWidth - 60, dividerY);
  gCtx.stroke();
  gCtx.restore();

  const maxLeftBottom = 1220;
  let msgFit = fit(message, 460, 8, 38, 22, "Georgia");
  let lineSpacing = 1.32;
  let my = dividerY + 45;

  const warmGap = 42;
  const sigGap = 45;

  let msgBottomY = my + (msgFit.lines.length - 1) * msgFit.size * lineSpacing;
  let warmY = msgBottomY + warmGap;
  let sigY = warmY + sigGap;
  let totalBottom = sigY + 20;

  if (totalBottom > maxLeftBottom) {
    let currentMaxSize = 34;
    while (totalBottom > maxLeftBottom && currentMaxSize >= 20) {
      msgFit = fit(message, 460, 8, currentMaxSize, 20, "Georgia");
      lineSpacing = currentMaxSize <= 26 ? 1.22 : 1.26;
      msgBottomY = my + (msgFit.lines.length - 1) * msgFit.size * lineSpacing;
      warmY = msgBottomY + warmGap;
      sigY = warmY + sigGap;
      totalBottom = sigY + 20;
      currentMaxSize -= 2;
    }
  } else if (maxLeftBottom - totalBottom > 80) {
    const extraSpace = maxLeftBottom - totalBottom;
    const shift = Math.min(40, extraSpace / 2);
    my += shift;
    msgBottomY += shift;
    warmY += shift;
    sigY += shift;
  }

  gCtx.fillStyle = "#F4EBD9";
  gCtx.font = msgFit.font;
  gCtx.textAlign = "center";
  msgFit.lines.forEach((line, i) => gCtx.fillText(line, centerX, my + i * msgFit.size * lineSpacing));

  gCtx.fillStyle = "#D4AF37";
  gCtx.textAlign = "center";
  gCtx.font = "italic 28px Georgia";
  gCtx.fillText("Warm regards,", centerX, warmY);

  gCtx.fillStyle = "#F5E6C8";
  gCtx.font = "700 34px Georgia";
  gCtx.fillText(signature, centerX, sigY);

  const photoStyle = $("gPhotoStyle").value;
  const renderPhoto = activeGreetingPhoto();

  const tZone = TEMPLATE_PHOTO_ZONES["VIP Family"];
  const zConfig = tZone[photoStyle] ? { ...tZone[photoStyle] } : { ...tZone["large"] };

  let px = zConfig.px;
  let py = zConfig.py;
  let pw = zConfig.pw;
  let ph = zConfig.ph;
  let radius = zConfig.radius;
  let isCircle = !!zConfig.isCircle;

  if (renderPhoto && photoStyle !== "none") {
    const zoom = Number($("gPhotoZoom").value);
    const focusX = Number($("gPhotoFocusX").value);
    const focusY = Number($("gPhotoFocus").value);

    gCtx.save();
    gCtx.shadowColor = "rgba(0,0,0,.5)";
    gCtx.shadowBlur = 24;
    gCtx.shadowOffsetY = 10;
    gCtx.beginPath();
    if (isCircle) gCtx.arc(px + pw / 2, py + ph / 2, pw / 2, 0, Math.PI * 2);
    else gCtx.roundRect(px, py, pw, ph, radius);
    gCtx.clip();
    gCoverDraw(renderPhoto, px, py, pw, ph, zoom, focusY, focusX);
    gCtx.restore();

    gCtx.save();
    gCtx.strokeStyle = "#D4AF37";
    gCtx.lineWidth = 6;
    gCtx.beginPath();
    if (isCircle) gCtx.arc(px + pw / 2, py + ph / 2, pw / 2, 0, Math.PI * 2);
    else gCtx.roundRect(px, py, pw, ph, radius);
    gCtx.stroke();
    gCtx.restore();
  } else {
    gCtx.save();
    gCtx.fillStyle = "rgba(12, 22, 38, 0.6)";
    gCtx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    gCtx.lineWidth = 3;
    gCtx.beginPath();
    gCtx.roundRect(px, py, pw, ph, radius);
    gCtx.fill();
    gCtx.stroke();

    gCtx.fillStyle = "rgba(212, 175, 55, 0.6)";
    gCtx.font = "700 22px system-ui";
    gCtx.textAlign = "center";
    gCtx.fillText("Recipient Photo", px + pw / 2, py + ph / 2);
    gCtx.restore();
  }

  drawPremiumSplitDecorations(gCtx, $("gOccasion").value);

  gGeneratedKey = gKey();
  $("gShare").disabled = false;
  $("gDownload").disabled = false;
  $("gStatus").textContent = `Greeting generated • VIP Family • 1080 × 1350`;
  updateMobileLivePreview();
}


const GREETING_PALETTES = {
  "VIP Family": { a: "#8E2E21", b: "#C75E22", soft: "#FFF8EA", accent: "#8E2E21", gold: "#E5B85D", ink: "#381D15" },
  "Executive Blue": { a: "#153243", b: "#285B7A", soft: "#F4F7F6", accent: "#285B7A", gold: "#D4AF37", ink: "#153243" },
  "Nature Green": { a: "#1E3A2B", b: "#3B6E52", soft: "#F4F8F5", accent: "#3B6E52", gold: "#D4AF37", ink: "#1E3A2B" },
  "Classic Gold": { a: "#4A3B22", b: "#8C6D37", soft: "#FDFBF7", accent: "#8C6D37", gold: "#D4AF37", ink: "#2A2011" },
  "Premium Gift": { a: "#4A1E28", b: "#8C3B4F", soft: "#FDF7F8", accent: "#8C3B4F", gold: "#D4AF37", ink: "#2B1117" },
  "Black & Gold Luxury": { a: "#111111", b: "#262626", soft: "#F7F7F7", accent: "#D4AF37", gold: "#D4AF37", ink: "#111111" },
  "Navy Ribbon Premium": { a: "#0F1C2E", b: "#1E385C", soft: "#F4F6F9", accent: "#1E385C", gold: "#D4AF37", ink: "#0F1C2E" },
  "White Marble": { a: "#2C3E50", b: "#4B6584", soft: "#FAFAFA", accent: "#2C3E50", gold: "#D4AF37", ink: "#2C3E50" },
  "Marble with Cake": { a: "#34495E", b: "#5D6D7E", soft: "#F9FAFC", accent: "#34495E", gold: "#D4AF37", ink: "#34495E" },
  "Burgundy Luxury": { a: "#3B111A", b: "#6B1F30", soft: "#FDF7F8", accent: "#6B1F30", gold: "#D4AF37", ink: "#3B111A" },
  "Premium Portrait Split": { a: "#0B192C", b: "#1E3E62", soft: "#F4F6F9", accent: "#EDA83B", gold: "#EDA83B", ink: "#FFFFFF" }
};

function gRender(){
  const gDesign = ($("gDesign") && $("gDesign").value) ? $("gDesign").value : "VIP Family";
  const p=gPalette();
  const style=CANVA_TEMPLATE_STYLE[gDesign]||{panel:"#F8F4EA",ink:"#2E2B2A",accent:"#B38A4E",dark:false};
  const title=$("gTitleEn").value.trim()||$("gOccasion").value;
  const message=$("gMessageEn").value.trim();
  const date=$("gDate").value;
  const signature=$("signature")?$("signature").value.trim():"Dr. Atul";
  gCtx.clearRect(0,0,1080,1350);

  if(!drawCanvaTemplate(gDesign)){
    const bg=gCtx.createLinearGradient(0,0,1080,1350);
    bg.addColorStop(0,p.a);bg.addColorStop(.52,p.soft);bg.addColorStop(1,p.b);
    gCtx.fillStyle=bg;gCtx.fillRect(0,0,1080,1350);
  }

  // Cover the static sample text from Canva exports while retaining the approved artwork.
  gCtx.save();
  gCtx.globalAlpha=.96;
  gCtx.fillStyle=style.panel;
  gCtx.beginPath();
  gCtx.roundRect(70,55,940,895,42);
  gCtx.fill();
  gCtx.globalAlpha=1;
  gCtx.strokeStyle=style.accent;
  gCtx.lineWidth=4;
  gCtx.stroke();
  gCtx.restore();

  if(date){
    gCtx.textAlign="center";
    gCtx.fillStyle=style.accent;
    gCtx.font="700 25px system-ui";
    gCtx.fillText(new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}),540,110);
  }

  const titleFit = fit(title, 820, 3, 76, 38, "Georgia");
  gCtx.textAlign = "center";
  gCtx.fillStyle = style.accent;
  gCtx.font = titleFit.font;
  let titleY = 205;
  titleFit.lines.forEach((line, i) => gCtx.fillText(line, 540, titleY + i * titleFit.size * 1.08));

  const dividerY = titleY + (titleFit.lines.length - 1) * titleFit.size * 1.08 + titleFit.size + 25;
  gCtx.strokeStyle = style.accent;
  gCtx.lineWidth = 3;
  gCtx.beginPath();
  gCtx.moveTo(260, dividerY);
  gCtx.lineTo(820, dividerY);
  gCtx.stroke();

  // Dynamic Message & Signature Layout Calculation
  const maxBottomBound = 930;
  let msgFit = fit(message, 800, 8, 44, 24, "Georgia");
  let lineSpacing = 1.30;
  let my = dividerY + 45;
  
  const warmGap = 40;
  const sigGap = 45;
  
  let msgBottomY = my + (msgFit.lines.length - 1) * msgFit.size * lineSpacing;
  let warmY = msgBottomY + warmGap;
  let sigY = warmY + sigGap;
  let totalBottom = sigY + 15;

  if (totalBottom > maxBottomBound) {
    let currentMaxSize = 40;
    while (totalBottom > maxBottomBound && currentMaxSize >= 24) {
      msgFit = fit(message, 800, 8, currentMaxSize, 22, "Georgia");
      lineSpacing = currentMaxSize <= 28 ? 1.22 : 1.26;
      msgBottomY = my + (msgFit.lines.length - 1) * msgFit.size * lineSpacing;
      warmY = msgBottomY + warmGap;
      sigY = warmY + sigGap;
      totalBottom = sigY + 15;
      currentMaxSize -= 2;
    }
  } else if (maxBottomBound - totalBottom > 60) {
    const extraSpace = maxBottomBound - totalBottom;
    const shift = Math.min(30, extraSpace / 2);
    my += shift;
    msgBottomY += shift;
    warmY += shift;
    sigY += shift;
  }

  gCtx.fillStyle = style.ink;
  gCtx.font = msgFit.font;
  gCtx.textAlign = "center";
  msgFit.lines.forEach((line, i) => gCtx.fillText(line, 540, my + i * msgFit.size * lineSpacing));

  gCtx.fillStyle = style.ink;
  gCtx.textAlign = "center";
  gCtx.font = "italic 30px Georgia";
  gCtx.fillText("Warm regards,", 540, warmY);

  gCtx.font = "700 36px Georgia";
  gCtx.fillText(signature, 540, sigY);

  // Template-aware photo safe zones
  // Photo safe zones resolve from the single global TEMPLATE_PHOTO_ZONES table.

  // User-selectable photo presentation (Template-aware with layout collision protection).
  const photoStyle=$("gPhotoStyle").value;
  const renderPhoto=activeGreetingPhoto();
  if(renderPhoto&&photoStyle!=="none"){
    const zoom=Number($("gPhotoZoom").value);
    const focusX=Number($("gPhotoFocusX").value);
    const focusY=Number($("gPhotoFocus").value);

    const tZone = TEMPLATE_PHOTO_ZONES[gDesign] || TEMPLATE_PHOTO_ZONES["Executive Blue"];
    const zConfig = tZone[photoStyle] ? { ...tZone[photoStyle] } : { ...tZone["large"] };

    let px = zConfig.px;
    let py = zConfig.py;
    let pw = zConfig.pw;
    let ph = zConfig.ph;
    let radius = zConfig.radius;
    let isCircle = !!zConfig.isCircle;

    // Collision validation against signature and message text regions
    gCtx.save();
    gCtx.font = "700 36px Georgia";
    const sigTextWidth = gCtx.measureText(signature).width;
    gCtx.restore();

    const sigBox = { x: 540 - sigTextWidth / 2 - 15, y: warmY - 20, w: sigTextWidth + 30, h: sigY - warmY + 50 };
    const msgBox = { x: 140, y: my, w: 800, h: msgBottomY - my + 30 };

    function checkCollision(rx, ry, rw, rh) {
      function rectsOverlap(r1, r2, gap = 15) {
        return !(
          r1.x + r1.w + gap <= r2.x ||
          r2.x + r2.w + gap <= r1.x ||
          r1.y + r1.h + gap <= r2.y ||
          r2.y + r2.h + gap <= r1.y
        );
      }
      const photoRect = { x: rx, y: ry, w: rw, h: rh };
      return rectsOverlap(photoRect, sigBox) || rectsOverlap(photoRect, msgBox);
    }

    if (checkCollision(px, py, pw, ph)) {
      const smallConfig = tZone["small"];
      if (smallConfig && !checkCollision(smallConfig.px, smallConfig.py, smallConfig.pw, smallConfig.ph)) {
        px = smallConfig.px;
        py = smallConfig.py;
        pw = smallConfig.pw;
        ph = smallConfig.ph;
        radius = smallConfig.radius;
        if (photoStyle === "circle") {
          isCircle = true;
          radius = Math.min(pw, ph) / 2;
        }
      } else {
        pw = Math.round(pw * 0.8);
        ph = Math.round(ph * 0.8);
        if (isCircle) radius = pw / 2;
        if (checkCollision(px, py, pw, ph)) {
          py = Math.min(1350 - ph - 20, py + 30);
        }
      }
    }

    gCtx.save();
    gCtx.shadowColor="rgba(0,0,0,.32)";
    gCtx.shadowBlur=18;
    gCtx.shadowOffsetY=8;
    gCtx.beginPath();
    if(isCircle)gCtx.arc(px+pw/2,py+ph/2,pw/2,0,Math.PI*2);
    else gCtx.roundRect(px,py,pw,ph,radius);
    gCtx.clip();
    gCoverDraw(renderPhoto,px,py,pw,ph,zoom,focusY,focusX);
    gCtx.restore();

    gCtx.save();
    gCtx.strokeStyle=style.accent;
    gCtx.lineWidth=7;
    gCtx.beginPath();
    if(isCircle)gCtx.arc(px+pw/2,py+ph/2,pw/2,0,Math.PI*2);
    else gCtx.roundRect(px,py,pw,ph,radius);
    gCtx.stroke();
    gCtx.restore();
  }

  gGeneratedKey=gKey();
  $("gShare").disabled=false;
  $("gDownload").disabled=false;
  $("gStatus").textContent=`Greeting generated • ${gDesign} • 1080 × 1350`;
  updateMobileLivePreview();
}
function gCaption(){const sig=$("signature")?$("signature").value.trim():"Dr. Atul";const sigStr=sig?`\n\n— ${sig}`:"";return `${$("gTitleEn").value}\n\n${$("gMessageEn").value}${sigStr}`;}
async function gShare(){
  if(gGeneratedKey!==gKey())return gInvalidate();
  const blob=await new Promise(r=>gCanvas.toBlob(r,"image/png"));
  if(!blob){showToast("Unable to prepare PNG");return}
  const file=new File([blob],`Personal_Greeting_${$("gName").value||$("gOccasion").value}.png`,{type:"image/png"});
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:$("gOccasion").value,text:gCaption(),files:[file]})
    }else{
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      a.download=file.name;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      await copyText(gCaption(),"Greeting caption")
    }
  }catch(e){
    if(e&&e.name!=="AbortError")showToast("Sharing failed")
  }
}
function gDownload(){
  if(gGeneratedKey!==gKey())return gInvalidate();
  const a=document.createElement("a");
  a.download=`Personal_Greeting_${$("gName").value||$("gOccasion").value}.png`;
  a.href=gCanvas.toDataURL("image/png");
  a.click()
}
function gSave(){
  const all=store.get("daily-inspiration-greetings",[]);
  all.unshift({
    id:Date.now(),
    occasion:$("gOccasion").value,
    name:$("gName").value,
    age:$("gAge").value,secondName:$("gSecondName").value,years:$("gYears").value,detail:$("gDetail").value,
    relation:$("gRelation").value,
    tone:$("gTone").value,
    date:$("gDate").value,
    title:$("gTitleEn").value,
    message:$("gMessageEn").value,
    design:$("gDesign").value
  });
  store.set("daily-inspiration-greetings",all.slice(0,50));
  showToast("Greeting saved")
}
function gReset(){
  ["gName","gSecondName","gAge","gYears","gDetail","gTitleEn","gMessageEn"].forEach(id=>$(id).value="");
  $("gDate").value=getLocalDateString();
  $("gOccasion").value="Birthday";
  $("gRelation").value="Friend";
  $("gTone").value="Heartfelt";
  $("gDesign").value=SMART_THEMES[0];
  $("gPhotoStyle").value=localStorage.getItem("dailyInspirationPhotoStyle")||"large";
  updatePhotoControls();
  gClearPhoto(false);
  gConfigureFields();
  generateSmartMessage();
  gRender()
}
function migrateVipFamily(){
  const LEGACY="Premium Portrait Split",CURRENT="VIP Family";
  const greetings=store.get("daily-inspiration-greetings",[]);
  let changed=false;
  greetings.forEach(g=>{if(g.design===LEGACY){g.design=CURRENT;changed=true}if(g.theme===LEGACY){g.theme=CURRENT;changed=true}});
  if(changed)store.set("daily-inspiration-greetings",greetings);
  const contacts=store.get("daily-inspiration-contacts",[]);
  let cChanged=false;
  contacts.forEach(c=>{if(c.theme===LEGACY){c.theme=CURRENT;cChanged=true}});
  if(cChanged)store.set("daily-inspiration-contacts",contacts);
  const history=store.get("daily-inspiration-history-lite",[]);
  let hChanged=false;
  history.forEach(h=>{if(h.theme===LEGACY){h.theme=CURRENT;hChanged=true}});
  if(hChanged)store.set("daily-inspiration-history-lite",history);
}
function initGreeting(){
  migrateVipFamily();
  GREETING_OCCASIONS.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("gOccasion").appendChild(o)});
  GREETING_RELATIONS.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("gRelation").appendChild(o)});
  GREETING_TONES.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("gTone").appendChild(o)});
  clearNode($("gDesign"));GREETING_DESIGNS.forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("gDesign").appendChild(o)});
  $("gDate").value=getLocalDateString();
  $("gOccasion").value="Birthday";
  $("gRelation").value="Friend";
  $("gTone").value="Heartfelt";
  $("gDesign").value=SMART_THEMES[0];
  $("gOccasion").addEventListener("change",()=>{gConfigureFields();generateSmartMessage()});$("gGenerateMessage").onclick=generateSmartMessage;
  $("gGeneratePoster").onclick=()=>{gRender();saveGreetingMemory();gCanvas.toBlob(blob=>saveGeneratedImage(blob,{type:"greeting",occasion:$("gOccasion").value,name:$("gName").value}),"image/png")};
  $("gPhotoFile").onchange=e=>gSetPhoto(e.target.files[0]);
  $("gClearPhoto").onclick=()=>gClearPhoto(true);
  $("gShare").onclick=gShare;
  $("gDownload").onclick=gDownload;
  $("gSaveTemplate").onclick=gSave;
  $("gReset").onclick=gReset;
  ["gOccasion","gName","gSecondName","gAge","gYears","gDetail","gRelation","gTone","gDate","gTitleEn","gMessageEn","gDesignMode","gDesign","gMessageStyle","gAudience","gPhotoStyle","gPhotoZoom","gPhotoFocusX","gPhotoFocus"].forEach(id=>{
    onEl(id,"input",()=>{gMetrics();gInvalidate();if(id==="gName"||id==="gOccasion")updateGreetingHistoryNote()})
  });
  // Design mode defaults to Automatic, so a design picked straight from the Design list was
  // being overwritten by chooseSmartTheme() on the next Generate. An explicit design choice is
  // treated as a manual choice; Automatic and Random logic themselves are unchanged.
  $("gDesign").addEventListener("change",()=>{
    if($("gDesignMode").value!=="manual"){
      $("gDesignMode").value="manual";
      showToast("Design mode set to Manual");
    }
  });
  $("gPhotoStyle").addEventListener("change",()=>{
    localStorage.setItem("dailyInspirationPhotoStyle",$("gPhotoStyle").value);
    updatePhotoControls();
    gRender();
  });
  $("gPhotoZoom").addEventListener("input",()=>{if(gPhoto)gRender()});
  $("gPhotoFocusX").addEventListener("input",()=>{if(gPhoto)gRender()});
  $("gEditPhoto").addEventListener("click",openPhotoEditor);
  $("gMobileResetPhoto").addEventListener("click",()=>{
    gEditedPhoto=null;
    $("gPhotoZoom").value="1";
    $("gPhotoFocusX").value="0";
    $("gPhotoFocus").value="0.45";
    if(activeGreetingPhoto())gRender();
  });
  $("gMobileApplyPhoto").addEventListener("click",()=>{
    showToast("Photo adjustment applied");
    const frame=document.querySelector("#greeting .frame");
    if(frame)frame.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  $("gResetPhoto").addEventListener("click",()=>{
    gEditedPhoto=null;
    $("gPhotoZoom").value="1";
    $("gPhotoFocusX").value="0";
    $("gPhotoFocus").value="0.45";
    if(gPhoto)gRender();
  });
  $("gEditorCancel").addEventListener("click",closePhotoEditor);
  $("gEditorApply").addEventListener("click",applyPhotoEditor);
  $("gEditorReset").addEventListener("click",()=>{
    gPhotoEditState={zoom:1,offsetX:0,offsetY:0,shape:$("gEditorShape").value};
    $("gEditorZoom").value="1";drawPhotoEditor();
  });
  $("gEditorZoom").addEventListener("input",e=>{
    gPhotoEditState.zoom=Number(e.target.value);drawPhotoEditor();
  });
  $("gEditorShape").addEventListener("change",e=>{
    gPhotoEditState.shape=e.target.value;gPhotoEditState.offsetX=0;gPhotoEditState.offsetY=0;drawPhotoEditor();
  });
  const stage=$("gPhotoEditorStage");
  const point=e=>{
    const rect=stage.getBoundingClientRect(),t=e.touches?e.touches[0]:e;
    return {x:(t.clientX-rect.left)*800/rect.width,y:(t.clientY-rect.top)*1000/rect.height};
  };
  stage.addEventListener("pointerdown",e=>{
    stage.setPointerCapture(e.pointerId);gEditorDragging=true;
    const p=point(e);gEditorLastX=p.x;gEditorLastY=p.y;
  });
  stage.addEventListener("pointermove",e=>{
    if(!gEditorDragging)return;
    const p=point(e);
    gPhotoEditState.offsetX+=p.x-gEditorLastX;gPhotoEditState.offsetY+=p.y-gEditorLastY;
    gEditorLastX=p.x;gEditorLastY=p.y;drawPhotoEditor();
  });
  stage.addEventListener("pointerup",()=>gEditorDragging=false);
  stage.addEventListener("pointercancel",()=>gEditorDragging=false);
  stage.addEventListener("wheel",e=>{
    e.preventDefault();
    gPhotoEditState.zoom=Math.max(1,Math.min(4,gPhotoEditState.zoom+(e.deltaY<0?.08:-.08)));
    $("gEditorZoom").value=String(gPhotoEditState.zoom);drawPhotoEditor();
  },{passive:false});
  stage.addEventListener("touchstart",e=>{
    if(e.touches.length===2){
      const [a,b]=e.touches;
      gEditorPinchStart=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
      gEditorZoomStart=gPhotoEditState.zoom;
    }
  },{passive:false});
  stage.addEventListener("touchmove",e=>{
    if(e.touches.length===2&&gEditorPinchStart){
      e.preventDefault();
      const [a,b]=e.touches;
      const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
      gPhotoEditState.zoom=Math.max(1,Math.min(4,gEditorZoomStart*d/gEditorPinchStart));
      $("gEditorZoom").value=String(gPhotoEditState.zoom);drawPhotoEditor();
    }
  },{passive:false});

  $("gPhotoFocus").addEventListener("input",()=>{if(gPhoto)gRender()});
  gConfigureFields();
  generateSmartMessage();
  gRender()
}


function init(){
  setTimeout(() => { render(); }, 100);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (rec) render(); }).catch(() => {});
  }

  document.querySelectorAll('#posterQuickChips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#posterQuickChips .chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      $("style").value = btn.dataset.style;
      invalidate();
      render();
    });
  });
STYLES.forEach(s=>{const o=document.createElement("option");o.textContent=s;$("style").appendChild(o)});Object.entries(PALETTES).forEach(([name,p])=>{const b=document.createElement("button");b.className="swatch";b.dataset.p=name;b.title=name;b.style.background=`linear-gradient(135deg,${p.a},${p.b})`;b.onclick=()=>{palette=name;syncPalette();invalidate();if(rec)render()};$("palettes").appendChild(b)});
for(let i=1;i<=12;i++){const o=document.createElement("option");o.value=String(i).padStart(2,"0");o.textContent=new Date(2026,i-1,1).toLocaleDateString("en-IN",{month:"long"});$("monthFilter").appendChild(o)}[...new Set(DATASET.map(r=>r.Category))].sort().forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("categoryFilter").appendChild(o)});[...new Set(DATASET.map(r=>r.Cultural_Context))].sort().forEach(v=>{const o=document.createElement("option");o.value=o.textContent=v;$("contextFilter").appendChild(o)});
onEl("date","change",e=>load(e.target.value));
["occasionEn","signature","style"].forEach(id=>onEl(id,"input",()=>{if(id==="style")syncStyleChips();invalidate();if(rec)render()}));
["artworkZoom","artworkFocus"].forEach(id=>onEl(id,"input",invalidate));
onEl("messageEn","input",()=>{updateEditorMetrics();invalidate();if(rec)render()});
onEl("artworkZoom","input",()=>{if(artworkImage)render()});
onEl("artworkFocus","input",()=>{if(artworkImage)render()});
onEl("artworkFile","change",e=>setArtwork(e.target.files[0]));
onEl("clearArtwork","click",()=>clearArtwork(true));
onEl("resetEnglish","click",resetEnglish);
onEl("saveCustom","click",saveCustomMessages);
onEl("restoreOriginal","click",restoreOriginal);
onEl("generate","click",()=>{render();addHistory();cvs.toBlob(blob=>saveGeneratedImage(blob,{type:"daily",date:$("date").value,occasion:$("occasionEn").value}),"image/png")});
onEl("download","click",()=>{if(generatedKey!==key())return invalidate();const a=document.createElement("a");a.download=`${$("date").value}_${$("occasionEn").value.replace(/[^a-z0-9]+/gi,"-")}.png`;a.href=cvs.toDataURL("image/png");a.click()});
onEl("sharePoster","click",shareCurrentPoster);
onEl("copyEnglish","click",()=>copyText(englishCaption(),"English caption"));
onEl("exportEdits","click",exportUserEdits);
onEl("importEdits","change",e=>importUserEdits(e.target.files[0]));
onEl("savePreferences","click",savePreferences);
onEl("resetPreferences","click",resetPreferences);
onEl("cleanupMode","change",saveCleanupMode);
onEl("cleanupNow","click",async()=>{const n=await deleteGeneratedImagesOlderThan(7);showToast(`${n} old image(s) deleted`)});
onEl("deleteAllImages","click",async()=>{if(confirm("Delete all images stored inside the app?")){await deleteAllGeneratedImages();showToast("All app-stored images deleted")}});
onEl("whyBtn","click",()=>$("why").classList.toggle("show"));
onEl("favoriteBtn","click",toggleFavorite);
onEl("clearHistory","click",()=>{store.set("iis-history",[]);renderHistory()});
onEl("runQa","click",runDatasetQa);
onEl("exportQa","click",exportQa);
["search","monthFilter","categoryFilter","contextFilter"].forEach(id=>onEl(id,"input",renderCalendar));
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>show(t.dataset.screen));
applyPreferences();load(getTodayDatasetDate());renderFavorites();renderHistory();populateSettings();loadCleanupSettings();runScheduledCleanup();
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
function associateLabels(){document.querySelectorAll("label").forEach((label,index)=>{if(label.htmlFor)return;const control=label.querySelector("input,select,textarea,button")||label.parentElement?.querySelector("input,select,textarea,button");if(!control)return;if(!control.id)control.id="label-control-"+index;label.htmlFor=control.id})}
document.addEventListener("DOMContentLoaded",()=>{associateLabels();init();initGreeting();initContacts();updatePhotoControls()});
