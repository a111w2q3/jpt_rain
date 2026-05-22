window.RainTheme = {
    currentTheme: "coin",

    themes: {
        angpao: {
            audioPath: "asset/audio/coin/",
            result: {
                normal: {
                    badge: "WIN",
                    title: "Congratulations!",
                    desc: "You collected",
                    rewardType: "Demo Bonus"
                },
                big: {
                    badge: "BIG WIN",
                    title: "Amazing!",
                    desc: "You hit a big reward",
                    rewardType: "Big Win Bonus"
                }
            },
            bigWinRate: 0.8,
            bigWinMinAmount: 18.88,
            bigWinMultiplier: 3
        },

        coin: {
            audioPath: "asset/audio/coin/",
            result: {
                normal: {
                    badge: "WIN",
                    title: "Nice Catch!",
                    desc: "You collected",
                    rewardType: "Coin Bonus"
                },
                big: {
                    badge: "BIG WIN",
                    title: "Jackpot Hit!",
                    desc: "You found a lucky reward",
                    rewardType: "Lucky Coin Bonus"
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