/**
 * Catálogo de 10 Avatares Gaming en SVG de alta resolución con estilo Neón
 */
const GAMING_AVATARS = [
  {
    id: "cyber-controller",
    name: "Mando Legendario",
    category: "Pro Gamer",
    color: "#00f3ff",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#0c132c"/>
      <path d="M18 24C15 24 12 28 13 36L15 45C16 48 18 49 21 48L27 41H37L43 48C46 49 48 48 49 45L51 36C52 28 49 24 46 24H18Z" stroke="#00f3ff" stroke-width="2.5" stroke-linejoin="round" fill="#111d42"/>
      <circle cx="23" cy="33" r="2" fill="#00f3ff"/>
      <path d="M23 29V37M19 33H27" stroke="#00f3ff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="41" cy="31" r="2" fill="#ff007f"/>
      <circle cx="45" cy="35" r="2" fill="#ff007f"/>
      <circle cx="37" cy="35" r="2" fill="#00f3ff"/>
      <circle cx="41" cy="39" r="2" fill="#00f3ff"/>
      <ellipse cx="28" cy="38" rx="2" ry="2" fill="#00f3ff" opacity="0.6"/>
      <ellipse cx="36" cy="38" rx="2" ry="2" fill="#00f3ff" opacity="0.6"/>
    </svg>`
  },
  {
    id: "cyber-skull",
    name: "Calavera Cyber",
    category: "Hardcore",
    color: "#ff007f",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#180720"/>
      <path d="M20 22C20 15 25 12 32 12C39 12 44 15 44 22C44 28 42 33 42 37L39 40V44H25V40L22 37C22 33 20 28 20 22Z" stroke="#ff007f" stroke-width="2.5" fill="#2d0f3a"/>
      <ellipse cx="26" cy="27" rx="3.5" ry="5" fill="#00f3ff"/>
      <ellipse cx="38" cy="27" rx="3.5" ry="5" fill="#00f3ff"/>
      <path d="M30 33L32 36L34 33" stroke="#ff007f" stroke-width="2"/>
      <path d="M27 41V44M30 41V44M34 41V44M37 41V44" stroke="#00f3ff" stroke-width="1.8"/>
      <path d="M16 28L12 30M48 28L52 30" stroke="#ff007f" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "dragon-flame",
    name: "Dragón Mortal",
    category: "Combate",
    color: "#ff8c00",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#1e1005"/>
      <path d="M32 12C28 17 21 21 21 28C21 34 26 38 31 38C34 38 37 36 39 34C43 40 46 45 42 51C40 54 36 55 33 55C26 55 21 49 21 45" stroke="#ff8c00" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 12C37 17 44 21 44 28C44 32 42 35 39 37C36 33 33 32 29 32" stroke="#ff007f" stroke-width="2.5" stroke-linecap="round" fill="#3a1608"/>
      <circle cx="36" cy="24" r="2.5" fill="#00f3ff"/>
      <path d="M26 18L21 14M38 18L43 14" stroke="#ff8c00" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "ninja-shadow",
    name: "Ninja Sombra",
    category: "Sigilo",
    color: "#bc13fe",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#140a26"/>
      <circle cx="32" cy="32" r="19" stroke="#bc13fe" stroke-width="2.5" fill="#1e0f38"/>
      <path d="M17 31H47V36C47 43 40 48 32 48C24 48 17 43 17 36V31Z" fill="#0b0416"/>
      <path d="M21 27L26 30L38 30L43 27" stroke="#bc13fe" stroke-width="2" fill="#080210"/>
      <polygon points="26,27 30,28 27,30" fill="#00f3ff"/>
      <polygon points="38,27 34,28 37,30" fill="#00f3ff"/>
      <path d="M27 15L32 21L37 15" stroke="#bc13fe" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  },
  {
    id: "mecha-helmet",
    name: "Mecha Titán",
    category: "Sci-Fi",
    color: "#00f3ff",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#081426"/>
      <path d="M22 18L32 13L42 18L46 31L39 47L32 50L25 47L18 31L22 18Z" stroke="#00f3ff" stroke-width="2.5" fill="#0e2340"/>
      <rect x="22" y="27" width="20" height="7" rx="3" fill="#00f3ff" opacity="0.85"/>
      <line x1="14" y1="31" x2="18" y2="31" stroke="#00f3ff" stroke-width="2.5"/>
      <line x1="46" y1="31" x2="50" y2="31" stroke="#00f3ff" stroke-width="2.5"/>
      <path d="M28 41L32 43L36 41" stroke="#00f3ff" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "phoenix-crest",
    name: "Fénix Cósmico",
    category: "Mítico",
    color: "#facc15",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#1f1807"/>
      <path d="M32 14L35 24L44 26L37 32L39 42L32 37L25 42L27 32L20 26L29 24L32 14Z" stroke="#facc15" stroke-width="2.5" fill="#3a2a0a" stroke-linejoin="round"/>
      <circle cx="32" cy="28" r="4" fill="#ff007f"/>
      <path d="M15 36C18 43 25 48 32 48C39 48 46 43 49 36" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/>
    </svg>`
  },
  {
    id: "sword-cross",
    name: "Espadas Kombat",
    category: "Gladiador",
    color: "#ff0055",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#200612"/>
      <line x1="18" y1="18" x2="46" y2="46" stroke="#ff0055" stroke-width="3" stroke-linecap="round"/>
      <line x1="46" y1="18" x2="18" y2="46" stroke="#00f3ff" stroke-width="3" stroke-linecap="round"/>
      <line x1="17" y1="41" x2="23" y2="47" stroke="#ff0055" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="47" y1="41" x2="41" y2="47" stroke="#00f3ff" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#fff" stroke="#ff0055" stroke-width="2"/>
    </svg>`
  },
  {
    id: "cyber-wolf",
    name: "Lobo Alpha",
    category: "Cazador",
    color: "#00d2ff",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#061224"/>
      <path d="M18 16L24 28L32 23L40 28L46 16L43 32L50 37L39 41L32 49L25 41L14 37L21 32L18 16Z" stroke="#00d2ff" stroke-width="2.5" fill="#0d2347" stroke-linejoin="round"/>
      <circle cx="26" cy="32" r="2" fill="#ff007f"/>
      <circle cx="38" cy="32" r="2" fill="#ff007f"/>
      <polygon points="30,42 34,42 32,44" fill="#00d2ff"/>
    </svg>`
  },
  {
    id: "wizard-arcane",
    name: "Mago Arcano",
    category: "Estrategia",
    color: "#a855f7",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#190a2a"/>
      <path d="M32 12L46 45H18L32 12Z" stroke="#a855f7" stroke-width="2.5" fill="#250f3d" stroke-linejoin="round"/>
      <path d="M14 45C14 45 22 43 32 43C42 43 50 45 50 45" stroke="#00f3ff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="3.5" fill="#00f3ff"/>
      <path d="M32 23V25M25 35L27 34M39 35L37 34" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "golden-trophy",
    name: "Trofeo Campeón",
    category: "Victoria",
    color: "#eab308",
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#221903"/>
      <path d="M22 17H42V29C42 35 37 40 32 40C27 40 22 35 22 29V17Z" stroke="#eab308" stroke-width="2.5" fill="#3d2d05"/>
      <path d="M22 21H16C16 27 20 30 23 30" stroke="#eab308" stroke-width="2" stroke-linecap="round"/>
      <path d="M42 21H48C48 27 44 30 41 30" stroke="#eab308" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 40V46M25 46H39M22 51H42" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="32,23 34,27 38,27 35,29 36,33 32,31 28,33 29,29 26,27 30,27" fill="#00f3ff"/>
    </svg>`
  }
];

/**
 * Devuelve el SVG de un avatar según su ID o el predeterminado
 */
function getAvatarSvg(avatarId) {
  const avatar = GAMING_AVATARS.find(a => a.id === avatarId) || GAMING_AVATARS[0];
  return avatar.svg;
}

/**
 * Devuelve los detalles de un avatar
 */
function getAvatarDetails(avatarId) {
  return GAMING_AVATARS.find(a => a.id === avatarId) || GAMING_AVATARS[0];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAMING_AVATARS, getAvatarSvg, getAvatarDetails };
}
