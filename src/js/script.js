const stickersData = [
{
nome: "jungkook",
imagem: "./src/images/jeon-jungkook.png",
pais: "Coreia do Sul",
profissao: "Cantor",
frase: "BTS"
},
{
nome: "jimin",
imagem: "./src/images/park-jimin.png",
pais: "Coreia do Sul",
profissao: "Cantor",
frase: "Like Crazy"
},
{
nome: "namjoon",
imagem: "./src/images/kim-namjoon.png",
pais: "Coreia do Sul",
profissao: "Rapper",
frase: "RM"
}
];

let currentSticker = null;
let currentRound = 0;
let roundScore = 0;
let totalScore = 0;
let hintsUsed = 0;
let isAnswered = false;
let waitingForNext = false;
let attemptsRemaining = 3;
let animationTimeout = null;
let errorTimeout = null;
let roundDetails = [];
let lastStickerIndex = -1;

function normalizeString(str) {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function updateRoundScoreUI() {
    const scoreSpan = document.getElementById('scoreValue');
    if (scoreSpan) scoreSpan.innerText = roundScore;
}

function updateTotalScoreUI() {
    const totalSpan = document.getElementById('streakValue');
    if (totalSpan) totalSpan.innerText = totalScore;
}

function updateAttemptsUI() {
    const attemptsSpan = document.getElementById('attemptsCounter');

    if (!attemptsSpan) return;

    attemptsSpan.innerText = `Tentativas: ${attemptsRemaining}/3`;

    if (attemptsRemaining <= 1) {
        attemptsSpan.style.color = '#ff7777';
    } else {
        attemptsSpan.style.color = '#EFBD14';
    }
}

function updateRoundHistoryUI() {
    const roundList = document.getElementById('roundScoreList');

    if (!roundList) return;

    if (roundDetails.length === 0) {
        roundList.innerHTML = '<li class="empty-ranking">Nenhuma rodada ainda</li>';
        return;
    }

    const reversed = [...roundDetails].reverse();

    roundList.innerHTML = reversed.map(item => `
        <li>
            <span>${item.personagem.toUpperCase()}</span>
            <span>${item.pontos} pts</span>
        </li>
    `).join('');
}

function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('messageContent');

    if (!msgDiv) return;

    msgDiv.innerText = msg;
    msgDiv.style.color = isError ? '#ff9999' : '#EFBD14';
}

function highlightInputError() {
    const input = document.getElementById('answerInput');

    if (!input) return;

    if (errorTimeout) clearTimeout(errorTimeout);

    input.classList.add('answer-input-error');

    errorTimeout = setTimeout(() => {
        input.classList.remove('answer-input-error');
    }, 500);
}

function clearInput() {
    const input = document.getElementById('answerInput');

    if (input) {
        input.value = '';
    }
}

function revealStickerCompletely() {
    const img = document.getElementById('stickerImage');
    const glitter = document.getElementById('glitterContainer');

    img.classList.remove('sticker-blurred');
    img.classList.add('sticker-clear');

    img.style.filter = 'blur(0px)';

    glitter.classList.remove('hidden');
    glitter.classList.add('glitter-active');
}

function resetStickerBlur() {
    const img = document.getElementById('stickerImage');

    img.classList.remove('sticker-clear');
    img.classList.remove('sticker-expanded');

    img.classList.add('sticker-blurred');

    img.style.filter = 'blur(20px)';
    img.style.opacity = '0';
}

function showStickerBlurred() {
    const img = document.getElementById('stickerImage');

    requestAnimationFrame(() => {
        img.style.opacity = '1';
    });
}

function triggerPremiumAnimationAndContinue(callback) {
    const img = document.getElementById('stickerImage');
    const card = document.getElementById('stickerCard');
    const glitter = document.getElementById('glitterContainer');

    revealStickerCompletely();

    img.classList.add('sticker-expanded');
    card.classList.add('holographic-glow');

    animationTimeout = setTimeout(() => {
        img.classList.remove('sticker-expanded');
        card.classList.remove('holographic-glow');

        glitter.classList.remove('glitter-active');
        glitter.classList.add('hidden');

        if (callback) callback();
    }, 5000);
}

function calculatePoints() {
    if (hintsUsed === 0) return 100;
    if (hintsUsed === 1) return 70;
    if (hintsUsed === 2) return 40;
    return 10;
}

function getRandomStickerExcludingLast() {
    let index = Math.floor(Math.random() * stickersData.length);

    while (index === lastStickerIndex && stickersData.length > 1) {
        index = Math.floor(Math.random() * stickersData.length);
    }

    lastStickerIndex = index;

    return { ...stickersData[index] };
}

function resetForNewRound() {
    attemptsRemaining = 3;
    hintsUsed = 0;
    isAnswered = false;
    waitingForNext = false;
    roundScore = 0;

    updateRoundScoreUI();
    updateAttemptsUI();

    const input = document.getElementById('answerInput');
    const hint = document.getElementById('hintContent');

    if (input) {
        input.disabled = false;
        input.value = '';
    }

    if (hint) {
        hint.innerText = 'Clique em DICA para uma ajuda';
    }
}

function loadRandomSticker() {
    currentSticker = getRandomStickerExcludingLast();

    const img = document.getElementById('stickerImage');

    resetStickerBlur();

    const newImage = new Image();

    newImage.src = currentSticker.imagem;

    newImage.onload = () => {
        img.src = currentSticker.imagem;

        resetStickerBlur();

        setTimeout(() => {
            showStickerBlurred();
        }, 50);
    };

    clearInput();
}

function showFinalScreen() {
    const gameContainer = document.getElementById('gameContainer');
    const finalScreen = document.getElementById('finalScreen');
    const finalDetails = document.getElementById('finalDetails');
    const finalTotal = document.getElementById('finalTotalPoints');

    gameContainer.classList.add('hidden');

    finalScreen.classList.remove('hidden');
    finalScreen.style.display = 'flex';

    document.body.style.overflow = 'hidden';

    let html = '';

    roundDetails.forEach((round, index) => {
        html += `
        <div class="final-round-item">
            <div class="final-round-header">Rodada ${index + 1}</div>
            <div class="final-round-detail">
                <span>Personagem:</span>
                <span>${round.personagem.toUpperCase()}</span>
            </div>
            <div class="final-round-detail">
                <span>Dicas usadas:</span>
                <span>${round.dicasUsadas}</span>
            </div>
            <div class="final-round-detail">
                <span>Pontos:</span>
                <span>${round.pontos}</span>
            </div>
            <div class="final-round-detail">
                <span>Resultado:</span>
                <span>${round.acertou ? 'Acertou' : 'Perdeu'}</span>
            </div>
        </div>
        `;
    });

    finalDetails.innerHTML = html;
    finalTotal.innerText = `Total de pontos: ${totalScore}`;
}

function nextRound() {
    if (currentRound >= 5) {
        showFinalScreen();
        return;
    }

    resetForNewRound();
    loadRandomSticker();

    showMessage('Pronto para adivinhar');
}

function handleRoundEnd(pointsEarned, victory) {
    roundScore = pointsEarned;
    totalScore += pointsEarned;

    updateRoundScoreUI();
    updateTotalScoreUI();

    roundDetails.push({
        personagem: currentSticker.nome,
        dicasUsadas: hintsUsed,
        pontos: pointsEarned,
        acertou: victory
    });

    updateRoundHistoryUI();

    currentRound++;

    isAnswered = true;
    waitingForNext = true;

    if (victory) {
        showMessage(`Acertou! Era ${currentSticker.nome.toUpperCase()}`);
    } else {
        showMessage(`Era ${currentSticker.nome.toUpperCase()}`, true);
    }

    triggerPremiumAnimationAndContinue(() => {
        nextRound();
    });
}

function giveHint() {
    if (!currentSticker) return;

    if (hintsUsed === 0) {
        document.getElementById('hintContent').innerText = `País: ${currentSticker.pais}`;
        hintsUsed++;
        return;
    }

    if (hintsUsed === 1) {
        document.getElementById('hintContent').innerText = `Profissão: ${currentSticker.profissao}`;
        hintsUsed++;
        return;
    }

    if (hintsUsed === 2) {
        document.getElementById('hintContent').innerText = `Frase: ${currentSticker.frase}`;
        hintsUsed++;
        return;
    }

    showMessage('Todas as dicas já foram usadas');
}

function checkAnswer() {
    if (waitingForNext || isAnswered) return;

    const input = document.getElementById('answerInput');

    if (!input) return;

    const value = input.value;

    if (!value.trim()) {
        highlightInputError();
        return;
    }

    const normalizedUser = normalizeString(value);
    const normalizedCorrect = normalizeString(currentSticker.nome);

    if (normalizedUser === normalizedCorrect) {
        handleRoundEnd(calculatePoints(), true);
        return;
    }

    attemptsRemaining--;

    updateAttemptsUI();

    highlightInputError();

    clearInput();

    if (attemptsRemaining <= 0) {
        handleRoundEnd(0, false);
        return;
    }

    showMessage(`Errado! Tentativas restantes: ${attemptsRemaining}`, true);
}

function startGame() {
    const cover = document.getElementById('coverScreen');
    const game = document.getElementById('gameContainer');
    const finalScreen = document.getElementById('finalScreen');

    cover.style.display = 'none';

    game.classList.remove('hidden');

    finalScreen.classList.add('hidden');
    finalScreen.style.display = 'none';

    document.body.style.overflow = 'hidden';

    currentRound = 0;
    totalScore = 0;
    roundScore = 0;
    hintsUsed = 0;
    attemptsRemaining = 3;
    waitingForNext = false;
    isAnswered = false;
    roundDetails = [];
    lastStickerIndex = -1;

    updateRoundScoreUI();
    updateTotalScoreUI();
    updateRoundHistoryUI();
    updateAttemptsUI();

    nextRound();
}

function restartGame() {
    const finalScreen = document.getElementById('finalScreen');

    finalScreen.classList.add('hidden');
    finalScreen.style.display = 'none';

    document.body.style.overflow = 'hidden';

    startGame();
}

function attachEventListeners() {
    const startBtn = document.getElementById('startGameBtn');
    const restartBtn = document.getElementById('restartGameBtn');
    const answerBtn = document.getElementById('answerBtn');
    const hintBtn = document.getElementById('hintBtn');
    const input = document.getElementById('answerInput');

    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }

    if (answerBtn) {
        answerBtn.addEventListener('click', checkAnswer);
    }

    if (hintBtn) {
        hintBtn.addEventListener('click', giveHint);
    }

    if (input) {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();

    const game = document.getElementById('gameContainer');
    const finalScreen = document.getElementById('finalScreen');

    game.classList.add('hidden');

    finalScreen.classList.add('hidden');
    finalScreen.style.display = 'none';

    document.body.style.overflow = 'hidden';
});