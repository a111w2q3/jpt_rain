window.RainAudio = (() => {
    const theme = window.RainTheme.get();
    const audioConfig = theme.audio;

    const audioPath = audioConfig.path;
    const files = audioConfig.files;
    const volume = audioConfig.volume;
    const bgmConfig = audioConfig.bgm;

    const BGM_FILE = `${audioPath}${files.bgm}`;

    const hit = new Audio(`${audioPath}${files.hit}`);
    const win = new Audio(`${audioPath}${files.win}`);
    const bigWin = new Audio(`${audioPath}${files.bigWin}`);

    hit.volume = volume.hit;
    win.volume = volume.win;
    bigWin.volume = volume.bigWin;

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
        bgmGain.gain.value = volume.bgm;
        bgmGain.connect(audioContext.destination);

        return audioContext;
    }

    function trimAudioBufferSilence(buffer) {
        if (!bgmConfig.trimSilence) {
            return buffer;
        }

        const threshold =
            bgmConfig.silenceThreshold ?? 0.0008;

        const safetySeconds =
            bgmConfig.trimSafetySeconds ?? 0.002;

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
                const channelData =
                    buffer.getChannelData(channel);

                if (
                    Math.abs(channelData[sampleIndex]) >
                    threshold
                ) {
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

        const safetySamples = Math.floor(
            sampleRate * safetySeconds
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
            const sourceData =
                buffer.getChannelData(channel);

            const targetData =
                trimmedBuffer.getChannelData(channel);

            targetData.set(
                sourceData.subarray(
                    startSample,
                    endSample + 1
                )
            );
        }

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
            bgmSource.loop = bgmConfig.loop !== false;

            bgmSource.loopStart =
                bgmConfig.loopStart ?? 0;

            bgmSource.loopEnd =
                bgmConfig.loopEnd ??
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

    function setBgmVolume(targetVolume) {
        if (!bgmGain || !audioContext) return;

        const now = audioContext.currentTime;

        bgmGain.gain.cancelScheduledValues(now);

        bgmGain.gain.setValueAtTime(
            bgmGain.gain.value,
            now
        );

        bgmGain.gain.linearRampToValueAtTime(
            targetVolume,
            now + 0.08
        );
    }

    function restoreBgm() {
        setBgmVolume(volume.bgm);
    }

    function duckBgm(targetVolume) {
        setBgmVolume(targetVolume);
    }

    function playHit() {
        const sound = hit.cloneNode();

        sound.volume = volume.hit;
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
                ? volume.duckBigWin
                : volume.duckNormalWin
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
