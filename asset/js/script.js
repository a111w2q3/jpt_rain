document.addEventListener("DOMContentLoaded", () => {
    const rainStage = document.getElementById("rainStage");
    const rainIntro = document.getElementById("rainIntro");
    const rainCountdown = document.getElementById("rainCountdown");
    const rainCountdownImage = document.getElementById("rainCountdownImage");
    const rainGameTop = document.querySelector(".rainGame__top");
    const startRainBtn = document.getElementById("startRainBtn");
    const playAgainBtn = document.getElementById("playAgainBtn");

    const rainTimer = document.getElementById("rainTimer");
    const rainTimerBarFill = document.getElementById("rainTimerBarFill");
    const rainCombo = document.getElementById("rainCombo");
    const rainComboCount = document.getElementById("rainComboCount");

    const rainResult = document.getElementById("rainResult");
    const rainResultCard = document.getElementById("rainResultCard");
    const resultBadge = document.getElementById("resultBadge");
    const resultTitle = document.getElementById("resultTitle");
    const resultDesc = document.getElementById("resultDesc");
    const rewardType = document.getElementById("rewardType");
    const finalAmount = document.getElementById("finalAmount");
    const finalHits = document.getElementById("finalHits");
    const rewardBreakdown = document.getElementById("rewardBreakdown");
    const resultOpened = document.getElementById("resultOpened");
    const resultPrizeCount = document.getElementById("resultPrizeCount");
    const resultEmptyCount = document.getElementById("resultEmptyCount");

    const i18n = window.RainI18n;
    const GAME_DURATION = 15;
    const PACKET_INTERVAL = 360;
    const SECOND_ITEM_RATE = 0.5;

    const feedbackNames = ["bravo", "perfect", "nice"];
    const feedbackImageCache = { en: [], zh: [] };
    for (const language of ["en", "zh"]) {
        feedbackImageCache[language] = feedbackNames.map((name) => {
            const image = new Image();
            image.src = i18n.image(name, language);
            image.alt = "";
            image.setAttribute("aria-hidden", "true");
            image.decode?.().catch(() => {});
            return image;
        });
    }

    let countdownTimer = null;
    let countdownStep = 0;
    const COUNTDOWN_STEPS = ["3", "2", "1", "go"];
    const COUNTDOWN_IMAGE_BASE = "asset/image/angpao/";
    COUNTDOWN_STEPS.forEach((step) => {
        for (const language of ["en", "zh"]) {
            const image = new Image();
            image.src = step === "go" ? i18n.image("go", language) : `${COUNTDOWN_IMAGE_BASE}${step}.png`;
        }
    });
    let gameTimer = null;
    let packetTimer = null;
    let timeLeft = GAME_DURATION;
    let totalAmount = 0;
    let totalHits = 0;
    let combo = 0;
    let comboHideTimer = null;
    let rewardHistory = [];
    let isPlaying = false;

    function startCountdown() {
        if (countdownTimer || isPlaying) return;
        resetRainGame();
        RainAudio.stopCountdown();
        rainIntro.style.display = "none";
        rainCountdown.classList.add("is-show");
        rainCountdown.setAttribute("aria-hidden", "false");
        countdownStep = 0;
        showCountdownStep();
        RainAudio.playCountdown();
        countdownTimer = setInterval(() => {
            countdownStep++;
            if (countdownStep < COUNTDOWN_STEPS.length) {
                showCountdownStep();
            } else {
                clearInterval(countdownTimer);
                countdownTimer = null;
                rainCountdown.classList.remove("is-show");
                rainCountdown.setAttribute("aria-hidden", "true");
                startRainGame();
            }
        }, 900);
    }

    function showCountdownStep() {
        const step = COUNTDOWN_STEPS[countdownStep];
        rainCountdownImage.src = step === "go" ? i18n.image("go") : `${COUNTDOWN_IMAGE_BASE}${step}.png`;
        rainCountdownImage.alt = step === "go" ? (i18n.language === "zh" ? "开始" : "GO") : step;
        rainCountdownImage.classList.remove("is-pop");
        void rainCountdownImage.offsetWidth;
        rainCountdownImage.classList.add("is-pop");
    }

    function startRainGame() {
        resetRainGame();

        isPlaying = true;
        rainIntro.style.display = "none";
        rainGameTop.classList.add("is-show");

        rainResult.classList.remove("is-show", "is-big-win", "is-normal-win", "is-empty");
        rainResult.setAttribute("aria-hidden", "true");
        rainResultCard.classList.remove("is-big-win", "is-normal-win", "is-empty");

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
        clearInterval(countdownTimer);
        countdownTimer = null;

        timeLeft = GAME_DURATION;
        totalAmount = 0;
        totalHits = 0;
        clearCombo();
        rewardHistory = [];
        isPlaying = false;

        rainTimer.textContent = timeLeft;
        rainTimerBarFill.style.width = "100%";
        rainStage.querySelectorAll(".redPacket, .packetOpenEffect").forEach((item) => {
            item.remove();
        });
    }

    function updateTimer() {
        rainTimer.textContent = timeLeft;

        const progress = Math.max(timeLeft / GAME_DURATION, 0);
        rainTimerBarFill.style.width = `${progress * 100}%`;
    }

    function clearCombo() {
        combo = 0;
        clearTimeout(comboHideTimer);
        comboHideTimer = null;
        rainStage.classList.remove("is-combo-flash");
        rainCombo.classList.remove("is-show", "is-pop");
        rainCombo.setAttribute("aria-hidden", "true");
    }

    function flashComboScreen() {
        rainStage.classList.remove("is-combo-flash");
        void rainStage.offsetWidth;
        rainStage.classList.add("is-combo-flash");
    }

    function showCombo() {
        clearTimeout(comboHideTimer);
        if (combo < 2) return;
        flashComboScreen();
        rainComboCount.textContent = `x${combo}`;
        rainCombo.classList.remove("is-pop");
        void rainCombo.offsetWidth;
        rainCombo.classList.add("is-show", "is-pop");
        rainCombo.setAttribute("aria-hidden", "false");
        comboHideTimer = setTimeout(() => {
            rainCombo.classList.remove("is-show", "is-pop");
            rainCombo.setAttribute("aria-hidden", "true");
        }, 900);
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
            if (isPlaying && !packet.classList.contains("is-hit")) clearCombo();
            packet.remove();
        });

        rainStage.appendChild(packet);
    }

    function collectPacket(packet) {
        if (!isPlaying || packet.classList.contains("is-hit")) return;

        const reward = getRandomReward(packet.dataset.packetType);

        totalHits++;
        combo++;
        showCombo();
        totalAmount += reward;
        rewardHistory.push(reward);


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

        const cachedImage = feedbackImageCache[i18n.language][
            Math.floor(Math.random() * feedbackImageCache[i18n.language].length)
        ];
        const feedbackImage = cachedImage.cloneNode();
        feedbackImage.className = "packetFeedbackImage";
        effect.appendChild(feedbackImage);

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
        }, 1200);
    }

    function setupResultPopup(resultType) {
        const resultCopy = {
            badge: i18n.t(resultType === "win" ? "winBadge" : "emptyBadge"),
            title: i18n.t(resultType === "win" ? "winTitle" : "emptyTitle"),
            desc: i18n.t(resultType === "win" ? "winDesc" : "emptyDesc"),
            rewardType: i18n.t(resultType === "win" ? "winReward" : "emptyReward")
        };

        rainResultCard.classList.remove("is-big-win", "is-normal-win", "is-empty");
        rainResult.classList.remove("is-big-win", "is-normal-win", "is-empty");

        if (resultType === "empty") {
            rainResultCard.classList.add("is-empty");
            rainResult.classList.add("is-empty");
        } else {
            rainResultCard.classList.add("is-big-win");
            rainResult.classList.add("is-big-win");
        }

        resultBadge.textContent = resultCopy.badge;
        resultTitle.textContent = resultCopy.title;
        resultDesc.textContent = resultCopy.desc;
        rewardType.textContent = resultCopy.rewardType;
    }

    function renderRewardBreakdown() {
        rewardBreakdown.replaceChildren();
        const groupedRewards = new Map();

        rewardHistory.forEach((reward) => {
            const amount = Number(reward) || 0;
            const key = amount.toFixed(2);
            groupedRewards.set(key, (groupedRewards.get(key) || 0) + 1);
        });

        const sortedRewards = [...groupedRewards.entries()]
    .sort(([amountA], [amountB]) => {
        const a = Number(amountA);
        const b = Number(amountB);

        if (a <= 0 && b > 0) return 1;
        if (b <= 0 && a > 0) return -1;

        return a - b;
    });

        sortedRewards.forEach(([amount, count]) => {
            const numericAmount = Number(amount);
            const row = document.createElement("div");
            row.className = `rainResult__rewardRow${numericAmount <= 0 ? " is-no-prize" : ""}`;

            const label = document.createElement("span");
            label.textContent = numericAmount <= 0 ? i18n.t("noPrize") : `RM ${numericAmount.toFixed(2)}`;

            const hits = document.createElement("b");
            hits.textContent = `\u00D7${count}`;

            const subtotal = document.createElement("strong");
            subtotal.textContent = numericAmount <= 0
                ? "-"
                : `RM ${(numericAmount * count).toFixed(2)}`;

            row.append(label, hits, subtotal);
            rewardBreakdown.appendChild(row);
        });

        if (sortedRewards.length === 0) {
            const emptyState = document.createElement("p");
            emptyState.className = "rainResult__rewardEmpty";
            emptyState.textContent = i18n.t("noCollected");
            rewardBreakdown.appendChild(emptyState);
        }

        const prizeCount = rewardHistory.filter((reward) => Number(reward) > 0).length;
        const emptyCount = rewardHistory.length - prizeCount;
        resultOpened.textContent = rewardHistory.length;
        resultPrizeCount.textContent = prizeCount;
        resultEmptyCount.textContent = emptyCount;
    }

    function getResultType() {
        // Result has only two states: any positive reward is WIN; otherwise EMPTY.
        if (totalHits === 0 || totalAmount <= 0) return "empty";
        return "win";
    }

    function getRandomReward(packetType = "type1") {
        // Zero is kept in the fake demo so the result UI can preview No Prize rows.
        const rewardsType1 = [0, 0.18, 0.28, 0.38, 0.58, 0.88, 1.28, 1.88];
        const rewardsType2 = [0, 0.88, 1.28, 1.88, 2.88, 3.88];

        const rewards = packetType === "type2" ? rewardsType2 : rewardsType1;
        const randomIndex = Math.floor(Math.random() * rewards.length);

        return rewards[randomIndex];
    }

    function endRainGame() {
        isPlaying = false;
        clearCombo();

        clearInterval(gameTimer);
        clearInterval(packetTimer);

        rainGameTop.classList.remove("is-show");

        rainStage.querySelectorAll(".redPacket").forEach((packet) => {
            packet.remove();
        });

        const resultType = getResultType();

        setupResultPopup(resultType);
        renderRewardBreakdown();

        finalAmount.textContent = totalAmount.toFixed(2);
        finalHits.textContent = totalHits;

        RainAudio.playResult(resultType === "empty" ? "normal" : "big");

        rainResult.classList.add("is-show");
        rainResult.setAttribute("aria-hidden", "false");
    }

    document.addEventListener("rain:languagechange", () => {
        if (rainCountdown.classList.contains("is-show")) showCountdownStep();
        if (rainResult.classList.contains("is-show")) {
            setupResultPopup(getResultType());
            renderRewardBreakdown();
        }
    });

    startRainBtn.addEventListener("click", startCountdown);

    playAgainBtn.addEventListener("click", () => {
        RainAudio.stopResultSounds();
        RainAudio.restoreBgm();

        rainIntro.style.display = "block";
        rainGameTop.classList.remove("is-show");

        rainResult.classList.remove("is-show", "is-big-win", "is-normal-win", "is-empty");
        rainResult.setAttribute("aria-hidden", "true");

        rainResultCard.classList.remove("is-big-win", "is-normal-win", "is-empty");

        resetRainGame();
    });

    RainAudio.bindAutoplayFallback();
});
