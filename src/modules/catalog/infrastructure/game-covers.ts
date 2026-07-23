const STEAM_APP_IDS: Record<string, number> = {
  'dota-2': 570,
  'smite-2': 2430400,
  'counter-strike-2': 730,
  'rainbow-six-siege': 359550,
  'battlefield-2042': 1517290,
  'doom-eternal': 782330,
  'halo-infinite': 1240440,
  'apex-legends': 1172470,
  'pubg-battlegrounds': 578080,
  'naraka-bladepoint': 1203220,
  'fall-guys': 1097150,
  'age-of-empires-ii': 813780,
  'age-of-empires-iv': 1466860,
  'company-of-heroes-3': 1677280,
  'age-of-mythology-retold': 1934680,
  'civilization-vi': 289070,
  'total-war-warhammer-iii': 1142710,
  'europa-universalis-iv': 236850,
  'crusader-kings-iii': 1158310,
  'hearts-of-iron-iv': 394360,
  'xcom-2': 268500,
  'street-fighter-6': 1364780,
  'tekken-8': 1778820,
  'mortal-kombat-1': 1971870,
  'guilty-gear-strive': 1384160,
  'dragon-ball-fighterz': 678950,
  'brawlhalla': 291550,
  'tetris-effect-connected': 1003560,
  'portal-2': 620,
  'baba-is-you': 736260,
  'the-witness': 210970,
  'limbo': 48000,
  'inside': 391720,
  'world-of-goo': 22000,
  'rust': 252490,
  'ark-survival-ascended': 2399830,
  'dayz': 221100,
  'valheim': 892970,
  'project-zomboid': 108600,
  'the-forest': 242760,
  'sons-of-the-forest': 1326470,
  'dont-starve-together': 322330,
  'v-rising': 1604030,
  'subnautica': 264710,
  'terraria': 105600,
  'garrys-mod': 4000,
  'core-keeper': 1621690,
  'starbound': 211820,
  'forza-horizon-5': 1551360,
  'need-for-speed-unbound': 1846380,
  'assetto-corsa': 244210,
  'rocket-league': 252950,
  'diablo-iv': 2344520,
  'path-of-exile': 238960,
  'last-epoch': 899770,
  'grim-dawn': 219990,
  'torchlight-ii': 200710,
  'hades': 1145360,
  'dead-cells': 588650,
  'the-binding-of-isaac-rebirth': 250900,
  'risk-of-rain-2': 632360,
  'vampire-survivors': 1794680,
  'slay-the-spire': 646570,
  'enter-the-gungeon': 311690,
  'hollow-knight': 367520,
  'celeste': 504230,
  'ori-and-the-will-of-the-wisps': 1057090,
  'cuphead': 268910,
  'rayman-legends': 242550,
  'phasmophobia': 739630,
  'dead-by-daylight': 381210,
  'outlast': 238320,
  'resident-evil-village': 1196590,
  'alien-isolation': 214490,
  'it-takes-two': 1426210,
  'overcooked-2': 728880,
  'lethal-company': 1966720,
  'among-us': 945360,
  'party-animals': 1260320,
  'human-fall-flat': 477160,
  'pico-park': 897050,
  'final-fantasy-xiv': 39210,
  'guild-wars-2': 1284210,
  'black-desert-online': 582660,
  'the-elder-scrolls-online': 306130,
  'albion-online': 761890,
  'eve-online': 8500,
  'lost-ark': 1599340,
  'new-world': 1063730,
  'escape-from-tarkov': 1938090,
  'helldivers-2': 553850,
  'palworld': 1623730,
  'once-human': 2139460,
  'the-finals': 2073850,
  'warframe': 230410,
  'destiny-2': 1085660,
  'payday-3': 1272080,
  'hunt-showdown': 594650,
  'squad': 393380,
  'insurgency-sandstorm': 581320,
  'hell-let-loose': 686810,
  'ready-or-not': 1144200,
  'deep-rock-galactic': 548430,
  'gtfo': 493520,
  'barotrauma': 602960,
  'sea-of-thieves': 1172620,
  'grounded': 962130,
  'no-mans-sky': 275850,
  'monster-hunter-world': 582010,
  'monster-hunter-rise': 1446780,
  'elden-ring': 1245620,
  'dark-souls-iii': 374320,
  'baldurs-gate-3': 1086940,
  'cyberpunk-2077': 1091500,
  'the-witcher-3': 292030,
  'red-dead-redemption-2': 1174180,
  'gta-v': 271590,
  'super-people': 1960250,
  'call-of-duty-warzone': 3596180,
  'call-of-duty-black-ops-6': 2933620,
};

const CUSTOM_COVER_URLS: Record<string, string> = {
  'league-of-legends':
    'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg',
  'valorant':
    'https://images.contentstack.io/v3/assets/bltb6530b271f6120b/blt8221585c3b24bd11/6182977bc2f190b9d950ed37/VALORANT_Jett_Red_4.jpg',
  'fortnite':
    'https://cdn2.unrealengine.com/14br-consoles-1920x1080-wlogo-1920x1080-432974386.jpg',
  'minecraft':
    'https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_Minecraft-300x465.jpg',
  'roblox':
    'https://images.rbxcdn.com/534786afeae64972b5581d8f0001bcf0.jpg',
  'overwatch-2':
    'https://blz-static.akamaized.net/overwatch/media/stories/global/ow2-keyart.jpg',
  'world-of-warcraft':
    'https://blz-static.akamaized.net/WoW/Dragonflight/WoWDF_KeyArt_3840x2160.jpg',
  'mobile-legends-bang-bang':
    'https://static.wikia.nocookie.net/mobile-legends/images/2/2e/MLBB_logo.png',
  'pokemon-unite':
    'https://assets.pokemon.com/assets/cms2/img/video-games/pokemon-unite/pokemon-unite-169-en.jpg',
  'ea-sports-fc-26':
    'https://media.contentapi.ea.com/content/dam/ea/fc/fc-25/common/fc25-ultimate-edition-keyart.jpg',
  'multiversus':
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1818750/header.jpg',
  'heroes-of-the-storm':
    'https://blz-static.akamaized.net/Heroes/heroeshots/heroes-of-the-storm-key-art.jpg',
  'runescape':
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1343400/header.jpg',
  'maplestory':
    'https://cdn.cloudflare.steamstatic.com/steam/apps/216150/header.jpg',
  'super-smash-bros-ultimate':
    'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_2.0/c_scale,w_400/ncom/en_US/games/switch/s/super-smash-bros-ultimate-switch',
  'mario-kart-8-deluxe':
    'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_2.0/c_scale,w_400/ncom/en_US/games/switch/m/mario-kart-8-deluxe-switch',
  'jogo-nao-listado':
    'https://ui-avatars.com/api/?name=Outros&background=4c1d95&color=e9d5ff&size=128&bold=true&format=png',
};

export function resolveGameCoverUrl(slug: string): string | null {
  if (CUSTOM_COVER_URLS[slug]) return CUSTOM_COVER_URLS[slug];
  const appId = STEAM_APP_IDS[slug];
  if (!appId) return null;
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export function resolveGameCoverFallback(name: string): string {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || name)}&background=312e81&color=c4b5fd&size=128&bold=true&format=png`;
}
