export const PLACE_CATEGORIES = {
  'catering.restaurant': {
    label: '🍽️ Restaurante',
    short: 'Restaurante',
  },
  'catering.cafe': {
    label: '☕ Café',
    short: 'Café',
  },
  'catering.bar': {
    label: '🍺 Bar',
    short: 'Bar',
  },
  'catering.pub': {
    label: '🍺 Pub',
    short: 'Pub',
  },
  'catering.fast_food': {
    label: '🍔 Fast Food',
    short: 'Fast Food',
  },
  'catering.ice_cream': {
    label: '🍦 Sorveteria',
    short: 'Sorveteria',
  },
  'commercial.shopping_mall': {
    label: '🛍️ Shopping',
    short: 'Shopping',
  },
  'commercial.books': {
    label: '📚 Livros',
    short: 'Livros',
  },
  'entertainment.cinema': {
    label: '🎬 Cinema',
    short: 'Cinema',
  },
  'entertainment.bowling_alley': {
    label: '🎳 Boliche',
    short: 'Boliche',
  },
  'entertainment.arcade': {
    label: '🕹️ Arcade',
    short: 'Arcade',
  },
  'entertainment.nightclub': {
    label: '💃 Balada',
    short: 'Balada',
  },
  'leisure.park': {
    label: '🌳 Parque',
    short: 'Parque',
  },
  'leisure.garden': {
    label: '🌷 Jardim',
    short: 'Jardim',
  },
  'entertainment.museum': {
    label: '🏛️ Museu',
    short: 'Museu',
  },
  'tourism.attraction': {
    label: '📸 Atração turística',
    short: 'Atração',
  },
  'entertainment.aquarium': {
    label: '🐟 Aquário',
    short: 'Aquário',
  },
  'activity.community_center': {
    label: '🏫 Centro comunitário',
    short: 'Centro comunitário',
  },
}
export function getCategoryLabel(categories) {
  if (!categories) return '📍 Local'

  const list = Array.isArray(categories) ? categories : [categories]

  for (const category of list) {
    const base = category.split('.').slice(0, 2).join('.')

    if (PLACE_CATEGORIES[category]) {
      return PLACE_CATEGORIES[category].label
    }

    if (PLACE_CATEGORIES[base]) {
      return PLACE_CATEGORIES[base].label
    }
  }

  return '📍 Local'
}
