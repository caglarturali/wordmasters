const wordmasters = {
    API_BASE: 'https://words.dev-apis.com',
    isLoading: false,
    boardEl: null,
    busyEl: null,
    restartBtn: null,
    theWord: '',
    rowCount: 6,
    colCount: 5,
    board: [],
    currRow: 0,
    currCol: 0,
    isDone: false,

    getElements() {
        this.boardEl = document.querySelector('.board');
        this.busyEl = document.querySelector('.busy');
        this.restartBtn = document.querySelector('.restart');
    },

    createBoard() {
        for (let r = 0; r < this.rowCount; r++) {
            const row = [];
            for (let c = 0; c < this.colCount; c++) {
                const rect = document.createElement('div');
                rect.classList.add('rect');
                this.boardEl.appendChild(rect);
                row.push(rect);
            }
            this.board.push(row);
        }
    },

    startGame() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        this.restartBtn.addEventListener('click', this.restart.bind(this));
        this.showRestart(false);
    },

    onKeyDown(event) {
        if (this.isLoading || this.isDone) return;

        const { key, code } = event;
        if (code === 'Enter') {
            this.handleEnter();
        } else if (code === 'Backspace') {
            this.handleBackspace();
        } else if (this.isLetter(key)) {
            this.handleLetter(key);
        }
    },

    handleLetter(key) {
        if (this.currCol < this.colCount && this.currRow < this.rowCount) {
            this.board[this.currRow][this.currCol].innerText = key;
            this.currCol++;
        }
    },

    handleBackspace() {
        if (this.currCol > 0) {
            this.board[this.currRow][this.currCol - 1].innerText = '';
            this.currCol--;
            // Remove invalid class if there is
            for (let i = 0; i < this.colCount; i++) {
                this.board[this.currRow][i].classList.remove('invalid');
            }
        }
    },

    async handleEnter() {
        if (this.currCol !== this.colCount || this.currRow > this.rowCount) return;

        const theWord = this.theWord.toLowerCase();
        const theGuess = this.board[this.currRow]
            .map((n) => n.innerText)
            .join('')
            .toLowerCase();
        const wordLen = theWord.length;

        const isValid = await this.checkTheWord(theGuess);
        if (!isValid) {
            for (let i = 0; i < wordLen; i++) {
                this.board[this.currRow][i].classList.add('invalid');
            }
            return;
        }

        let letterFreqs = this.getLetterFreqs(theWord);

        // Correct letter, correct place
        for (let i = 0; i < wordLen; i++) {
            if (theWord[i] === theGuess[i]) {
                this.board[this.currRow][i].classList.add('success');
                letterFreqs[theGuess[i]]--;
            }
        }

        // Correct letter, wrong place
        for (let i = 0; i < wordLen; i++) {
            if (theWord[i] === theGuess[i]) continue; // Already marked
            if (theWord.includes(theGuess[i]) && letterFreqs[theGuess[i]] > 0) {
                this.board[this.currRow][i].classList.add('warning');
                letterFreqs[theGuess[i]]--;
            }
        }

        // End-game conditions
        if (theGuess == theWord) {
            this.isDone = true;
            return this.won();
        } else if (this.currRow == this.rowCount - 1) {
            this.isDone = true;
            return this.lost();
        }

        this.currRow++;
        this.currCol = 0;
    },

    won() {
        this.showRestart(true);
        this.walkTheBoard((row, col, currRect) => {
            if (row !== this.currRow) {
                currRect.classList = ['rect'];
                currRect.innerText = '';
            }
        });
    },

    lost() {
        this.showRestart(true);
        this.walkTheBoard((row, col, currRect) => {
            if (row === 2) {
                currRect.classList = 'rect invalid';
                currRect.innerText = this.theWord[col];
            } else {
                currRect.classList = 'rect warning';
                currRect.innerText = 'x';
            }
        });
    },

    async restart() {
        await this.fetchTheWord(true);
        this.showRestart(false);
        this.walkTheBoard((row, col, currRect) => {
            currRect.classList = 'rect';
            currRect.innerText = '';
        });
        this.currRow = 0;
        this.currCol = 0;
        this.isDone = false;
    },

    showLoading(show) {
        this.isLoading = show;
        this.busyEl.classList.toggle('hidden', !show);
    },

    showRestart(show) {
        this.restartBtn.classList.toggle('hidden', !show);
    },

    isLetter(val) {
        return /^[a-zA-Z]$/.test(val);
    },

    getLetterFreqs(word) {
        const freqs = {};
        word.split('').forEach((c) => {
            if (!freqs[c]) {
                freqs[c] = 0;
            }
            freqs[c]++;
        });
        return freqs;
    },

    walkTheBoard(processRect) {
        for (let row = 0; row < this.rowCount; row++) {
            for (let col = 0; col < this.colCount; col++) {
                const currRect = this.board[row][col];
                processRect(row, col, currRect);
            }
        }
    },

    async fetchTheWord(random = false) {
        this.showLoading(true);
        const params = random ? '?random=1' : '';
        const resp = await fetch(`${this.API_BASE}/word-of-the-day${params}`);
        const json = await resp.json();
        this.theWord = json.word.toLowerCase();
        this.showLoading(false);
    },

    async checkTheWord(word) {
        this.showLoading(true);
        const resp = await fetch(`${this.API_BASE}/validate-word`, {
            method: 'post',
            body: JSON.stringify({
                word,
            }),
        });
        const json = await resp.json();
        this.showLoading(false);
        return json.validWord;
    },

    init() {
        this.getElements();
        this.createBoard();
        this.fetchTheWord();
        this.startGame();
    },
};

wordmasters.init();
