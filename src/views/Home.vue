<script setup>
import { ref } from 'vue'
import { computed } from 'vue'
import { watch } from 'vue'
import { getRandomPlace } from '@/services/geoapify'
import { getCategoryLabel } from '@/lib/placeCategories'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

//paywall
const showPaywall = ref(false)
const isPremium = ref(true)

const PAYWALL_COOLDOWN = 10 * 60 * 1000 // 5 minutos

function canShowPaywall() {
    const lastShown = Number(localStorage.getItem('paywall_last_shown') || 0)
    return Date.now() - lastShown > PAYWALL_COOLDOWN
}

function markPaywallShown() {
    localStorage.setItem('paywall_last_shown', Date.now())
}

function openPaywall() {
    if (!canShowPaywall()) return

    showPaywall.value = true
    markPaywallShown()
}

// limites free
const FREE_MAX_RADIUS = 10000
const FREE_MAX_REROLL = 3

// verifica se é app
const isNative = Capacitor.isNativePlatform()
//--
const rerollCount = ref(0)

const showLowOptionsWarning = computed(() => {
    if (!restaurant.value) return false

    return (
        restaurant.value.usedFallbackCategory ||
        restaurant.value.usedLargeRadius
    )
})
const hasActiveFilters = computed(() => selectedCategories.value.length > 0)

const restaurant = ref(null)
const loading = ref(false)
const error = ref(null)
const radius = ref(5000)

watch(radius, (value) => {
    if (!isPremium.value && value > FREE_MAX_RADIUS) {
        radius.value = FREE_MAX_RADIUS
        openPaywall()
    }
})
// modo de date selecionado
const dateMode = ref('casual')
const selectedCategories = ref([])
// modo filtrado
const showFilters = ref(false)

const categories = [
    { label: '🍽️ Restaurante', value: 'catering.restaurant' },
    { label: '☕ Café', value: 'catering.cafe' },
    { label: '🍺 Bar / 🍺 Pub', value: 'catering.bar, catering.pub' },
    { label: '🍦 Sorveteria', value: 'catering.ice_cream' },
    { label: '🍔 Fast Food', value: 'catering.fast_food' },
    { label: '🛍️ Shopping', value: 'commercial.shopping_mall' },
    { label: '🌳 Parque', value: 'leisure.park' },
    { label: '🎬 Cinema', value: 'entertainment.cinema' },
    { label: '📚 Livros', value: 'commercial.books' },
    { label: '📸 Turismo', value: 'tourism' },
    { label: '🏛️ Museu', value: 'entertainment.museum' },
    { label: '🐟 Aquário', value: 'entertainment.aquarium' },
    { label: '🏫 Centro Comunitário', value: 'activity.community_center' }
]

// 🔧 MODO TESTE
const USE_FAKE_LOCATION = false

const FAKE_LOCATION = {
    latitude: -23.5576599,   // Av. Paulista
    longitude: -46.640457,
}

async function sortearDate() {
    loading.value = true
    error.value = null

    try {
        let latitude, longitude

        if (USE_FAKE_LOCATION) {
            latitude = FAKE_LOCATION.latitude
            longitude = FAKE_LOCATION.longitude
        } else {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true
            })

            latitude = position.coords.latitude
            longitude = position.coords.longitude
        }

        const result = await getRandomPlace(
            latitude,
            longitude,
            dateMode.value,
            selectedCategories.value,
            radius.value
        )

        if (!result) {
            error.value = 'Nenhuma opção encontrada'
            return // não conta tentativa
        }

        // Acrescenta tentativas free
        if (!isPremium.value) {
            rerollCount.value++

            if (rerollCount.value >= FREE_MAX_REROLL) {
                showPaywall.value = true
                return
            }
        }

        restaurant.value = result

    } catch (err) {
        error.value = 'Erro ao buscar local'
        console.error(err)
        // 🚨 não conta tentativa
    } finally {
        loading.value = false
    }
}
function onSelectMode(mode) {
    if (loading.value) return

    dateMode.value = mode

    // limpa filtros avançados automaticamente
    selectedCategories.value = []
}
function onOpenAdvancedFilter() {
    if (!isPremium.value) {
        showPaywall.value = true
        return
    }

    showFilters.value = true
}
function activatePremium() {
    isPremium.value = true
    showPaywall.value = false
    rerollCount.value = 0
}
</script>

<template>
    <main class="container">
        <!--Bloquear web-->
        <div v-if="!isNative" class="web-block">
            <h1>📱 Bora Date</h1>
            <p>Descubra lugares incríveis para seu próximo date 💖</p>


            <a href="https://play.google.com/store/apps/details?id=SEU_ID" target="_blank" class="download-btn">
                Baixar na Play Store
            </a>
        </div>
        <!--App-->
        <template v-else>
            <h1 class="app-title">Bora Date</h1>
            <p>Sem ideias? A gente escolhe por você.</p>
            <div v-if="isPremium" class="premium-badge">
                ⭐ Conta Premium
            </div>
            <div class="radius-control">
                <label>
                    📍 Raio de busca:
                    <strong>{{ (radius / 1000).toFixed(1) }} km</strong>
                </label>

                <input type="range" min="1000" max="50000" step="500" v-model="radius" />
            </div>
            <div class="modes">
                <button :class="{ active: dateMode === 'romantico' && !hasActiveFilters }" :disabled="loading"
                    @click="onSelectMode('romantico')">
                    💖 Romântico
                </button>

                <button :class="{ active: dateMode === 'casual' && !hasActiveFilters }" :disabled="loading"
                    @click="onSelectMode('casual')">
                    🙂 Casual
                </button>

                <button :class="{ active: dateMode === 'aventura' && !hasActiveFilters }" :disabled="loading"
                    @click="onSelectMode('aventura')">
                    🔥 Aventura
                </button>
            </div>

            <button class="bora-button" @click="sortearDate" :disabled="loading" aria-label="Sortear um date">
                <img src="@/assets/bora-button.png" alt="Bora" :class="{ spinning: loading }" />
            </button>

            <p v-if="loading" class="loading-text">
                🎲 Sorteando seu date...
            </p>

            <div class="filters-area">
                <button class="advanced-btn" @click="onOpenAdvancedFilter" :disabled="loading">
                    ⚙️ Filtro avançado
                </button>

                <p v-if="hasActiveFilters" class="filter-info">
                    ⚙️ Filtro avançado ativo
                </p>
            </div>

            <div v-if="showFilters" class="overlay" @click.self="showFilters = false">
                <div class="modal">
                    <h3>🎯 Escolha o que te interessa</h3>

                    <div class="category-list">
                        <label v-for="cat in categories" :key="cat.value" class="checkbox">
                            <input type="checkbox" :value="cat.value" v-model="selectedCategories" />
                            <span>{{ cat.label }}</span>
                        </label>
                    </div>

                    <div class="actions">
                        <button class="clear" @click="selectedCategories = []">
                            Limpar
                        </button>
                        <button class="apply" @click="showFilters = false">
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
            <p v-if="error" class="error">{{ error }}</p>

            <!--Modal Resposta-->
            <div v-if="restaurant" class="card">
                <p v-if="showLowOptionsWarning" class="warning">
                    😕 Poucas opções cadastradas no seu raio.
                    <br />
                    Tentamos o melhor possível 💙
                </p>
                <h2>{{ restaurant.name }}</h2>
                <p>{{ getCategoryLabel(restaurant.categories) }}</p>
                <p>📍 {{ restaurant.address_line2 }}</p>
                <p v-if="restaurant.distance">
                    📏 {{ (restaurant.distance / 1000).toFixed(2) }} km de você
                </p>
                <p v-if="restaurant.rating">
                    ⭐ {{ restaurant.rating.toFixed(1) }}
                </p>
                <a :href="`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lon}`"
                    target="_blank">
                    🗺️ Como chegar
                </a>
            </div>

            <!--Modal Paywall-->
            <div v-if="showPaywall" class="overlay" @click.self="showPaywall = false">
                <div class="paywall">
                    <h2>💖 Bora Date Premium</h2>
                    <p class="subtitle">
                        Mais liberdade pra encontrar o date perfeito
                    </p>

                    <ul class="benefits">
                        <li>✨ Filtro avançado ilimitado</li>
                        <li>📍 Raio de busca até 50 km</li>
                        <li>🔁 Re-sorteio sem limites</li>
                    </ul>

                    <div class="plans">
                        <button class="plan primary" @click="activatePremium">
                            ⭐ Premium Mensal<br />
                            <span>R$ 4,90 / mês</span>
                        </button>

                        <button class="plan">
                            💎 Vitalício<br />
                            <span>R$ 19,90</span>
                        </button>
                    </div>

                    <p class="footnote">
                        🔒 Pagamento seguro • Cancele quando quiser
                    </p>

                    <button class="close" @click="showPaywall = false">
                        Agora não
                    </button>
                    <p class="legal">
                        Ao continuar você concorda com nossa
                        <a href="/privacy" target="_blank">Política de Privacidade</a>
                    </p>
                </div>
            </div>
            <div class="footer-links">
                <a href="/privacy" target="_blank">
                    Política de Privacidade
                </a>
            </div>
        </template>
    </main>

</template>

<style scoped>
.app-title {
    font-family: 'Italianno', cursive;
    font-size: 3rem;
    font-weight: 400;
    letter-spacing: 1px;
    color: #e85d75;
    margin-bottom: 0.5rem;
}

.premium-badge {
    display: inline-block;
    margin-top: 0.25rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 999px;
    background: linear-gradient(135deg, #f7b733, #fce38a);
    color: #5c3b00;
}

.bora-button {
    margin-top: 1.25rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
}

.bora-button img {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.bora-button:hover img {
    transform: scale(1.05);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
}

.bora-button:active img {
    transform: scale(0.95);
}

.bora-button:disabled {
    cursor: not-allowed;
    opacity: 0.85;
}

.spinning {
    animation: spin 1.2s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: #666;
}

.warning {
    background: #fff3cd;
    color: #664d03;
    padding: 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    margin-top: 1rem;
}

.container {
    padding: 2rem;
    max-width: 400px;
    margin: auto;
    text-align: center;
}

button {
    background: #e85d75;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 12px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
}

.modes button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.card {
    background: #f7c8d0;
    padding: 1rem;
    border-radius: 12px;
    margin-top: 1.5rem;
}

.error {
    color: red;
    margin-top: 1rem;
}

.modes {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin: 1rem 0;
}

.modes button {
    background: #eee;
    color: #333;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}

.modes button.active {
    background: #e85d75;
    color: white;
}

.conditions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
    justify-content: center;
}

.condition {
    background: #fff;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    color: #333;
}

.advanced-btn {
    margin-top: 1rem;
    background: transparent;
    border: none;
    color: #555;
    font-size: 0.9rem;
    cursor: pointer;
}

.radius-control {
    margin-top: 1.25rem;
    text-align: left;
    font-size: 0.85rem;
    color: #555;
}

.radius-control label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
}

.radius-control input[type="range"] {
    width: 100%;
}

/* overlay escuro */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
}

/* modal */
.modal {
    background: #fff;
    width: 100%;
    max-height: 80%;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem;
    overflow-y: auto;
}

.filter-info {
    font-size: 0.85rem;
    color: #888;
    margin-top: 0.5rem;
}

.modal h3 {
    margin-bottom: 1rem;
}

/* lista */
.category-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
}

.actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
}

.actions button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 12px;
    border: none;
    font-size: 1rem;
}

.actions .clear {
    background: #888888;
    margin-right: 0.5rem;
}

.actions .apply {
    background: #e85d75;
    color: white;
}

.filters-area {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/*Paywall*/
.paywall {
    background: #fff;
    width: 100%;
    max-height: 85%;
    border-radius: 24px 24px 0 0;
    padding: 1.75rem;
    text-align: center;
}

.paywall h2 {
    color: #e85d75;
    font-size: 1.6rem;
}

.subtitle {
    font-size: 0.9rem;
    color: #666;
    margin: 0.5rem 0 1.25rem;
}

.benefits {
    list-style: none;
    padding: 0;
    margin: 0;
}

.benefits li {
    margin: 0.4rem 0;
    font-size: 0.9rem;
}

.plans {
    margin-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.plan {
    border-radius: 14px;
    padding: 0.75rem;
    border: none;
    font-size: 0.9rem;
    background: #482bee;
    cursor: pointer;
}

.plan.primary {
    background: #e85d75;
    color: white;
}

.plan span {
    font-size: 0.75rem;
    opacity: 0.85;
}

.footnote {
    font-size: 0.7rem;
    color: #666;
    margin-top: 0.75rem;
}

.close {
    margin-top: 1rem;
    background: transparent;
    border: none;
    background-color: #666;
    color: #ffffff;
    font-size: 0.85rem;
}

.footer-links {
    margin-top: 2rem;
    font-size: 0.75rem;
    opacity: 0.7;
}

.footer-links a {
    color: #666;
    text-decoration: underline;
}

.web-block {
    text-align: center;
    margin-top: 3rem;
}

.download-btn {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 999px;
    background: #e85d75;
    color: white;
    text-decoration: none;
    font-weight: 600;
}
</style>