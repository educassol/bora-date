import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.geoapify.com/v2',
})

const DATE_MODES = {
  romantico: ['catering.restaurant', 'catering.cafe', 'catering.bar', 'catering.pub'],
  casual: [
    'catering.cafe',
    'catering.fast_food',
    'catering.ice_cream',
    'commercial.shopping_mall',
    'leisure.park',
    'commercial.books',
    'entertainment.museum',
  ],
  aventura: [
    'entertainment.cinema',
    'entertainment.aquarium',
    'tourism.attraction',
    'entertainment.escape_game',
    'entertainment.miniature_golf',
    'entertainment.theme_park',
    'entertainment.zoo',
  ],
}

// 🛟 fallback genérico (salva cidades pequenas)
const FALLBACK_CATEGORIES = [
  'catering.restaurant',
  'catering.bar',
  'leisure.park',
  'tourism.attraction',
]

// ⏱️ 3 horas
const RESET_TIME = 3 * 60 * 60 * 1000

function getSeenPlaces() {
  return JSON.parse(localStorage.getItem('seen_places') || '[]')
}

function getSeenTimestamp() {
  return Number(localStorage.getItem('seen_timestamp') || 0)
}

function resetSeen() {
  localStorage.removeItem('seen_places')
  localStorage.removeItem('seen_timestamp')
}

function saveSeenPlace(id) {
  const seen = getSeenPlaces()
  if (!seen.length) {
    localStorage.setItem('seen_timestamp', Date.now())
  }
  localStorage.setItem('seen_places', JSON.stringify([...seen, id]))
}

function shouldResetByTime() {
  const start = getSeenTimestamp()
  return !start || Date.now() - start > RESET_TIME
}

export async function getRandomPlace(
  lat,
  lon,
  mode = 'casual',
  customCategories = [],
  radius = 3000,
) {
  if (!lat || !lon) throw new Error('Latitude ou longitude inválidas')

  if (shouldResetByTime()) {
    resetSeen()
  }

  let categories =
    customCategories.length > 0
      ? [...customCategories]
      : [...(DATE_MODES[mode] || DATE_MODES.casual)]

  // 🔀 embaralha
  categories.sort(() => Math.random() - 0.5)

  // ➕ adiciona fallback no final
  categories = [...categories, ...FALLBACK_CATEGORIES]

  const seen = getSeenPlaces()

  console.group('🎯 Busca de locais')
  console.log('Modo:', mode)
  console.log('Categorias:', categories)
  console.log('Raio:', radius)

  for (const category of categories) {
    try {
      console.log('🔎 Tentando categoria:', category)

      const response = await api.get('/places', {
        params: {
          categories: category,
          filter: `circle:${lon},${lat},${radius}`,
          bias: `proximity:${lon},${lat}`,
          limit: 30,
          apiKey: import.meta.env.VITE_GEOAPIFY_KEY,
        },
      })

      let places = response.data.features || []

      const withName = places.filter(
        (p) => typeof p.properties.name === 'string' && p.properties.name.trim(),
      )

      // se tiver lugares com nome, usa eles
      places = withName.length ? withName : places
      console.log(`📦 Encontrados: ${places.length}`)

      if (!places.length) continue

      // 🧠 prioriza abertos, mas aceita qualquer um
      const openNow = places.filter((p) => p.properties.opening_hours?.open_now === true)

      const pool = openNow.length ? openNow : places

      let available = pool.filter((p) => !seen.includes(p.properties.place_id))

      if (!available.length) {
        available = pool
      }

      const chosen = available[Math.floor(Math.random() * available.length)]
      saveSeenPlace(chosen.properties.place_id)

      console.log('✅ Escolhido:', chosen.properties.name)
      console.groupEnd()

      return {
        ...chosen.properties,
        name:
          chosen.properties.name?.trim() || chosen.properties.brand?.trim() || '❌ Local sem nome',
        dateMode: mode,
        categoryUsed: category,
        usedCustomFilter: customCategories.length > 0,
        usedFallbackCategory: FALLBACK_CATEGORIES.includes(category),
      }
    } catch (err) {
      if (err.response?.status === 400) {
        console.warn('⚠️ Categoria inválida:', category)
        continue
      }
      console.error(err)
      console.groupEnd()
      throw err
    }
  }

  console.warn('😢 Nenhum local encontrado')
  console.groupEnd()
  return null
}
