document.addEventListener("DOMContentLoaded", () => {
    const rainStage = document.getElementById("rainStage");
    const rainIntro = document.getElementById("rainIntro");
    const rainGameTop = document.querySelector(".rainGame__top");
    const startRainBtn = document.getElementById("startRainBtn");
    const playAgainBtn = document.getElementById("playAgainBtn");

    const rainTimer = document.getElementById("rainTimer");
    const rainTimerBarFill = document.getElementById("rainTimerBarFill");
    const rainHits = document.getElementById("rainHits");

    const rainResult = document.getElementById("rainResult");
    const rainResultCard = document.getElementById("rainResultCard");
    const resultBadge = document.getElementById("resultBadge");
    const resultTitle = document.getElementById("resultTitle");
    const resultDesc = document.getElementById("resultDesc");
    const rewardType = document.getElementById("rewardType");
    const finalAmount = document.getElementById("finalAmount");
    const finalHits = document.getElementById("finalHits");

    const GAME_DURATION = 15;
    const PACKET_INTERVAL = 360;
    const BIG_WIN_RATE = 0.5;
    const SECOND_ITEM_RATE = 0.5;

    let gameTimer = null;
    let packetTimer = null;
    let timeLeft = GAME_DURATION;
    let totalAmount = 0;
    let totalHits = 0;
    let isPlaying = false;

    function startRainGame() {
        resetRainGame();

        isPlaying = true;
        rainIntro.style.display = "none";
        rainGameTop.classList.add("is-show");

        rainResult.classList.remove("is-show", "is-big-win", "is-normal-win");
        rainResult.setAttribute("aria-hidden", "true");
        rainResultCard.classList.remove("is-big-win", "is-normal-win");

        RainAudio.startBgm();
        RainAudio.restoreBgm();

        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimer();

            if (timeLeft <= 0) {
                endRainGame();
            }
        }, 1000);

        packetTimer = setInterval(() => {
            createRedPacket();
        }, PACKET_INTERVAL);
    }

    function resetRainGame() {
        clearInterval(gameTimer);
        clearInterval(packetTimer);

        timeLeft = GAME_DURATION;
        totalAmount = 0;
        totalHits = 0;
        isPlaying = false;

        rainTimer.textContent = timeLeft;
        rainTimerBarFill.style.width = "100%";
        rainHits.textContent = totalHits;

        rainStage.querySelectorAll(".redPacket, .packetOpenEffect").forEach((item) => {
            item.remove();
        });
    }

    function updateTimer() {
        rainTimer.textContent = timeLeft;

        const progress = Math.max(timeLeft / GAME_DURATION, 0);
        rainTimerBarFill.style.width = `${progress * 100}%`;
    }

    function getPacketType() {
        return Math.random() < SECOND_ITEM_RATE ? "type2" : "type1";
    }

    function createRedPacket() {
        if (!isPlaying) return;

        const packet = document.createElement("button");
        const packetType = getPacketType();

        packet.type = "button";
        packet.className = `redPacket redPacket--${packetType}`;
        packet.dataset.packetType = packetType;

        const stageWidth = rainStage.clientWidth;
        const packetWidth = 66;
        const randomLeft = Math.random() * (stageWidth - packetWidth);
        const randomDuration = 2.4 + Math.random() * 1.4;
        const randomRotate = `${Math.floor(Math.random() * 36) - 18}deg`;

        packet.style.left = `${randomLeft}px`;
        packet.style.animationDuration = `${randomDuration}s`;
        packet.style.setProperty("--rotate", randomRotate);

        packet.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            collectPacket(packet);
        });

        packet.addEventListener("animationend", () => {
            packet.remove();
        });

        rainStage.appendChild(packet);
    }

    function collectPacket(packet) {
        if (!isPlaying || packet.classList.contains("is-hit")) return;

        const reward = getRandomReward(packet.dataset.packetType);

        totalHits++;
        totalAmount += reward;

        rainHits.textContent = totalHits;

        createOpenEffect(packet);

        packet.classList.add("is-hit");
        RainAudio.playHit();

        setTimeout(() => {
            packet.remove();
        }, 340);
    }

    function createOpenEffect(packet) {
        const packetRect = packet.getBoundingClientRect();
        const stageRect = rainStage.getBoundingClientRect();

        const effect = document.createElement("div");
        effect.className = "packetOpenEffect";

        effect.style.left = `${packetRect.left - stageRect.left + packetRect.width / 2}px`;
        effect.style.top = `${packetRect.top - stageRect.top + packetRect.height / 2}px`;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement("span");
            const angle = (360 / 8) * i;
            const distance = 28 + Math.random() * 18;

            particle.style.setProperty("--x", `${Math.cos(angle * Math.PI / 180) * distance}px`);
            particle.style.setProperty("--y", `${Math.sin(angle * Math.PI / 180) * distance}px`);
            particle.style.setProperty("--delay", `${Math.random() * 0.06}s`);

            effect.appendChild(particle);
        }

        rainStage.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 650);
    }

    function setupResultPopup(resultType) {
        const theme = window.RainTheme.get();
        const resultCopy = theme.result[resultType];

        rainResultCard.classList.remove("is-big-win", "is-normal-win");
        rainResult.classList.remove("is-big-win", "is-normal-win");

        if (resultType === "big") {
            rainResultCard.classList.add("is-big-win");
            rainResult.classList.add("is-big-win");

            totalAmount = Math.max(
                totalAmount * theme.bigWinMultiplier,
                theme.bigWinMinAmount
            );
        } else {
            rainResultCard.classList.add("is-normal-win");
            rainResult.classList.add("is-normal-win");
        }

        resultBadge.textContent = resultCopy.badge;
        resultTitle.textContent = resultCopy.title;
        resultDesc.textContent = resultCopy.desc;
        rewardType.textContent = resultCopy.rewardType;
    }

    function getResultType() {
        const theme = window.RainTheme.get();
        return Math.random() < theme.bigWinRate ? "big" : "normal";
    }

    function getRandomReward(packetType = "type1") {
        const rewardsType1 = [0.18, 0.28, 0.38, 0.58, 0.88, 1.28, 1.88];
        const rewardsType2 = [0.88, 1.28, 1.88, 2.88, 3.88];

        const rewards = packetType === "type2" ? rewardsType2 : rewardsType1;
        const randomIndex = Math.floor(Math.random() * rewards.length);

        return rewards[randomIndex];
    }

    function endRainGame() {
        isPlaying = false;

        clearInterval(gameTimer);
        clearInterval(packetTimer);

        rainGameTop.classList.remove("is-show");

        rainStage.querySelectorAll(".redPacket").forEach((packet) => {
            packet.remove();
        });

        const resultType = getResultType();

        setupResultPopup(resultType);

        finalAmount.textContent = totalAmount.toFixed(2);
        finalHits.textContent = totalHits;

        RainAudio.playResult(resultType);

        rainResult.classList.add("is-show");
        rainResult.setAttribute("aria-hidden", "false");
    }

    startRainBtn.addEventListener("click", startRainGame);

    playAgainBtn.addEventListener("click", () => {
        RainAudio.stopResultSounds();
        RainAudio.restoreBgm();

        rainIntro.style.display = "block";
        rainGameTop.classList.remove("is-show");

        rainResult.classList.remove("is-show", "is-big-win", "is-normal-win");
        rainResult.setAttribute("aria-hidden", "true");

        rainResultCard.classList.remove("is-big-win", "is-normal-win");

        resetRainGame();
    });

    RainAudio.bindAutoplayFallback();
});
