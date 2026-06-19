window.RainTheme = {
    currentTheme: "angpao",

    themes: {
        angpao: {
            audio: {
                path: "asset/audio/angpao/",

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
