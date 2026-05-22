window.RainAudio = (() => {
    const theme = window.RainTheme.get();
    const audioPath = theme.audioPath;

    const bgm = new Audio(`${audioPath}bgm.mp3`);
    const hit = new Audio(`${audioPath}hit.mp3`);
    const win = new Audio(`${audioPath}win.mp3`);
    const bigWin = new Audio(`${audioPath}bigwin.mp3`);

    const BGM_NORMAL_VOLUME = 0.35;
    const BGM_DUCK_NORMAL_WIN_VOLUME = 0.12;
    const BGM_DUCK_BIG_WIN_VOLUME = 0.06;

    bgm.loop = true;
    bgm.volume = BGM_NORMAL_VOLUME;

    hit.volume = 0.55;
    win.volume = 0.4;
    bigWin.volume = 0.4;

    let hasBgmStarted = false;

    function startBgm() {
        if (hasBgmStarted) return;

        bgm.loop = true;
        bgm.volume = BGM_NORMAL_VOLUME;

        bgm.play()
            .then(() => {
                hasBgmStarted = true;
            })
            .catch(() => {
                // Browser may block autoplay before first user interaction.
            });
    }

    function restoreBgm() {
        bgm.volume = BGM_NORMAL_VOLUME;
    }

    function duckBgm(volume) {
        bgm.volume = volume;
    }

    function playHit() {
        const sound = hit.cloneNode();
        sound.volume = hit.volume;
        sound.play().catch(() => { });
    }

    function stopResultSounds() {
        win.pause();
        win.currentTime = 0;

        bigWin.pause();
        bigWin.currentTime = 0;
    }

    function playResult(resultType) {
        stopResultSounds();

        const isBigWin = resultType === "big";
        const sound = isBigWin ? bigWin : win;

        duckBgm(isBigWin ? BGM_DUCK_BIG_WIN_VOLUME : BGM_DUCK_NORMAL_WIN_VOLUME);

        sound.currentTime = 0;
        sound.play().catch(() => { });

        sound.onended = () => {
            duckBgm(BGM_DUCK_NORMAL_WIN_VOLUME);
        };
    }

    function bindAutoplayFallback() {
        startBgm();

        document.addEventListener("pointerdown", startBgm, { once: true });
        document.addEventListener("keydown", startBgm, { once: true });
    }

    return {
        startBgm,
        restoreBgm,
        duckBgm,
        playHit,
        playResult,
        stopResultSounds,
        bindAutoplayFallback
    };
})();