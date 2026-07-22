/** Catálogo GameParty — categorias e jogos com salas fixas */

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const CATEGORIES = [
  { name: 'MOBA', slug: 'moba' },
  { name: 'FPS', slug: 'fps' },
  { name: 'MMORPG', slug: 'mmorpg' },
  { name: 'Battle Royale', slug: 'battle-royale' },
  { name: 'Estratégia RTS', slug: 'estrategia-rts' },
  { name: 'Estratégia por Turnos', slug: 'estrategia-turnos' },
  { name: 'Luta', slug: 'luta' },
  { name: 'Puzzle', slug: 'puzzle' },
  { name: 'Survival', slug: 'survival' },
  { name: 'Sandbox', slug: 'sandbox' },
  { name: 'Corrida', slug: 'corrida' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Hack and Slash', slug: 'hack-and-slash' },
  { name: 'Roguelike', slug: 'roguelike' },
  { name: 'Plataforma', slug: 'plataforma' },
  { name: 'Terror', slug: 'terror' },
  { name: 'Coop / Party', slug: 'coop-party' },
  { name: 'Outros', slug: 'outros' },
] as const;

/** name → category slugs (jogo pode estar em várias categorias) */
export const GAMES: Array<{ name: string; categories: string[] }> = [
  // MOBA
  { name: 'League of Legends', categories: ['moba'] },
  { name: 'Dota 2', categories: ['moba'] },
  { name: 'Smite 2', categories: ['moba'] },
  { name: 'Heroes of the Storm', categories: ['moba'] },
  { name: 'Pokémon Unite', categories: ['moba'] },
  { name: 'Honor of Kings', categories: ['moba'] },
  { name: 'Arena of Valor', categories: ['moba'] },
  { name: 'Mobile Legends: Bang Bang', categories: ['moba'] },
  // FPS
  { name: 'Counter-Strike 2', categories: ['fps'] },
  { name: 'Valorant', categories: ['fps'] },
  { name: 'Call of Duty: Black Ops 6', categories: ['fps'] },
  { name: 'Call of Duty: Warzone', categories: ['fps', 'battle-royale'] },
  { name: 'Rainbow Six Siege', categories: ['fps'] },
  { name: 'Battlefield 2042', categories: ['fps'] },
  { name: 'DOOM Eternal', categories: ['fps'] },
  { name: 'Overwatch 2', categories: ['fps'] },
  { name: 'Halo Infinite', categories: ['fps'] },
  { name: 'Escape from Tarkov', categories: ['fps'] },
  // MMORPG
  { name: 'World of Warcraft', categories: ['mmorpg'] },
  { name: 'Final Fantasy XIV', categories: ['mmorpg'] },
  { name: 'Guild Wars 2', categories: ['mmorpg'] },
  { name: 'Black Desert Online', categories: ['mmorpg'] },
  { name: 'The Elder Scrolls Online', categories: ['mmorpg'] },
  { name: 'RuneScape', categories: ['mmorpg'] },
  { name: 'Old School RuneScape', categories: ['mmorpg'] },
  { name: 'Albion Online', categories: ['mmorpg'] },
  { name: 'EVE Online', categories: ['mmorpg'] },
  { name: 'Lost Ark', categories: ['mmorpg', 'hack-and-slash'] },
  { name: 'New World', categories: ['mmorpg'] },
  { name: 'Lineage II', categories: ['mmorpg'] },
  { name: 'Tibia', categories: ['mmorpg'] },
  { name: 'Ragnarok Online', categories: ['mmorpg'] },
  { name: 'MapleStory', categories: ['mmorpg'] },
  // Battle Royale
  { name: 'Fortnite', categories: ['battle-royale'] },
  { name: 'PUBG: Battlegrounds', categories: ['battle-royale'] },
  { name: 'Apex Legends', categories: ['battle-royale'] },
  { name: 'Free Fire', categories: ['battle-royale'] },
  { name: 'Naraka: Bladepoint', categories: ['battle-royale'] },
  { name: 'Super People', categories: ['battle-royale'] },
  { name: 'Fall Guys', categories: ['battle-royale', 'coop-party'] },
  // Estratégia RTS
  { name: 'Age of Empires II', categories: ['estrategia-rts'] },
  { name: 'Age of Empires IV', categories: ['estrategia-rts'] },
  { name: 'StarCraft II', categories: ['estrategia-rts'] },
  { name: 'Warcraft III', categories: ['estrategia-rts'] },
  { name: 'Command & Conquer: Red Alert 2', categories: ['estrategia-rts'] },
  { name: 'Company of Heroes 3', categories: ['estrategia-rts'] },
  { name: 'Age of Mythology: Retold', categories: ['estrategia-rts'] },
  // Estratégia por Turnos
  { name: 'Civilization VII', categories: ['estrategia-turnos'] },
  { name: 'Civilization VI', categories: ['estrategia-turnos'] },
  { name: 'Total War: Warhammer III', categories: ['estrategia-turnos'] },
  { name: 'Europa Universalis IV', categories: ['estrategia-turnos'] },
  { name: 'Crusader Kings III', categories: ['estrategia-turnos'] },
  { name: 'Hearts of Iron IV', categories: ['estrategia-turnos'] },
  { name: 'XCOM 2', categories: ['estrategia-turnos'] },
  // Luta
  { name: 'Street Fighter 6', categories: ['luta'] },
  { name: 'Tekken 8', categories: ['luta'] },
  { name: 'Mortal Kombat 1', categories: ['luta'] },
  { name: 'Guilty Gear -Strive-', categories: ['luta'] },
  { name: 'Super Smash Bros. Ultimate', categories: ['luta'] },
  { name: 'Dragon Ball: Sparking! ZERO', categories: ['luta'] },
  { name: 'Dragon Ball FighterZ', categories: ['luta'] },
  { name: 'The King of Fighters XV', categories: ['luta'] },
  { name: 'Brawlhalla', categories: ['luta'] },
  { name: 'MultiVersus', categories: ['luta'] },
  // Puzzle
  { name: 'Tetris', categories: ['puzzle'] },
  { name: 'Tetris Effect: Connected', categories: ['puzzle'] },
  { name: 'Portal 2', categories: ['puzzle'] },
  { name: 'Candy Crush Saga', categories: ['puzzle'] },
  { name: 'Baba Is You', categories: ['puzzle'] },
  { name: 'The Witness', categories: ['puzzle'] },
  { name: 'Monument Valley', categories: ['puzzle'] },
  { name: 'Limbo', categories: ['puzzle'] },
  { name: 'Inside', categories: ['puzzle'] },
  { name: 'World of Goo', categories: ['puzzle'] },
  // Survival
  { name: 'Rust', categories: ['survival'] },
  { name: 'ARK: Survival Ascended', categories: ['survival'] },
  { name: 'DayZ', categories: ['survival'] },
  { name: 'Valheim', categories: ['survival'] },
  { name: 'Project Zomboid', categories: ['survival'] },
  { name: 'The Forest', categories: ['survival'] },
  { name: 'Sons of the Forest', categories: ['survival'] },
  { name: "Don't Starve Together", categories: ['survival'] },
  { name: 'V Rising', categories: ['survival'] },
  { name: 'Subnautica', categories: ['survival'] },
  // Sandbox
  { name: 'Minecraft', categories: ['sandbox'] },
  { name: 'Terraria', categories: ['sandbox'] },
  { name: 'Roblox', categories: ['sandbox'] },
  { name: "Garry's Mod", categories: ['sandbox'] },
  { name: 'Core Keeper', categories: ['sandbox'] },
  { name: 'Starbound', categories: ['sandbox'] },
  // Corrida
  { name: 'Forza Horizon 5', categories: ['corrida'] },
  { name: 'Gran Turismo 7', categories: ['corrida'] },
  { name: 'Need for Speed Unbound', categories: ['corrida'] },
  { name: 'Assetto Corsa', categories: ['corrida'] },
  { name: 'iRacing', categories: ['corrida'] },
  { name: 'F1 25', categories: ['corrida'] },
  { name: 'Mario Kart 8 Deluxe', categories: ['corrida'] },
  // Esportes
  { name: 'EA Sports FC 26', categories: ['esportes'] },
  { name: 'eFootball', categories: ['esportes'] },
  { name: 'NBA 2K26', categories: ['esportes'] },
  { name: 'MLB The Show', categories: ['esportes'] },
  { name: 'Rocket League', categories: ['esportes'] },
  { name: 'PGA Tour 2K', categories: ['esportes'] },
  // Hack and Slash
  { name: 'Diablo IV', categories: ['hack-and-slash'] },
  { name: 'Path of Exile', categories: ['hack-and-slash'] },
  { name: 'Path of Exile 2', categories: ['hack-and-slash'] },
  { name: 'Last Epoch', categories: ['hack-and-slash'] },
  { name: 'Grim Dawn', categories: ['hack-and-slash'] },
  { name: 'Torchlight II', categories: ['hack-and-slash'] },
  // Roguelike
  { name: 'Hades', categories: ['roguelike'] },
  { name: 'Dead Cells', categories: ['roguelike'] },
  { name: 'The Binding of Isaac: Rebirth', categories: ['roguelike'] },
  { name: 'Risk of Rain 2', categories: ['roguelike'] },
  { name: 'Vampire Survivors', categories: ['roguelike'] },
  { name: 'Slay the Spire', categories: ['roguelike'] },
  { name: 'Enter the Gungeon', categories: ['roguelike'] },
  // Plataforma
  { name: 'Hollow Knight', categories: ['plataforma'] },
  { name: 'Celeste', categories: ['plataforma'] },
  { name: 'Ori and the Will of the Wisps', categories: ['plataforma'] },
  { name: 'Super Mario Bros. Wonder', categories: ['plataforma'] },
  { name: 'Cuphead', categories: ['plataforma'] },
  { name: 'Rayman Legends', categories: ['plataforma'] },
  // Terror
  { name: 'Phasmophobia', categories: ['terror'] },
  { name: 'Dead by Daylight', categories: ['terror'] },
  { name: 'Outlast', categories: ['terror'] },
  { name: 'Resident Evil Village', categories: ['terror'] },
  { name: 'Silent Hill 2', categories: ['terror'] },
  { name: 'Alien: Isolation', categories: ['terror'] },
  // Coop / Party
  { name: 'It Takes Two', categories: ['coop-party'] },
  { name: 'Overcooked! 2', categories: ['coop-party'] },
  { name: 'Lethal Company', categories: ['coop-party'] },
  { name: 'Among Us', categories: ['coop-party'] },
  { name: 'Party Animals', categories: ['coop-party'] },
  { name: 'Human: Fall Flat', categories: ['coop-party'] },
  { name: 'Pico Park', categories: ['coop-party'] },
  // Outros
  { name: 'Jogo não listado', categories: ['outros'] },
];

export const SYSTEM_USER_EMAIL = 'system@gameparty.com.br';
export const FIXED_LOBBY_CAPACITY = 999;
