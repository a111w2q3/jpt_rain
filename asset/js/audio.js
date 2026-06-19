window.RainAudio = (() => {
    const theme = window.RainTheme.get();
    const audioPath = theme.audioPath;

    const BGM_FILE = `${audioPath}bgm-trim.ogg`;

    const hit = new Audio(`${audioPath}hit.mp3`);
    const win = new Audio(`${audioPath}win.mp3`);
    const bigWin = new Audio(`${audioPath}bigwin.mp3`);

    const BGM_NORMAL_VOLUME = 0.35;
    const BGM_DUCK_NORMAL_WIN_VOLUME = 0.12;
    const BGM_DUCK_BIG_WIN_VOLUME = 0.06;

    hit.volume = 0.55;
    win.volume = 0.4;
    bigWin.volume = 0.4;

    let audioContext = null;
    let bgmBuffer = null;
    let bgmSource = null;
    let bgmGain = null;
    let bgmLoadingPromise = null;

    function createAudioContext() {
        if (audioContext) return audioContext;

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("Web Audio API is not supported.");
        }

        audioContext = new AudioContextClass();

        bgmGain = audioContext.createGain();
        bgmGain.gain.value = BGM_NORMAL_VOLUME;
        bgmGain.connect(audioContext.destination);

        return audioContext;
    }

    function trimAudioBufferSilence(buffer, threshold = 0.0008) {
        const channelCount = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const totalSamples = buffer.length;

        let startSample = 0;
        let endSample = totalSamples - 1;

        function hasSoundAt(sampleIndex) {
            for (
                let channel = 0;
                channel < channelCount;
                channel++
            ) {
                const data = buffer.getChannelData(channel);

                if (Math.abs(data[sampleIndex]) > threshold) {
                    return true;
                }
            }

            return false;
        }

        while (
            startSample < totalSamples &&
            !hasSoundAt(startSample)
        ) {
            startSample++;
        }

        while (
            endSample > startSample &&
            !hasSoundAt(endSample)
        ) {
            endSample--;
        }

        // 保留 2ms，避免裁切得太贴而产生爆音。
        const safetySamples = Math.floor(
            sampleRate * 0.002
        );

        startSample = Math.max(
            startSample - safetySamples,
            0
        );

        endSample = Math.min(
            endSample + safetySamples,
            totalSamples - 1
        );

        const trimmedLength =
            endSample - startSample + 1;

        if (
            trimmedLength <= 0 ||
            trimmedLength >= totalSamples
        ) {
            return buffer;
        }

        const trimmedBuffer =
            audioContext.createBuffer(
                channelCount,
                trimmedLength,
                sampleRate
            );

        for (
            let channel = 0;
            channel < channelCount;
            channel++
        ) {
            const originalData =
                buffer.getChannelData(channel);

            const trimmedData =
                trimmedBuffer.getChannelData(channel);

            trimmedData.set(
                originalData.subarray(
                    startSample,
                    endSample + 1
                )
            );
        }

        console.log(
            "BGM trimmed:",
            {
                originalDuration: buffer.duration,
                trimmedDuration: trimmedBuffer.duration
            }
        );

        return trimmedBuffer;
    }

    async function ensureBgmLoaded() {
        if (bgmBuffer) return bgmBuffer;

        if (bgmLoadingPromise) {
            return bgmLoadingPromise;
        }

        bgmLoadingPromise = (async () => {
            const context = createAudioContext();

            const response = await fetch(BGM_FILE);

            if (!response.ok) {
                throw new Error(
                    `Unable to load BGM: ${response.status}`
                );
            }

            const arrayBuffer =
                await response.arrayBuffer();

            const decodedBuffer =
                await context.decodeAudioData(
                    arrayBuffer
                );

            bgmBuffer =
                trimAudioBufferSilence(decodedBuffer);

            return bgmBuffer;
        })();

        try {
            return await bgmLoadingPromise;
        } catch (error) {
            bgmLoadingPromise = null;
            throw error;
        }
    }

    async function startBgm() {
        try {
            const context = createAudioContext();

            if (context.state === "suspended") {
                await context.resume();
            }

            await ensureBgmLoaded();

            if (bgmSource) return;

            bgmSource =
                context.createBufferSource();

            bgmSource.buffer = bgmBuffer;
            bgmSource.loop = true;

            bgmSource.loopStart = 0;
            bgmSource.loopEnd =
                bgmBuffer.duration;

            bgmSource.connect(bgmGain);
            bgmSource.start(0);

            bgmSource.onended = () => {
                bgmSource = null;
            };
        } catch (error) {
            console.warn(
                "BGM could not be started:",
                error
            );
        }
    }

    function stopBgm() {
        if (!bgmSource) return;

        const source = bgmSource;
        bgmSource = null;

        source.onended = null;

        try {
            source.stop();
        } catch (error) { }

        try {
            source.disconnect();
        } catch (error) { }
    }

    function setBgmVolume(volume) {
        if (!bgmGain || !audioContext) return;

        const currentTime =
            audioContext.currentTime;

        bgmGain.gain.cancelScheduledValues(
            currentTime
        );

        bgmGain.gain.setValueAtTime(
            bgmGain.gain.value,
            currentTime
        );

        bgmGain.gain.linearRampToValueAtTime(
            volume,
            currentTime + 0.08
        );
    }

    function restoreBgm() {
        setBgmVolume(BGM_NORMAL_VOLUME);
    }

    function duckBgm(volume) {
        setBgmVolume(volume);
    }

    function playHit() {
        const sound = hit.cloneNode();

        sound.volume = hit.volume;
        sound.play().catch(() => { });
    }

    function stopResultSounds() {
        win.pause();
        win.currentTime = 0;
        win.onended = null;

        bigWin.pause();
        bigWin.currentTime = 0;
        bigWin.onended = null;
    }

    function playResult(resultType) {
        stopResultSounds();

        const isBigWin =
            resultType === "big";

        const sound =
            isBigWin ? bigWin : win;

        duckBgm(
            isBigWin
                ? BGM_DUCK_BIG_WIN_VOLUME
                : BGM_DUCK_NORMAL_WIN_VOLUME
        );

        sound.currentTime = 0;

        sound.play().catch(() => {
            restoreBgm();
        });

        sound.onended = () => {
            restoreBgm();
        };
    }

    function bindAutoplayFallback() {
        ensureBgmLoaded().catch((error) => {
            console.warn(
                "BGM preload failed:",
                error
            );
        });

        document.addEventListener(
            "pointerdown",
            startBgm,
            { once: true }
        );

        document.addEventListener(
            "keydown",
            startBgm,
            { once: true }
        );
    }

    return {
        startBgm,
        stopBgm,
        restoreBgm,
        duckBgm,
        playHit,
        playResult,
        stopResultSounds,
        bindAutoplayFallback
    };
})();
