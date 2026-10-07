window.RainTheme = {
    currentTheme: "coin",

    themes: {
        coin: {
            audio: {
                path: "asset/audio/halloween/",

                files: {
                    bgm: "bgm-trim.ogg",
                    hit: "hit.mp3",
                    win: "win.mp3",
                    bigWin: "bigwin.mp3"
                },

                volume: {
                    bgm: 0.35,
                    hit: 0.55,
                    win: 0.4,
                    bigWin: 0.4,

                    duckNormalWin: 0.12,
                    duckBigWin: 0.06
                },

                bgm: {
                    loop: true,

                    loopStart: 0,
                    loopEnd: null,

                    trimSilence: true,
                    silenceThreshold: 0.0008,
                    trimSafetySeconds: 0.002
                }
            },

            result: {
                normal: {
                    badge: "WIN",
                    title: "Nice Catch!",
                    desc: "You collected",
                    rewardType: "Angpao Bonus"
                },

                big: {
                    badge: "BIG WIN",
                    title: "Jackpot Hit!",
                    desc: "You found a lucky reward",
                    rewardType: "Lucky Angpao Bonus"
                }
            },

            bigWinRate: 0.8,
            bigWinMinAmount: 28.88,
            bigWinMultiplier: 4
        }
    },

    get() {
        return this.themes[this.currentTheme];
    }
};

// This theme bridges the unchanged base script to the available audio.js API.
// audio.js loads after this file; both files have finished loading by DOMContentLoaded.
document.addEventListener("DOMContentLoaded", function () {
    // The shared script assigns angpao countdown paths after Start.
    // Override only 3, 2, 1 for this theme; leave GO to the shared script.
    const countdownImage = document.getElementById("rainCountdownImage");
    if (countdownImage) {
        const setCoinCountdownImage = () => {
            const file = countdownImage.getAttribute("src")?.split("/").pop()?.split("?")[0];
            if (!/^(3|2|1)\.png$/.test(file || "")) return;
            const desired = `asset/image/halloween/${file}`;
            if (countdownImage.getAttribute("src") !== desired) countdownImage.setAttribute("src", desired);
        };
        new MutationObserver(setCoinCountdownImage).observe(countdownImage, {
            attributes: true,
            attributeFilter: ["src"]
        });
        setCoinCountdownImage();
    }

    const audio = window.RainAudio;
    if (!audio) {
        console.error("Lucky Coin audio did not initialize. Check asset/js/audio.js in Network/Console.");
        return;
    }
    if (typeof audio.fadeInBgm !== "function") {
        audio.fadeInBgm = function () { return audio.startBgm(); };
    }
    if (typeof audio.stopCountdown !== "function") audio.stopCountdown = function () {};
    if (typeof audio.playCountdown !== "function") audio.playCountdown = function () {};
});


// The base script preloads the three angpao feedback files before they enter
// the DOM. Rewrite only those three `new Image()` URLs for the Coin theme.
(() => {
    const NativeImage = window.Image;
    const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
    const feedbackPreloads = {
        "asset/image/angpao/bravo.png": "hit1.png",
        "asset/image/angpao/perfect.png": "hit2.png",
        "asset/image/angpao/nice.png": "hit3.png"
    };

    function CoinImage(...args) {
        const image = new NativeImage(...args);
        Object.defineProperty(image, "src", {
            configurable: true,
            get() { return nativeSrc.get.call(image); },
            set(value) {
                const replacement = feedbackPreloads[value];
                if (replacement) {
                    const language = window.RainI18n?.language === "zh" ? "cn" : "en";
                    value = `asset/image/coin/${language}/${replacement}`;
                }
                nativeSrc.set.call(image, value);
            }
        });
        return image;
    }

    CoinImage.prototype = NativeImage.prototype;
    window.Image = CoinImage;
})();

