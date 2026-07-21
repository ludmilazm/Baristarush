'use strict';

/* =========================================================
   BARISTA RUSH
   Lógica principal do jogo
========================================================= */

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CONFIG = Object.freeze({
    STORAGE_KEY: 'baristaRushProgressV1',
    DAY_DURATION_SECONDS: 120,
    QUEUE_LIMIT: 3,
    INITIAL_TABLES: 3,
    MAX_TABLES: 6,
    MAX_PREPARATION_INGREDIENTS: 6,
    FULL_SCORE_WINDOW_SECONDS: 10,
    DIRT_MAX: 3,
    DIRT_OLD_AFTER_SECONDS: 12,
    DIRT_PENALTY_INTERVAL_SECONDS: 3,
    TABLE_PRICES: Object.freeze({
        4: 80,
        5: 150,
        6: 250
    }),
    LEVEL_THRESHOLDS: Object.freeze([
        { level: 1, score: 0 },
        { level: 2, score: 500 },
        { level: 3, score: 1200 },
        { level: 4, score: 2200 },
        { level: 5, score: 3500 }
    ])
});

const INGREDIENTS = Object.freeze({
    cafe: Object.freeze({ name: 'Café', icon: '☕', unlockLevel: 1 }),
    leite: Object.freeze({ name: 'Leite', icon: '🥛', unlockLevel: 1 }),
    acucar: Object.freeze({ name: 'Açúcar', icon: '🍬', unlockLevel: 2 }),
    canela: Object.freeze({ name: 'Canela', icon: '🌿', unlockLevel: 2 }),
    chocolate: Object.freeze({ name: 'Chocolate', icon: '🍫', unlockLevel: 3 }),
    chantilly: Object.freeze({ name: 'Chantilly', icon: '🍦', unlockLevel: 3 })
});

const RECIPES = Object.freeze([
    Object.freeze({
        id: 'cafe',
        name: 'Café',
        ingredients: ['cafe'],
        unlockLevel: 1,
        price: 8,
        basePoints: 80
    }),
    Object.freeze({
        id: 'cafe-com-leite',
        name: 'Café com leite',
        ingredients: ['cafe', 'leite'],
        unlockLevel: 1,
        price: 12,
        basePoints: 120
    }),
    Object.freeze({
        id: 'cafe-doce',
        name: 'Café doce',
        ingredients: ['cafe', 'acucar'],
        unlockLevel: 2,
        price: 13,
        basePoints: 130
    }),
    Object.freeze({
        id: 'cafe-com-leite-doce',
        name: 'Café com leite doce',
        ingredients: ['cafe', 'leite', 'acucar'],
        unlockLevel: 2,
        price: 18,
        basePoints: 180
    }),
    Object.freeze({
        id: 'cafe-com-canela',
        name: 'Café com canela',
        ingredients: ['cafe', 'canela'],
        unlockLevel: 2,
        price: 15,
        basePoints: 150
    }),
    Object.freeze({
        id: 'mocha',
        name: 'Mocha',
        ingredients: ['cafe', 'leite', 'chocolate'],
        unlockLevel: 3,
        price: 22,
        basePoints: 220
    }),
    Object.freeze({
        id: 'chocolate-quente',
        name: 'Chocolate quente',
        ingredients: ['leite', 'chocolate'],
        unlockLevel: 3,
        price: 18,
        basePoints: 180
    }),
    Object.freeze({
        id: 'cafe-com-chantilly',
        name: 'Café com chantilly',
        ingredients: ['cafe', 'chantilly'],
        unlockLevel: 3,
        price: 20,
        basePoints: 200
    }),
    Object.freeze({
        id: 'mocha-especial',
        name: 'Mocha especial',
        ingredients: ['cafe', 'leite', 'chocolate', 'chantilly'],
        unlockLevel: 4,
        price: 30,
        basePoints: 300
    }),
    Object.freeze({
        id: 'cafe-aromatico',
        name: 'Café aromático',
        ingredients: ['cafe', 'acucar', 'canela', 'chantilly'],
        unlockLevel: 4,
        price: 28,
        basePoints: 280
    }),
    Object.freeze({
        id: 'chocolate-cremoso',
        name: 'Chocolate cremoso',
        ingredients: ['leite', 'chocolate', 'acucar', 'chantilly'],
        unlockLevel: 4,
        price: 30,
        basePoints: 300
    })
]);

const CHARACTERS = Object.freeze([
    Object.freeze({
        id: 'crianca',
        name: 'Criança',
        standingSprite: 'img/characters/criançaempe.png',
        seatedSprite: 'img/characters/criança.png'
    }),
    Object.freeze({
        id: 'homem',
        name: 'Homem',
        standingSprite: 'img/characters/homemempe.png',
        seatedSprite: 'img/characters/homem.png'
    }),
    Object.freeze({
        id: 'mulher',
        name: 'Mulher',
        standingSprite: 'img/characters/mulherempe.png',
        seatedSprite: 'img/characters/mulher.png'
    }),
    Object.freeze({
        id: 'idoso',
        name: 'Idoso',
        standingSprite: 'img/characters/idosoempe.png',
        seatedSprite: 'img/characters/idoso.png'
    })
]);

const SOUNDS = {
    menu: new Audio("audios/ambientes/menu.mp3"),
    jogo: new Audio("audios/ambientes/mainJazz.mp3"),
    click: new Audio("audios/click.mp3"),
    limpar: new Audio("audios/catandoLixo.mp3"),
    ganhou: new Audio("audios/bonusPoints.mp3"),
    perdeu: new Audio("audios/deathSound.mp3"),
    passouNivel: new Audio("audios/ganhou.mp3"),
    andando: new Audio("audios/andando.mp3"),
    pagou: new Audio("audios/applePaySucces.mp3"),
    servir: new Audio("audios/servir.mp3"),
    erro: new Audio("audios/error-126627.mp3"),
    popUp: new Audio("audios/popUp.mp3"),
    moedinhas: new Audio("audios/moedinhasSuccess.mp3"),
    clienteDesistiu: new Audio("audios/universsfield-fail-trumpet-144746.mp3")
};

SOUNDS.menu.loop = true; SOUNDS.jogo.loop = true;

SOUNDS.menu.volume = 1; SOUNDS.jogo.volume = 0.03;
SOUNDS.limpar.volume = 0.5; 
SOUNDS.click.volume = 0.5; SOUNDS.popUp.volume = 0.4;
SOUNDS.andando.volume = 0.6;
SOUNDS.moedinhas.volume = 0.05;
SOUNDS.passouNivel.volume = 0.5;

function playSound(sound) {
    if (!sound) {
        return;
    }

    sound.currentTime = 0;
    sound.play().catch(() => {});
}

const DIRT_TYPES = Object.freeze(['coffee', 'crumbs', 'napkin', 'stain']);

const DIRT_POSITIONS = Object.freeze([
    Object.freeze({ left: 4, top: 18 }),
    Object.freeze({ left: 17, top: 47 }),
    Object.freeze({ left: 31, top: 78 }),
    Object.freeze({ left: 42, top: 45 }),
    Object.freeze({ left: 50, top: 82 }),
    Object.freeze({ left: 58, top: 45 }),
    Object.freeze({ left: 69, top: 78 }),
    Object.freeze({ left: 83, top: 48 }),
    Object.freeze({ left: 92, top: 18 })
]);

/* =========================================================
   ESTADO PERSISTENTE E ESTADO DA PARTIDA
========================================================= */

const DEFAULT_PROGRESS = Object.freeze({
    score: 0,
    coins: 0,
    level: 1,
    bestScore: 0,
    bestLevel: 1,
    day: 1,
    unlockedTables: 3
});

let progress = loadProgress();

const runtime = {
    appStarted: false,
    dayActive: false,
    paused: true,
    gameOver: false,
    shopReturnContext: 'running',
    selectedTableId: null,
    preparation: [],
    satisfaction: 100,
    dayRemaining: CONFIG.DAY_DURATION_SECONDS,
    spawnCountdown: 1.5,
    dirtCountdown: randomBetween(8, 14),
    dirtPenaltyAccumulator: 0,
    lastFrameTimestamp: null,
    customerSequence: 0,
    dirtSequence: 0,
    queue: [],
    customers: new Map(),
    dirtItems: new Map(),
    tables: new Map(),
    dayStats: createEmptyDayStats()
};

/* =========================================================
   REFERÊNCIAS DO DOM
========================================================= */

const dom = {};

cacheDom();
initializeTables();
bindEvents();
applyProgressToInterface();
renderAllTables();
renderQueue();
renderPreparation();
updateHud();
requestAnimationFrame(gameLoop);

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function cacheDom() {
    dom.splashScreen = document.getElementById('splashScreen');
    dom.startBtn = document.getElementById('startBtn');

    dom.dayValue = document.getElementById('dayValue');
    dom.levelValue = document.getElementById('levelValue');
    dom.scoreValue = document.getElementById('scoreValue');
    dom.coinsValue = document.getElementById('coinsValue');
    dom.satisfactionValue = document.getElementById('satisfactionValue');
    dom.satisfactionTrack = document.getElementById('satisfactionTrack');
    dom.satisfactionFill = document.getElementById('satisfactionFill');
    dom.dayTimerValue = document.getElementById('dayTimerValue');
    dom.shopBtn = document.getElementById('shopBtn');
    dom.pauseBtn = document.getElementById('pauseBtn');

    dom.queueCounter = document.getElementById('queueCounter');
    dom.queueList = document.getElementById('queueList');
    dom.queueWarning = document.getElementById('queueWarning');

    dom.cafeFloor = document.getElementById('cafeFloor');
    dom.movementLayer = document.getElementById('movementLayer');
    dom.dirtLayer = document.getElementById('dirtLayer');
    dom.tableElements = [...document.querySelectorAll('.table-slot')];

    dom.baristaMessage = document.getElementById('baristaMessage');
    dom.selectedTableLabel = document.getElementById('selectedTableLabel');
    dom.selectedRecipeLabel = document.getElementById('selectedRecipeLabel');

    dom.ingredientButtons = [...document.querySelectorAll('.ingredient-button')];
    dom.preparationCount = document.getElementById('preparationCount');
    dom.selectedIngredients = document.getElementById('selectedIngredients');
    dom.undoIngredientBtn = document.getElementById('undoIngredientBtn');
    dom.clearPreparationBtn = document.getElementById('clearPreparationBtn');
    dom.serveBtn = document.getElementById('serveBtn');

    dom.dayStartModal = document.getElementById('dayStartModal');
    dom.dayStartNumber = document.getElementById('dayStartNumber');
    dom.beginDayBtn = document.getElementById('beginDayBtn');

    dom.shopModal = document.getElementById('shopModal');
    dom.closeShopBtn = document.getElementById('closeShopBtn');
    dom.shopCoinsValue = document.getElementById('shopCoinsValue');
    dom.buyTableButtons = [...document.querySelectorAll('.buy-table-button')];

    dom.pauseModal = document.getElementById('pauseModal');
    dom.resumeBtn = document.getElementById('resumeBtn');
    dom.openShopFromPauseBtn = document.getElementById('openShopFromPauseBtn');
    dom.resetProgressBtn = document.getElementById('resetProgressBtn');

    dom.daySummaryModal = document.getElementById('daySummaryModal');
    dom.summaryServedCustomers = document.getElementById('summaryServedCustomers');
    dom.summaryLostCustomers = document.getElementById('summaryLostCustomers');
    dom.summaryScore = document.getElementById('summaryScore');
    dom.summaryCoins = document.getElementById('summaryCoins');
    dom.summaryCleanedDirt = document.getElementById('summaryCleanedDirt');
    dom.summarySatisfaction = document.getElementById('summarySatisfaction');
    dom.summaryShopBtn = document.getElementById('summaryShopBtn');
    dom.nextDayBtn = document.getElementById('nextDayBtn');

    dom.levelUpModal = document.getElementById('levelUpModal');
    dom.newLevelValue = document.getElementById('newLevelValue');
    dom.unlockList = document.getElementById('unlockList');
    dom.closeLevelUpBtn = document.getElementById('closeLevelUpBtn');

    dom.gameOverModal = document.getElementById('gameOverModal');
    dom.gameOverScore = document.getElementById('gameOverScore');
    dom.restartGameBtn = document.getElementById('restartGameBtn');

    dom.resetConfirmationModal = document.getElementById('resetConfirmationModal');
    dom.cancelResetBtn = document.getElementById('cancelResetBtn');
    dom.confirmResetBtn = document.getElementById('confirmResetBtn');

    dom.toastContainer = document.getElementById('toastContainer');
}

function initializeTables() {
    for (const element of dom.tableElements) {
        const id = Number(element.dataset.tableId);

        runtime.tables.set(id, {
            id,
            element,
            unlocked: id <= progress.unlockedTables,
            customerId: null,
            reserved: false
        });
    }
}

function bindEvents() {
    dom.startBtn.addEventListener('click', handleStartButton);
    dom.beginDayBtn.addEventListener('click', () => { playSound(SOUNDS.click); beginDay(); });

    dom.shopBtn.addEventListener('click', () => { playSound(SOUNDS.click); openShop('running'); });
    dom.pauseBtn.addEventListener('click', () => { playSound(SOUNDS.click); pauseGame(); });
    dom.resumeBtn.addEventListener('click', () => { playSound(SOUNDS.click); resumeGame(); });
    dom.openShopFromPauseBtn.addEventListener('click', () => { playSound(SOUNDS.click); openShop('pause'); });
    dom.closeShopBtn.addEventListener('click', () => { playSound(SOUNDS.click); closeShop(); });
    dom.summaryShopBtn.addEventListener('click', () => { playSound(SOUNDS.click); openShop('summary'); });

    dom.nextDayBtn.addEventListener('click', () => { playSound(SOUNDS.click); goToNextDay(); });
    dom.closeLevelUpBtn.addEventListener('click', () => { playSound(SOUNDS.click); closeLevelUpModal(); });
    dom.restartGameBtn.addEventListener('click', () => { playSound(SOUNDS.click); restartCurrentDay(); });

    dom.resetProgressBtn.addEventListener('click', () => {
        playSound(SOUNDS.click);
        hideModal(dom.pauseModal);
        showModal(dom.resetConfirmationModal);
    });

    dom.cancelResetBtn.addEventListener('click', () => {
        playSound(SOUNDS.click);
        hideModal(dom.resetConfirmationModal);
        showModal(dom.pauseModal);
    });

    dom.confirmResetBtn.addEventListener('click', () => { playSound(SOUNDS.click); resetAllProgress(); });

    for (const button of dom.buyTableButtons) {
        button.addEventListener('click', handleBuyTable);
    }

    for (const button of dom.ingredientButtons) {
        button.addEventListener('click', handleIngredientClick);
    }

    dom.undoIngredientBtn.addEventListener('click', () => { playSound(SOUNDS.click); undoIngredient(); });
    dom.clearPreparationBtn.addEventListener('click', () => { playSound(SOUNDS.click); clearPreparation(); });
    dom.serveBtn.addEventListener('click', serveSelectedOrder);

    for (const tableElement of dom.tableElements) {
        tableElement.addEventListener('click', () => {
            playSound(SOUNDS.click);
            selectTable(Number(tableElement.dataset.tableId));
        });

        tableElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectTable(Number(tableElement.dataset.tableId));
            }
        });
    }

    document.addEventListener('keydown', handleGlobalKeyboard);
}

function handleGlobalKeyboard(event) {
    if (event.key === 'Escape') {
        if (!dom.shopModal.classList.contains('is-hidden')) {
            closeShop();
            return;
        }

        if (!dom.pauseModal.classList.contains('is-hidden')) {
            resumeGame();
            return;
        }

        if (runtime.dayActive && !runtime.paused) {
            pauseGame();
        }
    }
}

/* =========================================================
   LOCALSTORAGE
========================================================= */

function loadProgress() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);

        if (!stored) {
            return { ...DEFAULT_PROGRESS };
        }

        const parsed = JSON.parse(stored);
        const safeScore = nonNegativeInteger(parsed.score, DEFAULT_PROGRESS.score);
        const calculatedLevel = calculateLevelFromScore(safeScore);

        return {
            score: safeScore,
            coins: nonNegativeInteger(parsed.coins, DEFAULT_PROGRESS.coins),
            level: clamp(
                Math.max(
                    nonNegativeInteger(parsed.level, calculatedLevel),
                    calculatedLevel
                ),
                1,
                5
            ),
            bestScore: nonNegativeInteger(parsed.bestScore, safeScore),
            bestLevel: clamp(
                nonNegativeInteger(parsed.bestLevel, calculatedLevel),
                1,
                5
            ),
            day: Math.max(1, nonNegativeInteger(parsed.day, 1)),
            unlockedTables: clamp(
                nonNegativeInteger(parsed.unlockedTables, 3),
                CONFIG.INITIAL_TABLES,
                CONFIG.MAX_TABLES
            )
        };
    } catch (error) {
        console.warn('Não foi possível carregar o progresso salvo.', error);
        return { ...DEFAULT_PROGRESS };
    }
}

function saveProgress() {
    progress.bestScore = Math.max(progress.bestScore, progress.score);
    progress.bestLevel = Math.max(progress.bestLevel, progress.level);

    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.warn('Não foi possível salvar o progresso.', error);
        showToast('O navegador não permitiu salvar o progresso.', 'warning');
    }
}

function resetAllProgress() {
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    } catch (error) {
        console.warn('Não foi possível remover o progresso salvo.', error);
    }

    window.location.reload();
}

/* =========================================================
   FLUXO PRINCIPAL E DIAS
========================================================= */

function handleStartButton() {
    SOUNDS.menu.play();
    runtime.appStarted = true;
    dom.splashScreen.classList.add('hidden');

    window.setTimeout(() => {
        prepareDayStartModal();
        showModal(dom.dayStartModal);
    }, 420);
}

function prepareDayStartModal() {
    dom.dayStartNumber.textContent = String(progress.day);
}

function beginDay() {
    SOUNDS.menu.pause();
    SOUNDS.menu.currentTime = 0;
    SOUNDS.jogo.play();

    hideModal(dom.dayStartModal);
    resetDayRuntime();

    runtime.dayActive = true;
    runtime.paused = false;
    runtime.gameOver = false;

    showToast(`Dia ${progress.day} iniciado. Bom trabalho!`, 'info');
    setBaristaMessage('Os clientes estão chegando. Mantenha a cafeteria organizada!');
    updateHud();
}

function resetDayRuntime() {
    runtime.selectedTableId = null;
    runtime.preparation = [];
    runtime.satisfaction = 100;
    runtime.dayRemaining = CONFIG.DAY_DURATION_SECONDS;
    runtime.spawnCountdown = 1.2;
    runtime.dirtCountdown = randomBetween(8, 14);
    runtime.dirtPenaltyAccumulator = 0;
    runtime.queue = [];
    runtime.customers.clear();
    runtime.dirtItems.clear();
    runtime.dayStats = createEmptyDayStats();

    dom.movementLayer.replaceChildren();
    dom.dirtLayer.replaceChildren();

    for (const table of runtime.tables.values()) {
        table.customerId = null;
        table.reserved = false;
        table.unlocked = table.id <= progress.unlockedTables;
    }

    renderQueue();
    renderAllTables();
    renderPreparation();
    updateSelectedOrderPanel();
    updateIngredientUnlocks();
}

function pauseGame() {
    if (!runtime.dayActive || runtime.paused) {
        return;
    }

    runtime.paused = true;
    SOUNDS.jogo.pause();
    showModal(dom.pauseModal);
}

function resumeGame() {
    if (!runtime.dayActive) {
        return;
    }

    hideModal(dom.pauseModal);
    runtime.paused = false;
    SOUNDS.jogo.play();
    assignQueueToAvailableTables();
}

function endDay() {
    if (!runtime.dayActive) {
        return;
    }

    SOUNDS.jogo.pause();
    SOUNDS.jogo.currentTime = 0;

    runtime.dayActive = false;
    runtime.paused = true;
    runtime.dayRemaining = 0;

    clearAllCustomersFromScene();
    clearAllDirtFromScene();
    clearSelection();
    clearPreparation();

    saveProgress();
    fillDaySummary();
    updateHud();
    playSound(SOUNDS.passouNivel);
    showModal(dom.daySummaryModal);
}

function fillDaySummary() {
    dom.summaryServedCustomers.textContent = String(runtime.dayStats.servedCustomers);
    dom.summaryLostCustomers.textContent = String(runtime.dayStats.lostCustomers);
    dom.summaryScore.textContent = String(runtime.dayStats.scoreEarned);
    dom.summaryCoins.textContent = String(runtime.dayStats.coinsEarned);
    dom.summaryCleanedDirt.textContent = String(runtime.dayStats.cleanedDirt);
    dom.summarySatisfaction.textContent = `${Math.round(runtime.satisfaction)}%`;
}

function goToNextDay() {
    hideModal(dom.daySummaryModal);
    progress.day += 1;
    saveProgress();
    applyProgressToInterface();
    prepareDayStartModal();
    showModal(dom.dayStartModal);
}

function restartCurrentDay() {
    hideModal(dom.gameOverModal);
    runtime.gameOver = false;
    prepareDayStartModal();
    showModal(dom.dayStartModal);
}

function triggerGameOver() {
    if (runtime.gameOver) {
        return;
    }

    runtime.gameOver = true;
    runtime.dayActive = false;
    runtime.paused = true;
    runtime.satisfaction = 0;

    clearAllCustomersFromScene();
    clearAllDirtFromScene();
    clearSelection();
    clearPreparation();

    dom.gameOverScore.textContent = String(progress.score);
    saveProgress();
    updateHud();
    playSound(SOUNDS.perdeu);
    showModal(dom.gameOverModal);
}

/* =========================================================
   LOOP DO JOGO
========================================================= */

function gameLoop(timestamp) {
    if (runtime.lastFrameTimestamp === null) {
        runtime.lastFrameTimestamp = timestamp;
    }

    const deltaSeconds = Math.min(
        (timestamp - runtime.lastFrameTimestamp) / 1000,
        0.25
    );

    runtime.lastFrameTimestamp = timestamp;

    if (runtime.dayActive && !runtime.paused) {
        updateDayTimer(deltaSeconds);

        if (runtime.dayActive) {
            updateCustomerSpawner(deltaSeconds);
            updateCustomers(deltaSeconds);
            updateDirtSystem(deltaSeconds);
        }
    }

    requestAnimationFrame(gameLoop);
}

function updateDayTimer(deltaSeconds) {
    runtime.dayRemaining = Math.max(0, runtime.dayRemaining - deltaSeconds);
    updateDayTimerDisplay();

    if (runtime.dayRemaining <= 0) {
        endDay();
    }
}

/* =========================================================
   CLIENTES, FILA E MESAS
========================================================= */

function updateCustomerSpawner(deltaSeconds) {
    runtime.spawnCountdown -= deltaSeconds;

    if (runtime.spawnCountdown > 0) {
        return;
    }

    spawnCustomer();
    runtime.spawnCountdown = getNextCustomerSpawnDelay();
}

function getNextCustomerSpawnDelay() {
    const levelReduction = (progress.level - 1) * 0.65;
    const minDelay = Math.max(2.6, 5.3 - levelReduction);
    const maxDelay = Math.max(4.2, 8.2 - levelReduction);
    return randomBetween(minDelay, maxDelay);
}

function spawnCustomer() {
    if (!runtime.dayActive || runtime.queue.length >= CONFIG.QUEUE_LIMIT) {
        if (runtime.queue.length >= CONFIG.QUEUE_LIMIT) {
            showToast('A fila está cheia. Libere uma mesa rapidamente!', 'warning', 1800);
        }
        return;
    }

    const character = randomChoice(CHARACTERS);
    const customer = {
        id: `customer-${++runtime.customerSequence}`,
        character,
        status: 'queue',
        tableId: null,
        recipe: null,
        orderElapsed: 0,
        patience: getQueuePatience(),
        maxPatience: 0
    };

    customer.maxPatience = customer.patience;
    runtime.customers.set(customer.id, customer);
    runtime.queue.push(customer.id);

    renderQueue();
    assignQueueToAvailableTables();
}

function getQueuePatience() {
    const levelPenalty = (progress.level - 1) * 1.3;
    return Math.max(16, randomBetween(24, 31) - levelPenalty);
}

function getTablePatience() {
    const levelPenalty = (progress.level - 1) * 2;
    return Math.max(24, randomBetween(36, 43) - levelPenalty);
}

function updateCustomers(deltaSeconds) {
    const customersSnapshot = [...runtime.customers.values()];

    for (const customer of customersSnapshot) {
        if (customer.status === 'queue') {
            customer.patience -= deltaSeconds;
            updateQueueCustomerPatience(customer);

            if (customer.patience <= 0) {
                loseCustomer(customer, 'O cliente desistiu da fila.');
            }

            continue;
        }

        if (customer.status === 'seated') {
            customer.patience -= deltaSeconds;
            customer.orderElapsed += deltaSeconds;
            updateTableCustomerPatience(customer);

            if (customer.patience <= 0) {
                loseCustomer(customer, `O cliente da Mesa ${customer.tableId} foi embora.`);
            }
        }
    }
}

function assignQueueToAvailableTables() {
    if (!runtime.dayActive || runtime.paused || runtime.queue.length === 0) {
        return;
    }

    const availableTables = [...runtime.tables.values()]
        .filter((table) => table.unlocked && !table.customerId && !table.reserved);

    shuffleArray(availableTables);

    while (runtime.queue.length > 0 && availableTables.length > 0) {
        const customerId = runtime.queue.shift();
        const customer = runtime.customers.get(customerId);
        const table = availableTables.shift();

        if (!customer || !table) {
            continue;
        }

        seatCustomerWithAnimation(customer, table);
    }

    renderQueue();
}

function seatCustomerWithAnimation(customer, table) {
    customer.status = 'moving';
    customer.tableId = table.id;
    table.reserved = true;

    renderTable(table.id);

    const movingImage = document.createElement('img');
    movingImage.className = 'moving-customer is-walking';
    movingImage.src = customer.character.standingSprite;
    movingImage.alt = `${customer.character.name} caminhando até a Mesa ${table.id}`;

    const floorRect = dom.cafeFloor.getBoundingClientRect();
    const tableRect = table.element.getBoundingClientRect();

    const startLeft = 10;
    const startTop = Math.max(15, floorRect.height - 145);
    const targetLeft = clamp(
        tableRect.left - floorRect.left + tableRect.width / 2 - 36,
        5,
        Math.max(5, floorRect.width - 80)
    );
    const targetTop = clamp(
        tableRect.top - floorRect.top + tableRect.height / 2 - 55,
        5,
        Math.max(5, floorRect.height - 130)
    );

    movingImage.style.left = `${startLeft}px`;
    movingImage.style.top = `${startTop}px`;
    dom.movementLayer.appendChild(movingImage);
    playSound(SOUNDS.andando);
    requestAnimationFrame(() => {
        movingImage.style.left = `${targetLeft}px`;
        movingImage.style.top = `${targetTop}px`;
    });

    window.setTimeout(() => {
        movingImage.remove();

        SOUNDS.andando.pause();
        SOUNDS.andando.currentTime = 0; 

        if (!runtime.dayActive || !runtime.customers.has(customer.id)) {
            table.reserved = false;
            renderTable(table.id);
            return;
        }

        customer.status = 'seated';
        customer.recipe = randomChoice(getUnlockedRecipes());
        customer.orderElapsed = 0;
        customer.patience = getTablePatience();
        customer.maxPatience = customer.patience;

        table.reserved = false;
        table.customerId = customer.id;

        renderTable(table.id);
        showFloatingFeedback(table.element, 'Novo pedido!', 'positive');
    }, 1180);
}

function loseCustomer(customer, message) {
    runtime.dayStats.lostCustomers += 1;
    changeSatisfaction(-10, message);
    playSound(SOUNDS.clienteDesistiu); 
    removeCustomer(customer);
    showToast(message, 'error');
}

function removeCustomer(customer) {
    if (!customer) {
        return;
    }

    runtime.queue = runtime.queue.filter((id) => id !== customer.id);

    if (customer.tableId !== null) {
        const table = runtime.tables.get(customer.tableId);

        if (table) {
            table.customerId = null;
            table.reserved = false;
        }
    }

    runtime.customers.delete(customer.id);

    if (customer.tableId !== null && runtime.selectedTableId === customer.tableId) {
        clearSelection();
    }

    renderQueue();

    if (customer.tableId !== null) {
        renderTable(customer.tableId);
    }

    assignQueueToAvailableTables();
}

function clearAllCustomersFromScene() {
    runtime.queue = [];
    runtime.customers.clear();
    dom.movementLayer.replaceChildren();

    for (const table of runtime.tables.values()) {
        table.customerId = null;
        table.reserved = false;
    }

    renderQueue();
    renderAllTables();
}

/* =========================================================
   RENDERIZAÇÃO DA FILA
========================================================= */

function renderQueue() {
    const slots = [...dom.queueList.querySelectorAll('.queue-slot')];

    slots.forEach((slot, index) => {
        const customerId = runtime.queue[index];
        const customer = customerId ? runtime.customers.get(customerId) : null;

        slot.replaceChildren();
        slot.classList.toggle('is-occupied', Boolean(customer));
        slot.removeAttribute('data-customer-id');

        if (!customer) {
            const empty = document.createElement('span');
            empty.className = 'queue-empty';
            empty.textContent = 'Vazio';
            slot.appendChild(empty);
            return;
        }

        slot.dataset.customerId = customer.id;

        const positionLabel = document.createElement('span');
        positionLabel.className = 'queue-position-label';
        positionLabel.textContent = `${index + 1}º da fila`;

        const image = document.createElement('img');
        image.className = 'queue-customer';
        image.src = customer.character.standingSprite;
        image.alt = `${customer.character.name} esperando na fila`;

        const patience = document.createElement('div');
        patience.className = 'queue-patience';

        const fill = document.createElement('div');
        fill.className = 'queue-patience-fill';
        fill.style.width = `${getPatiencePercentage(customer)}%`;

        patience.appendChild(fill);
        slot.append(positionLabel, image, patience);
    });

    dom.queueCounter.textContent = `${runtime.queue.length}/${CONFIG.QUEUE_LIMIT}`;
    dom.queueWarning.classList.remove('is-busy', 'is-full');

    if (runtime.queue.length === 0) {
        dom.queueWarning.textContent = 'A fila está tranquila.';
    } else if (runtime.queue.length < CONFIG.QUEUE_LIMIT) {
        dom.queueWarning.textContent = 'Há clientes esperando por uma mesa.';
        dom.queueWarning.classList.add('is-busy');
    } else {
        dom.queueWarning.textContent = 'Fila lotada! Atenda os pedidos rapidamente.';
        dom.queueWarning.classList.add('is-full');
    }
}

function updateQueueCustomerPatience(customer) {
    const slot = dom.queueList.querySelector(`[data-customer-id="${customer.id}"]`);

    if (!slot) {
        return;
    }

    const fill = slot.querySelector('.queue-patience-fill');
    const percentage = getPatiencePercentage(customer);

    fill.style.width = `${percentage}%`;
    fill.style.backgroundColor = getPatienceColor(percentage);
}

/* =========================================================
   RENDERIZAÇÃO DAS MESAS
========================================================= */

function renderAllTables() {
    for (const table of runtime.tables.values()) {
        renderTable(table.id);
    }
}

function renderTable(tableId) {
    const table = runtime.tables.get(tableId);

    if (!table) {
        return;
    }

    const element = table.element;
    const customerLayer = element.querySelector('.customer-layer');
    const orderBubble = element.querySelector('.order-bubble');
    const recipeName = element.querySelector('.order-recipe-name');
    const orderIngredients = element.querySelector('.order-ingredients');
    const patienceContainer = element.querySelector('.customer-patience');
    const patienceFill = element.querySelector('.patience-fill');
    const patienceValue = element.querySelector('.patience-value');
    const status = element.querySelector('.table-status');
    const lockedPlaceholder = element.querySelector('.locked-table-placeholder');

    element.classList.toggle('is-locked', !table.unlocked);
    element.classList.toggle('is-unlocked', table.unlocked);
    element.classList.toggle('is-selected', runtime.selectedTableId === table.id);
    element.classList.remove('is-occupied');

    customerLayer.replaceChildren();
    orderBubble.classList.add('is-hidden');
    patienceContainer.classList.add('is-hidden');

    if (lockedPlaceholder) {
        lockedPlaceholder.classList.toggle('is-hidden', table.unlocked);
    }

    if (!table.unlocked) {
        element.dataset.tableState = 'locked';
        element.tabIndex = -1;
        element.setAttribute('aria-label', `Mesa ${table.id}, bloqueada`);
        status.textContent = 'Bloqueada';
        return;
    }

    element.tabIndex = 0;

    if (table.reserved) {
        element.dataset.tableState = 'reserved';
        element.setAttribute('aria-label', `Mesa ${table.id}, cliente a caminho`);
        status.textContent = 'Cliente a caminho';
        return;
    }

    const customer = table.customerId
        ? runtime.customers.get(table.customerId)
        : null;

    if (!customer || customer.status !== 'seated') {
        element.dataset.tableState = 'empty';
        element.setAttribute('aria-label', `Mesa ${table.id}, disponível`);
        status.textContent = 'Disponível';
        return;
    }

    element.classList.add('is-occupied');
    element.dataset.tableState = 'occupied';
    element.setAttribute(
        'aria-label',
        `Mesa ${table.id}, ocupada por ${customer.character.name}, pedido ${customer.recipe.name}`
    );

    const customerImage = document.createElement('img');
    customerImage.className = 'seated-customer';
    customerImage.src = customer.character.seatedSprite;
    customerImage.alt = `${customer.character.name} sentado na Mesa ${table.id}`;
    customerLayer.appendChild(customerImage);

    recipeName.textContent = customer.recipe.name;
    orderIngredients.replaceChildren();

    for (const ingredientId of customer.recipe.ingredients) {
        const ingredient = INGREDIENTS[ingredientId];
        const icon = document.createElement('span');
        icon.className = 'order-ingredient-icon';
        icon.textContent = ingredient.icon;
        icon.title = ingredient.name;
        orderIngredients.appendChild(icon);
    }

    orderBubble.classList.remove('is-hidden');
    patienceContainer.classList.remove('is-hidden');
    status.textContent = 'Aguardando pedido';

    const percentage = getPatiencePercentage(customer);
    updatePatienceFill(patienceFill, percentage);
    patienceValue.textContent = `${Math.round(percentage)}%`;
}

function updateTableCustomerPatience(customer) {
    if (customer.tableId === null) {
        return;
    }

    const table = runtime.tables.get(customer.tableId);

    if (!table || table.customerId !== customer.id) {
        return;
    }

    const fill = table.element.querySelector('.patience-fill');
    const value = table.element.querySelector('.patience-value');
    const percentage = getPatiencePercentage(customer);

    updatePatienceFill(fill, percentage);
    value.textContent = `${Math.round(percentage)}%`;
}

function updatePatienceFill(fill, percentage) {
    fill.style.width = `${percentage}%`;
    fill.classList.toggle('is-medium', percentage <= 60 && percentage > 30);
    fill.classList.toggle('is-low', percentage <= 30);
}

function selectTable(tableId) {
    if (!runtime.dayActive || runtime.paused) {
        return;
    }

    const table = runtime.tables.get(tableId);

    if (!table || !table.unlocked) {
        return;
    }

    if (!table.customerId) {
        showToast(`A Mesa ${tableId} não possui pedido no momento.`, 'info', 1700);
        return;
    }

    const customer = runtime.customers.get(table.customerId);

    if (!customer || customer.status !== 'seated') {
        return;
    }

    runtime.selectedTableId = tableId;
    renderAllTables();
    updateSelectedOrderPanel();
    setBaristaMessage(`Preparando o pedido da Mesa ${tableId}: ${customer.recipe.name}.`);
}

function clearSelection() {
    runtime.selectedTableId = null;
    renderAllTables();
    updateSelectedOrderPanel();
}

function updateSelectedOrderPanel() {
    if (runtime.selectedTableId === null) {
        dom.selectedTableLabel.textContent = 'Nenhuma mesa selecionada';
        dom.selectedRecipeLabel.textContent = 'Clique em uma mesa ocupada para atender.';
        return;
    }

    const table = runtime.tables.get(runtime.selectedTableId);
    const customer = table && table.customerId
        ? runtime.customers.get(table.customerId)
        : null;

    if (!customer) {
        runtime.selectedTableId = null;
        dom.selectedTableLabel.textContent = 'Nenhuma mesa selecionada';
        dom.selectedRecipeLabel.textContent = 'Clique em uma mesa ocupada para atender.';
        return;
    }

    const ingredientNames = customer.recipe.ingredients
        .map((id) => INGREDIENTS[id].name)
        .join(' + ');

    dom.selectedTableLabel.textContent = `Mesa ${runtime.selectedTableId} — ${customer.recipe.name}`;
    dom.selectedRecipeLabel.textContent = `${ingredientNames} • Preço: 🪙 ${customer.recipe.price}`;
}

/* =========================================================
   PREPARO E VALIDAÇÃO DE RECEITAS
========================================================= */

function handleIngredientClick(event) {
    if (!runtime.dayActive || runtime.paused) {
        showToast('Inicie ou retome o expediente para preparar bebidas.', 'info');
        return;
    }

    const button = event.currentTarget;
    const ingredientId = button.dataset.ingredient;
    const ingredient = INGREDIENTS[ingredientId];

    if (!ingredient || ingredient.unlockLevel > progress.level) {
        showToast('Esse ingrediente ainda está bloqueado.', 'warning');
        return;
    }

    if (runtime.preparation.length >= CONFIG.MAX_PREPARATION_INGREDIENTS) {
        showToast('A bebida já atingiu o limite de ingredientes.', 'warning');
        return;
    }

    runtime.preparation.push(ingredientId);
    playSound(SOUNDS.click);
    button.classList.remove('is-selected-feedback');
    void button.offsetWidth;
    button.classList.add('is-selected-feedback');

    renderPreparation();
}

function undoIngredient() {
    if (runtime.preparation.length === 0) {
        return;
    }

    runtime.preparation.pop();
    renderPreparation();
}

function clearPreparation() {
    runtime.preparation = [];
    renderPreparation();
}

function renderPreparation() {
    dom.preparationCount.textContent = String(runtime.preparation.length);
    dom.selectedIngredients.replaceChildren();

    if (runtime.preparation.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'empty-preparation';
        empty.textContent = 'Nenhum ingrediente adicionado';
        dom.selectedIngredients.appendChild(empty);
    } else {
        for (const ingredientId of runtime.preparation) {
            const ingredient = INGREDIENTS[ingredientId];
            const chip = document.createElement('span');
            chip.className = 'selected-ingredient-chip';
            chip.textContent = ingredient.icon;
            chip.title = ingredient.name;
            dom.selectedIngredients.appendChild(chip);
        }
    }

    dom.undoIngredientBtn.disabled = runtime.preparation.length === 0;
    dom.clearPreparationBtn.disabled = runtime.preparation.length === 0;
}

function serveSelectedOrder() {
    if (!runtime.dayActive || runtime.paused) {
        showToast('O expediente não está em andamento.', 'info');
        return;
    }

    if (runtime.selectedTableId === null) {
        showToast('Selecione uma mesa ocupada antes de servir.', 'warning');
        setBaristaMessage('Primeiro, clique em uma mesa que tenha um pedido.');
        return;
    }

    if (runtime.preparation.length === 0) {
        showToast('Adicione os ingredientes da bebida.', 'warning');
        return;
    }

    const table = runtime.tables.get(runtime.selectedTableId);
    const customer = table && table.customerId
        ? runtime.customers.get(table.customerId)
        : null;

    if (!customer || customer.status !== 'seated') {
        showToast('Esse pedido não está mais disponível.', 'warning');
        clearSelection();
        return;
    }

    const isCorrect = haveSameIngredients(
        runtime.preparation,
        customer.recipe.ingredients
    );

    if (!isCorrect) {
        handleWrongOrder(customer, table);
        return;
    }

    handleCorrectOrder(customer, table);
}

function handleCorrectOrder(customer, table) {
    const multiplier = getScoreMultiplier(customer.orderElapsed);
    const earnedScore = Math.max(1, Math.round(customer.recipe.basePoints * multiplier));
    const speedBonusCoins = customer.orderElapsed <= CONFIG.FULL_SCORE_WINDOW_SECONDS ? 2 : 0;
    const earnedCoins = customer.recipe.price + speedBonusCoins;

    runtime.dayStats.servedCustomers += 1;
    runtime.dayStats.scoreEarned += earnedScore;
    runtime.dayStats.coinsEarned += earnedCoins;

    addScore(earnedScore);
    addCoins(earnedCoins);
    changeSatisfaction(customer.orderElapsed <= 10 ? 3 : 1);

    playSound(SOUNDS.servir);
    playSound(SOUNDS.moedinhas);

    const multiplierLabel = multiplier === 1
        ? 'Pontuação total!'
        : `Pontuação reduzida para ${Math.round(multiplier * 100)}%.`;

    showToast(
        `${customer.recipe.name} servido. +${earnedScore} pontos e +${earnedCoins} moedas. ${multiplierLabel}`,
        'success'
    );

    showFloatingFeedback(table.element, `+${earnedScore} ⭐`, 'positive');
    showFloatingFeedback(table.element, `+${earnedCoins} 🪙`, 'coins', 330);
    setBaristaMessage(`Pedido da Mesa ${table.id} concluído com sucesso!`);

    clearPreparation();
    removeCustomer(customer);
}

function handleWrongOrder(customer, table) {
    const penalty = Math.min(15, progress.score);

    progress.score = Math.max(0, progress.score - penalty);
    changeSatisfaction(-3, 'A receita incorreta reduziu a satisfação.');
    saveProgress();
    applyProgressToInterface();

    playSound(SOUNDS.erro);

    showToast(
        `Receita incorreta para ${customer.recipe.name}. O preparo foi descartado.`,
        'error'
    );

    showFloatingFeedback(table.element, `-${penalty} ⭐`, 'negative');
    setBaristaMessage('Essa receita não corresponde ao pedido. Tente novamente!');
    clearPreparation();
}

function haveSameIngredients(prepared, required) {
    if (prepared.length !== required.length) {
        return false;
    }

    const preparedCounts = countItems(prepared);
    const requiredCounts = countItems(required);

    if (preparedCounts.size !== requiredCounts.size) {
        return false;
    }

    for (const [ingredientId, count] of requiredCounts.entries()) {
        if (preparedCounts.get(ingredientId) !== count) {
            return false;
        }
    }

    return true;
}

function getScoreMultiplier(elapsedSeconds) {
    if (elapsedSeconds <= 10) {
        return 1;
    }

    if (elapsedSeconds <= 15) {
        return 0.75;
    }

    if (elapsedSeconds <= 20) {
        return 0.5;
    }

    return 0.25;
}

/* =========================================================
   PONTUAÇÃO, MOEDAS, NÍVEL E SATISFAÇÃO
========================================================= */

function addScore(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }

    const previousLevel = progress.level;
    progress.score += Math.round(amount);
    progress.level = Math.max(
        previousLevel,
        calculateLevelFromScore(progress.score)
    );
    progress.bestScore = Math.max(progress.bestScore, progress.score);
    progress.bestLevel = Math.max(progress.bestLevel, progress.level);

    saveProgress();
    applyProgressToInterface();

    if (progress.level > previousLevel) {
        showLevelUp(previousLevel, progress.level);
    }
}

function addCoins(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }

    progress.coins += Math.round(amount);
    saveProgress();
    updateCoinDisplays();
    updateShopInterface();
}

function changeSatisfaction(amount, reason = '') {
    if (!Number.isFinite(amount) || amount === 0) {
        return;
    }

    runtime.satisfaction = clamp(runtime.satisfaction + amount, 0, 100);
    updateSatisfactionDisplay();

    if (reason && amount < 0) {
        setBaristaMessage(reason);
    }

    if (runtime.satisfaction <= 0) {
        triggerGameOver();
    }
}

function calculateLevelFromScore(score) {
    let calculatedLevel = 1;

    for (const threshold of CONFIG.LEVEL_THRESHOLDS) {
        if (score >= threshold.score) {
            calculatedLevel = threshold.level;
        }
    }

    return calculatedLevel;
}

function showLevelUp(previousLevel, newLevel) {
    runtime.paused = true;
    playSound(SOUNDS.ganhou);
    dom.newLevelValue.textContent = String(newLevel);
    dom.unlockList.replaceChildren();

    const messages = getUnlockMessages(previousLevel, newLevel);

    for (const message of messages) {
        const item = document.createElement('div');
        item.className = 'unlock-item';
        item.textContent = message;
        dom.unlockList.appendChild(item);
    }

    updateIngredientUnlocks();
    showModal(dom.levelUpModal);
}

function closeLevelUpModal() {
    hideModal(dom.levelUpModal);

    if (runtime.dayActive && !runtime.gameOver) {
        runtime.paused = false;
        assignQueueToAvailableTables();
    }
}

function getUnlockMessages(previousLevel, newLevel) {
    const messages = [];

    for (let level = previousLevel + 1; level <= newLevel; level += 1) {
        const unlockedRecipes = RECIPES
            .filter((recipe) => recipe.unlockLevel === level)
            .map((recipe) => recipe.name);

        const unlockedIngredients = Object.values(INGREDIENTS)
            .filter((ingredient) => ingredient.unlockLevel === level)
            .map((ingredient) => ingredient.name);

        if (unlockedIngredients.length > 0) {
            messages.push(`Ingredientes liberados: ${unlockedIngredients.join(', ')}.`);
        }

        if (unlockedRecipes.length > 0) {
            messages.push(`Novas receitas: ${unlockedRecipes.join(', ')}.`);
        }

        if (level === 4) {
            messages.push('Pedidos especiais com quatro ingredientes foram liberados.');
        }

        if (level === 5) {
            messages.push('Nível máximo alcançado: clientes chegam com maior frequência.');
        }
    }

    if (messages.length === 0) {
        messages.push('A dificuldade e o ritmo da cafeteria aumentaram.');
    }

    return messages;
}

/* =========================================================
   LOJA E COMPRA DE MESAS
========================================================= */

function openShop(context) {
    if (!runtime.appStarted) {
        return;
    }

    if (context === 'running') {
        if (!runtime.dayActive) {
            showToast('A loja pode ser acessada durante a pausa ou ao final do dia.', 'info');
            return;
        }

        runtime.paused = true;
    }

    if (context === 'pause') {
        hideModal(dom.pauseModal);
    }

    if (context === 'summary') {
        hideModal(dom.daySummaryModal);
    }

    runtime.shopReturnContext = context;
    updateShopInterface();
    showModal(dom.shopModal);
}

function closeShop() {
    hideModal(dom.shopModal);

    if (runtime.shopReturnContext === 'pause') {
        showModal(dom.pauseModal);
        return;
    }

    if (runtime.shopReturnContext === 'summary') {
        showModal(dom.daySummaryModal);
        return;
    }

    if (runtime.shopReturnContext === 'running' && runtime.dayActive) {
        runtime.paused = false;
        assignQueueToAvailableTables();
    }
}

function handleBuyTable(event) {
    const button = event.currentTarget;
    const tableId = Number(button.dataset.buyTable);
    const price = Number(button.dataset.price);

    if (!Number.isInteger(tableId) || !Number.isFinite(price)) {
        return;
    }

    if (tableId <= progress.unlockedTables) {
        showToast('Essa mesa já foi comprada.', 'info');
        return;
    }

    if (tableId !== progress.unlockedTables + 1) {
        showToast(`Compre a Mesa ${tableId - 1} primeiro.`, 'warning');
        return;
    }

    if (progress.coins < price) {
        showToast(`Moedas insuficientes. Faltam ${price - progress.coins} moedas.`, 'warning');
        return;
    }

    progress.coins -= price;
    progress.unlockedTables = tableId;

    const table = runtime.tables.get(tableId);

    if (table) {
        table.unlocked = true;
    }

    saveProgress();
    applyProgressToInterface();
    renderTable(tableId);
    updateShopInterface();
    playSound(SOUNDS.pagou);
    showToast(`Mesa ${tableId} comprada e instalada!`, 'success');
}

function updateShopInterface() {
    dom.shopCoinsValue.textContent = String(progress.coins);

    for (const item of document.querySelectorAll('.shop-item')) {
        const tableId = Number(item.dataset.shopTableId);
        const button = item.querySelector('.buy-table-button');
        const price = CONFIG.TABLE_PRICES[tableId];

        item.classList.remove('is-purchased');
        button.classList.remove('is-purchased');

        if (tableId <= progress.unlockedTables) {
            item.classList.add('is-purchased');
            button.classList.add('is-purchased');
            button.disabled = true;
            button.textContent = 'Comprada';
            continue;
        }

        if (tableId === progress.unlockedTables + 1) {
            button.disabled = false;
            button.textContent = `Comprar por ${price}`;
            continue;
        }

        button.disabled = true;
        button.textContent = `Compre a Mesa ${tableId - 1} primeiro`;
    }
}

/* =========================================================
   SISTEMA DE SUJEIRA
========================================================= */

function updateDirtSystem(deltaSeconds) {
    runtime.dirtCountdown -= deltaSeconds;

    if (runtime.dirtCountdown <= 0) {
        spawnDirt();
        runtime.dirtCountdown = randomBetween(12, 25);
    }

    let oldDirtCount = 0;

    for (const dirt of runtime.dirtItems.values()) {
        dirt.age += deltaSeconds;

        if (!dirt.old && dirt.age >= CONFIG.DIRT_OLD_AFTER_SECONDS) {
            dirt.old = true;
            dirt.element.classList.add('is-old');
            showToast('Uma sujeira está há muito tempo no chão.', 'warning', 1700);
        }

        if (dirt.old) {
            oldDirtCount += 1;
        }
    }

    if (oldDirtCount > 0) {
        runtime.dirtPenaltyAccumulator += deltaSeconds;

        if (runtime.dirtPenaltyAccumulator >= CONFIG.DIRT_PENALTY_INTERVAL_SECONDS) {
            runtime.dirtPenaltyAccumulator = 0;
            changeSatisfaction(-oldDirtCount, 'A sujeira acumulada está incomodando os clientes.');
        }
    } else {
        runtime.dirtPenaltyAccumulator = 0;
    }
}

function spawnDirt() {
    if (!runtime.dayActive || runtime.dirtItems.size >= CONFIG.DIRT_MAX) {
        return;
    }

    const availablePositions = DIRT_POSITIONS.filter((position) => {
        return ![...runtime.dirtItems.values()].some((dirt) => {
            const horizontalDistance = Math.abs(dirt.left - position.left);
            const verticalDistance = Math.abs(dirt.top - position.top);
            return horizontalDistance < 8 && verticalDistance < 8;
        });
    });

    if (availablePositions.length === 0) {
        return;
    }

    const position = randomChoice(availablePositions);
    const dirt = {
        id: `dirt-${++runtime.dirtSequence}`,
        type: randomChoice(DIRT_TYPES),
        left: position.left,
        top: position.top,
        age: 0,
        old: false,
        element: null
    };

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dirt-item';
    button.dataset.dirtId = dirt.id;
    button.dataset.dirtType = dirt.type;
    button.style.left = `${dirt.left}%`;
    button.style.top = `${dirt.top}%`;
    button.setAttribute('aria-label', 'Clique para limpar a sujeira');
    button.title = 'Clique para limpar';
    button.addEventListener('click', () => cleanDirt(dirt.id));

    dirt.element = button;
    runtime.dirtItems.set(dirt.id, dirt);
    dom.dirtLayer.appendChild(button);
}

function cleanDirt(dirtId) {
    const dirt = runtime.dirtItems.get(dirtId);

    if (!dirt || !runtime.dayActive || runtime.paused) {
        return;
    }

    const earnedScore = dirt.old ? 30 : 20;

    runtime.dayStats.cleanedDirt += 1;
    runtime.dayStats.scoreEarned += earnedScore;
    addScore(earnedScore);
    changeSatisfaction(dirt.old ? 2 : 1);

    SOUNDS.limpar.currentTime = 0;
    SOUNDS.limpar.play();

    dirt.element.classList.add('is-cleaning');
    runtime.dirtItems.delete(dirtId);

    showFloatingFeedback(dirt.element, `+${earnedScore} ⭐`, 'positive');
    showToast('Sujeira removida. A cafeteria ficou mais agradável!', 'success', 1700);

    window.setTimeout(() => {
        dirt.element.remove();
    }, 380);
}

function clearAllDirtFromScene() {
    runtime.dirtItems.clear();
    dom.dirtLayer.replaceChildren();
}

/* =========================================================
   INTERFACE E HUD
========================================================= */

function applyProgressToInterface() {
    progress.level = Math.max(
        progress.level,
        calculateLevelFromScore(progress.score)
    );

    dom.dayValue.textContent = String(progress.day);
    dom.levelValue.textContent = String(progress.level);
    dom.scoreValue.textContent = String(progress.score);
    updateCoinDisplays();
    updateIngredientUnlocks();
    updateShopInterface();

    for (const table of runtime.tables.values()) {
        table.unlocked = table.id <= progress.unlockedTables;
    }

    renderAllTables();
}

function updateHud() {
    dom.dayValue.textContent = String(progress.day);
    dom.levelValue.textContent = String(progress.level);
    dom.scoreValue.textContent = String(progress.score);
    updateCoinDisplays();
    updateSatisfactionDisplay();
    updateDayTimerDisplay();
}

function updateCoinDisplays() {
    dom.coinsValue.textContent = String(progress.coins);
    dom.shopCoinsValue.textContent = String(progress.coins);
}

function updateSatisfactionDisplay() {
    const rounded = Math.round(runtime.satisfaction);

    dom.satisfactionValue.textContent = `${rounded}%`;
    dom.satisfactionFill.style.width = `${rounded}%`;
    dom.satisfactionTrack.setAttribute('aria-valuenow', String(rounded));

    dom.satisfactionFill.classList.toggle(
        'is-medium',
        rounded <= 60 && rounded > 30
    );

    dom.satisfactionFill.classList.toggle('is-low', rounded <= 30);
}

function updateDayTimerDisplay() {
    dom.dayTimerValue.textContent = formatTime(runtime.dayRemaining);

    const timerContainer = dom.dayTimerValue.closest('.day-timer');
    timerContainer.classList.toggle(
        'is-warning',
        runtime.dayRemaining <= 30 && runtime.dayRemaining > 10
    );
    timerContainer.classList.toggle('is-critical', runtime.dayRemaining <= 10);
}

function updateIngredientUnlocks() {
    for (const button of dom.ingredientButtons) {
        const ingredientId = button.dataset.ingredient;
        const ingredient = INGREDIENTS[ingredientId];
        const unlocked = ingredient && progress.level >= ingredient.unlockLevel;
        const lockLabel = button.querySelector('.ingredient-lock');

        button.disabled = !unlocked;
        button.classList.toggle('is-locked', !unlocked);

        if (lockLabel) {
            lockLabel.style.display = unlocked ? 'none' : '';
        }

        if (unlocked) {
            button.setAttribute('aria-label', `Adicionar ${ingredient.name}`);
        } else {
            button.setAttribute(
                'aria-label',
                `${ingredient.name} bloqueado até o nível ${ingredient.unlockLevel}`
            );
        }
    }
}

function setBaristaMessage(message) {
    dom.baristaMessage.textContent = message;
}

/* =========================================================
   MODAIS, TOASTS E FEEDBACKS
========================================================= */

function showModal(modal) {
    modal.classList.remove('is-hidden');
    playSound(SOUNDS.popUp);
}

function hideModal(modal) {
    modal.classList.add('is-hidden');
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast is-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    while (dom.toastContainer.children.length > 4) {
        dom.toastContainer.firstElementChild.remove();
    }

    window.setTimeout(() => {
        toast.classList.add('is-leaving');

        window.setTimeout(() => {
            toast.remove();
        }, 260);
    }, duration);
}

function showFloatingFeedback(target, text, type = 'positive', delay = 0) {
    window.setTimeout(() => {
        if (!target || !target.isConnected) {
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const floorRect = dom.cafeFloor.getBoundingClientRect();
        const feedback = document.createElement('span');

        feedback.className = `floating-feedback is-${type}`;
        feedback.textContent = text;
        feedback.style.left = `${targetRect.left - floorRect.left + targetRect.width / 2 - 30}px`;
        feedback.style.top = `${targetRect.top - floorRect.top + 22}px`;

        dom.movementLayer.appendChild(feedback);

        window.setTimeout(() => {
            feedback.remove();
        }, 1150);
    }, delay);
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function getUnlockedRecipes() {
    return RECIPES.filter((recipe) => recipe.unlockLevel <= progress.level);
}

function getPatiencePercentage(customer) {
    if (!customer || customer.maxPatience <= 0) {
        return 0;
    }

    return clamp((customer.patience / customer.maxPatience) * 100, 0, 100);
}

function getPatienceColor(percentage) {
    if (percentage <= 30) {
        return '#d84b4b';
    }

    if (percentage <= 60) {
        return '#f2bb3f';
    }

    return '#39a852';
}

function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function createEmptyDayStats() {
    return {
        servedCustomers: 0,
        lostCustomers: 0,
        scoreEarned: 0,
        coinsEarned: 0,
        cleanedDirt: 0
    };
}

function countItems(items) {
    const counts = new Map();

    for (const item of items) {
        counts.set(item, (counts.get(item) || 0) + 1);
    }

    return counts;
}

function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function shuffleArray(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }

    return items;
}

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function nonNegativeInteger(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return fallback;
    }

    return Math.floor(number);
}
