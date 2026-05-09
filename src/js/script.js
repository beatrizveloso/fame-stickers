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
let roundScore = 0;
let totalScore = 0;
let hintsUsed = 0;
let isAnswered = false;
let waitingForNext = false;
let lastStickerIndex = -1;
let roundHistory = [];
let localRanking = [];

function normalizeString(str) {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function loadLocalRanking() {
    const stored = localStorage.getItem('fameLocalRanking');
    if (stored) {
        localRanking = JSON.parse(stored);
    } else {
        localRanking = [];
    }
    updateLocalRankingUI();
}

function saveLocalRanking() {
    localRanking.sort((a, b) => b.points - a.points);
    localRanking = localRanking.slice(0, 5);
    localStorage.setItem('fameLocalRanking', JSON.stringify(localRanking));
    updateLocalRankingUI();
}

function updateLocalRankingUI() {
    const rankingList = document.getElementById('localRankingList');
    if (!rankingList) return;
    if (localRanking.length === 0) {
        rankingList.innerHTML = '<li class="empty-ranking">Nenhum recorde ainda</li>';
        return;
    }
    rankingList.innerHTML = localRanking.map(entry => 
        `<li><span>${entry.points} pts</span><span>${entry.date}</span></li>`
    ).join('');
}

function addToLocalRanking(points) {
    const today = new Date().toLocaleDateString('pt-BR');
    localRanking.push({ points: points, date: today });
    saveLocalRanking();
}

function updateRoundScoreUI() {
    const scoreSpan = document.getElementById('scoreValue');
    if (scoreSpan) scoreSpan.innerText = roundScore;
}

function updateTotalScoreUI() {
    const streakSpan = document.getElementById('streakValue');
    if (streakSpan) streakSpan.innerText = totalScore;
}

function updateRoundHistoryUI() {
    const roundList = document.getElementById('roundScoreList');
    if (!roundList) return;
    if (roundHistory.length === 0) {
        roundList.innerHTML = '<li class="empty-ranking">Nenhuma rodada ainda</li>';
        return;
    }
    const reversed = [...roundHistory].reverse();
    roundList.innerHTML = reversed.map(item => 
        `<li><span>${item.sticker}</span><span>${item.points} pts</span></li>`
    ).join('');
}

function addRoundToHistory(stickerName, points) {
    roundHistory.unshift({ sticker: stickerName.toUpperCase(), points: points });
    if (roundHistory.length > 5) roundHistory.pop();
    updateRoundHistoryUI();
}

function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('messageContent');
    if (msgDiv) {
        msgDiv.innerText = msg;
        msgDiv.style.color = isError ? '#ffaa99' : '#EFBD14';
        setTimeout(() => {
            if (document.getElementById('messageContent') && document.getElementById('messageContent').innerText === msg) {
                msgDiv.style.color = '#EFBD14';
            }
        }, 2200);
    }
}

function triggerPremiumAnimation() {
    const img = document.getElementById('stickerImage');
    const card = document.getElementById('stickerCard');
    const glitterDiv = document.getElementById('glitterContainer');
    
    img.classList.remove('sticker-blurred');
    img.classList.add('sticker-clear');
    img.classList.add('sticker-expanded');
    card.classList.add('holographic-glow');
    glitterDiv.classList.remove('hidden');
    glitterDiv.classList.add('glitter-active');
    
    setTimeout(() => {
        img.classList.remove('sticker-expanded');
        card.classList.remove('holographic-glow');
    }, 800);
    
    setTimeout(() => {
        glitterDiv.classList.remove('glitter-active');
        glitterDiv.classList.add('hidden');
    }, 1200);
}

function resetUIForNewSticker() {
    const img = document.getElementById('stickerImage');
    const glitterDiv = document.getElementById('glitterContainer');
    glitterDiv.classList.remove('glitter-active');
    glitterDiv.classList.add('hidden');
    img.classList.remove('sticker-clear', 'sticker-expanded');
    img.classList.add('sticker-blurred');
    
    const hintDiv = document.getElementById('hintContent');
    if (hintDiv) hintDiv.innerText = 'Clique em DICA para uma ajuda';
    
    const inputField = document.getElementById('answerInput');
    if (inputField) {
        inputField.value = '';
        inputField.disabled = false;
    }
    
    const answerBtn = document.getElementById('answerBtn');
    const hintBtn = document.getElementById('hintBtn');
    if (answerBtn) answerBtn.disabled = false;
    if (hintBtn) hintBtn.disabled = false;
    
    isAnswered = false;
    waitingForNext = false;
    hintsUsed = 0;
}

function getRandomStickerExcludingLast() {
    let newIndex = Math.floor(Math.random() * stickersData.length);
    while (newIndex === lastStickerIndex && stickersData.length > 1) {
        newIndex = Math.floor(Math.random() * stickersData.length);
    }
    lastStickerIndex = newIndex;
    return { ...stickersData[newIndex] };
}

function loadRandomSticker() {
    currentSticker = getRandomStickerExcludingLast();
    const imgElement = document.getElementById('stickerImage');
    imgElement.src = currentSticker.imagem;
    imgElement.onerror = function() {
        this.src = currentSticker.imagem;
    };
    resetUIForNewSticker();
}

function calculatePoints() {
    if (hintsUsed === 0) return 100;
    if (hintsUsed === 1) return 70;
    if (hintsUsed === 2) return 40;
    return 10;
}

function giveHint() {
    if (!currentSticker) return;
    if (waitingForNext || isAnswered) {
        showMessage('Aguarde a próxima figurinha!', false);
        return;
    }
    if (hintsUsed === 0) {
        document.getElementById('hintContent').innerHTML = `País: ${currentSticker.pais}`;
        showMessage('Dica 1/3: País de origem');
    } else if (hintsUsed === 1) {
        document.getElementById('hintContent').innerHTML = `Profissão: ${currentSticker.profissao}`;
        showMessage('Dica 2/3: Profissão');
    } else if (hintsUsed === 2) {
        document.getElementById('hintContent').innerHTML = `Frase: "${currentSticker.frase}"`;
        showMessage('Dica 3/3: Frase icônica');
    } else {
        showMessage('Você já usou todas as dicas!', false);
        return;
    }
    hintsUsed++;
}

function handleCorrectAnswer(points) {
    roundScore += points;
    totalScore += points;
    updateRoundScoreUI();
    updateTotalScoreUI();
    
    addRoundToHistory(currentSticker.nome, points);
    addToLocalRanking(totalScore);
    
    triggerPremiumAnimation();
    showMessage(`ACERTOU! +${points} pts! Era ${currentSticker.nome.toUpperCase()} 🎉`, false);
    
    isAnswered = true;
    waitingForNext = true;
    
    const inputField = document.getElementById('answerInput');
    const answerBtn = document.getElementById('answerBtn');
    const hintBtn = document.getElementById('hintBtn');
    if (inputField) inputField.disabled = true;
    if (answerBtn) answerBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    
    const clickHandler = function(e) {
        if (!waitingForNext) return;
        waitingForNext = false;
        loadRandomSticker();
        showMessage('Nova figurinha! Tente adivinhar', false);
        document.removeEventListener('click', clickHandler);
    };
    document.addEventListener('click', clickHandler);
    setTimeout(() => {
        if (waitingForNext) {
            showMessage('Clique em qualquer lugar para próxima figurinha', false);
        }
    }, 300);
}

function checkAnswer() {
    if (waitingForNext || isAnswered) {
        showMessage('Aguardando próxima figurinha... clique na tela!', false);
        return;
    }
    if (!currentSticker) return;
    
    const userAnswer = document.getElementById('answerInput').value;
    if (!userAnswer.trim()) {
        showMessage('Digite um nome!', true);
        return;
    }
    
    const normalizedUser = normalizeString(userAnswer);
    const normalizedCorrect = normalizeString(currentSticker.nome);
    
    if (normalizedUser === normalizedCorrect) {
        const pointsEarned = calculatePoints();
        handleCorrectAnswer(pointsEarned);
    } else {
        showMessage(`Não é "${userAnswer}". Tente novamente!`, true);
        const imgEl = document.getElementById('stickerImage');
        imgEl.style.transform = 'scale(0.98)';
        setTimeout(() => { if(imgEl) imgEl.style.transform = ''; }, 200);
    }
}

function startGame() {
    const cover = document.getElementById('coverScreen');
    const game = document.getElementById('gameContainer');
    if (cover) cover.style.display = 'none';
    if (game) game.classList.remove('hidden');
    
    roundScore = 0;
    totalScore = 0;
    hintsUsed = 0;
    isAnswered = false;
    waitingForNext = false;
    roundHistory = [];
    lastStickerIndex = -1;
    updateRoundScoreUI();
    updateTotalScoreUI();
    updateRoundHistoryUI();
    loadLocalRanking();
    
    loadRandomSticker();
    
    const inputField = document.getElementById('answerInput');
    if (inputField) inputField.disabled = false;
    const answerBtn = document.getElementById('answerBtn');
    const hintBtn = document.getElementById('hintBtn');
    if (answerBtn) answerBtn.disabled = false;
    if (hintBtn) hintBtn.disabled = false;
}

function attachEventListeners() {
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) startBtn.addEventListener('click', startGame);
    const answerBtn = document.getElementById('answerBtn');
    if (answerBtn) answerBtn.addEventListener('click', checkAnswer);
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) hintBtn.addEventListener('click', giveHint);
    const inputField = document.getElementById('answerInput');
    if (inputField) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();
    const gameDiv = document.getElementById('gameContainer');
    if (gameDiv) gameDiv.classList.add('hidden');
    loadLocalRanking();
    waitingForNext = false;
    isAnswered = false;
});