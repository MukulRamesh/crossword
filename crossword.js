// Crossword Puzzle Generator.
// Function that takes a list of strings and generates a crossword puzzle

class CrosswordGenerator {
    constructor() {
        this.grid = [];
        this.words = [];
        this.placedWords = [];
        this.maxSize = 20;
        this.minWordLength = 3;
    }

    // Main function to generate crossword from list of strings
    generateCrossword(wordList, maxSize = 20, minWordLength = 3) {
        this.maxSize = maxSize;
        this.minWordLength = minWordLength;

        // Clean and filter words
        this.words = this.cleanWords(wordList);

        if (this.words.length === 0) {
            throw new Error("No valid words provided");
        }

        // Sort words by length (longest first for better placement)
        this.words.sort((a, b) => b.length - a.length);

        // Initialize empty grid
        this.initializeGrid();

        // Place first word in center
        this.placeFirstWord();

        // Place remaining words
        this.placeRemainingWords();

        // Assign proper word numbers (words starting at same position get same number)
        this.assignWordNumbers();

        // Trim grid to actual size
        this.trimGrid();

        return {
            grid: this.grid,
            placedWords: this.placedWords,
            stats: this.getStats()
        };
    }

    // Clean and validate words
    cleanWords(wordList) {
        return wordList
            .map(word => word.trim().toUpperCase())
            .filter(word => {
                // Only allow letters and spaces
                return /^[A-Z\s]+$/.test(word) &&
                       word.length >= this.minWordLength &&
                       word.length <= this.maxSize;
            });
    }

    // Initialize empty grid
    initializeGrid() {
        const size = this.maxSize * 2; // Start with double size to allow centering
        this.grid = Array(size).fill(null).map(() => Array(size).fill(''));
        this.placedWords = [];
    }

    // Place the first word in the center
    placeFirstWord() {
        if (this.words.length === 0) return;

        const firstWord = this.words[0];
        const center = Math.floor(this.grid.length / 2);
        const startCol = center - Math.floor(firstWord.length / 2);

        // Place horizontally in center
        for (let i = 0; i < firstWord.length; i++) {
            this.grid[center][startCol + i] = firstWord[i];
        }

        this.placedWords.push({
            word: firstWord,
            row: center,
            col: startCol,
            direction: 'horizontal',
            number: 0
        });

        // Remove from unplaced words
        this.words.splice(0, 1);
    }

    // Place remaining words
    placeRemainingWords() {
        const maxAttempts = 1000;
        let attempts = 0;

        while (this.words.length > 0 && attempts < maxAttempts) {
            const word = this.words[0];
            let placed = false;

            // Try to place the word
            for (const placedWord of this.placedWords) {
                if (this.tryPlaceWord(word, placedWord)) {
                    placed = true;
                    break;
                }
            }

            if (placed) {
                this.words.splice(0, 1);
            } else {
                // Move word to end of list and try others
                this.words.push(this.words.shift());
            }

            attempts++;
        }
    }

    // Try to place a word intersecting with an existing word
    tryPlaceWord(word, existingWord) {
        const directions = ['horizontal', 'vertical'];

        for (const direction of directions) {
            const oppositeDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';

            if (existingWord.direction === direction) {
                // Try to place perpendicular to existing word
                if (this.canPlacePerpendicular(word, existingWord, oppositeDirection)) {
                    this.placeWordPerpendicular(word, existingWord, oppositeDirection);
                    return true;
                }
            }
        }

        return false;
    }

    // Check if word can be placed perpendicular to existing word
    canPlacePerpendicular(word, existingWord, direction) {
        const existingWordStr = existingWord.word;

        for (let i = 0; i < existingWordStr.length; i++) {
            for (let j = 0; j < word.length; j++) {
                if (existingWordStr[i] === word[j]) {
                    // Found intersection point
                    const intersectionRow = direction === 'horizontal' ?
                        existingWord.row + i : existingWord.row;
                    const intersectionCol = direction === 'horizontal' ?
                        existingWord.col : existingWord.col + i;

                    const wordStartRow = direction === 'horizontal' ?
                        intersectionRow : intersectionRow - j;
                    const wordStartCol = direction === 'horizontal' ?
                        intersectionCol - j : intersectionCol;

                    if (this.canPlaceWordAt(word, wordStartRow, wordStartCol, direction)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Check if word can be placed at specific position and direction
    canPlaceWordAt(word, row, col, direction) {
        // Check bounds
        if (row < 0 || col < 0) return false;

        const endRow = direction === 'horizontal' ? row : row + word.length - 1;
        const endCol = direction === 'horizontal' ? col + word.length - 1 : col;

        if (endRow >= this.grid.length || endCol >= this.grid[0].length) return false;

        // Check if placement conflicts with existing letters
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'horizontal' ? row : row + i;
            const currentCol = direction === 'horizontal' ? col + i : col;

            const existingChar = this.grid[currentRow][currentCol];

            if (existingChar !== '' && existingChar !== word[i]) {
                return false; // Conflict
            }
        }

        // Check adjacent cells (no adjacent letters except at intersection)
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'horizontal' ? row : row + i;
            const currentCol = direction === 'horizontal' ? col + i : col;

            // Check if this is an intersection point
            const isIntersection = this.grid[currentRow][currentCol] !== '';

            if (!isIntersection) {
                // Check adjacent cells in perpendicular direction
                const adjacentRow1 = direction === 'horizontal' ? currentRow - 1 : currentRow;
                const adjacentCol1 = direction === 'horizontal' ? currentCol : currentCol - 1;
                const adjacentRow2 = direction === 'horizontal' ? currentRow + 1 : currentRow;
                const adjacentCol2 = direction === 'horizontal' ? currentCol : currentCol + 1;

                if (this.isValidCell(adjacentRow1, adjacentCol1) &&
                    this.grid[adjacentRow1][adjacentCol1] !== '') return false;
                if (this.isValidCell(adjacentRow2, adjacentCol2) &&
                    this.grid[adjacentRow2][adjacentCol2] !== '') return false;
            }
        }

        // NEW: Check that word endpoints don't touch the beginning of other words
        // Check the cell immediately before the word start
        const beforeStartRow = direction === 'horizontal' ? row : row - 1;
        const beforeStartCol = direction === 'horizontal' ? col - 1 : col;

        if (this.isValidCell(beforeStartRow, beforeStartCol) &&
            this.grid[beforeStartRow][beforeStartCol] !== '') {
            return false; // Word start would touch another word's endpoint
        }

        // Check the cell immediately after the word end
        const afterEndRow = direction === 'horizontal' ? endRow : endRow + 1;
        const afterEndCol = direction === 'horizontal' ? endCol + 1 : endCol;

        if (this.isValidCell(afterEndRow, afterEndCol) &&
            this.grid[afterEndRow][afterEndCol] !== '') {
            return false; // Word end would touch another word's start
        }

        // NEW: Check that the word doesn't create a continuous line with existing words
        // Check if placing this word would create a continuous line in the same direction
        let hasIntersection = false;
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'horizontal' ? row : row + i;
            const currentCol = direction === 'horizontal' ? col + i : col;

            if (this.grid[currentRow][currentCol] !== '') {
                hasIntersection = true;
                break;
            }
        }

        // If no intersection, check that we're not creating a continuous line
        if (!hasIntersection) {
            // Check if there are letters immediately before or after in the same direction
            const beforeRow = direction === 'horizontal' ? row : row - 1;
            const beforeCol = direction === 'horizontal' ? col - 1 : col;
            const afterRow = direction === 'horizontal' ? endRow : endRow + 1;
            const afterCol = direction === 'horizontal' ? endCol + 1 : endCol;

            if ((this.isValidCell(beforeRow, beforeCol) && this.grid[beforeRow][beforeCol] !== '') ||
                (this.isValidCell(afterRow, afterCol) && this.grid[afterRow][afterCol] !== '')) {
                return false; // Would create a continuous line
            }
        }

        return true;
    }

    // Check if cell coordinates are valid
    isValidCell(row, col) {
        return row >= 0 && row < this.grid.length &&
               col >= 0 && col < this.grid[0].length;
    }

    // Place word perpendicular to existing word
    placeWordPerpendicular(word, existingWord, direction) {
        const existingWordStr = existingWord.word;

        for (let i = 0; i < existingWordStr.length; i++) {
            for (let j = 0; j < word.length; j++) {
                if (existingWordStr[i] === word[j]) {
                    const intersectionRow = direction === 'horizontal' ?
                        existingWord.row + i : existingWord.row;
                    const intersectionCol = direction === 'horizontal' ?
                        existingWord.col : existingWord.col + i;

                    const wordStartRow = direction === 'horizontal' ?
                        intersectionRow : intersectionRow - j;
                    const wordStartCol = direction === 'horizontal' ?
                        intersectionCol - j : intersectionCol;

                    if (this.canPlaceWordAt(word, wordStartRow, wordStartCol, direction)) {
                        // Place the word
                        for (let k = 0; k < word.length; k++) {
                            const currentRow = direction === 'horizontal' ? wordStartRow : wordStartRow + k;
                            const currentCol = direction === 'horizontal' ? wordStartCol + k : wordStartCol;
                            this.grid[currentRow][currentCol] = word[k];
                        }

                        this.placedWords.push({
                            word: word,
                            row: wordStartRow,
                            col: wordStartCol,
                            direction: direction,
                            number: 0 // Will be assigned properly by assignWordNumbers()
                        });

                        return;
                    }
                }
            }
        }
    }

    // Trim grid to actual size
    trimGrid() {
        let minRow = this.grid.length, maxRow = 0;
        let minCol = this.grid[0].length, maxCol = 0;

        // Find bounds of placed letters
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[0].length; col++) {
                if (this.grid[row][col] !== '') {
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }

        // Add padding
        minRow = Math.max(0, minRow - 1);
        maxRow = Math.min(this.grid.length - 1, maxRow + 1);
        minCol = Math.max(0, minCol - 1);
        maxCol = Math.min(this.grid[0].length - 1, maxCol + 1);

        // Extract trimmed grid
        const trimmedGrid = [];
        for (let row = minRow; row <= maxRow; row++) {
            const newRow = [];
            for (let col = minCol; col <= maxCol; col++) {
                newRow.push(this.grid[row][col]);
            }
            trimmedGrid.push(newRow);
        }

        this.grid = trimmedGrid;

        // Update word positions
        for (const word of this.placedWords) {
            word.row -= minRow;
            word.col -= minCol;
        }
    }

    // Assign proper word numbers (words starting at same position get same number)
    assignWordNumbers() {
        // Create a map of position -> words that start there
        const positionMap = new Map();

        for (const word of this.placedWords) {
            const posKey = `${word.row},${word.col}`;
            if (!positionMap.has(posKey)) {
                positionMap.set(posKey, []);
            }
            positionMap.get(posKey).push(word);
        }

        // Assign numbers based on position order
        let nextNumber = 1;
        const usedNumbers = new Set();

        // Sort positions by row, then by column for consistent numbering
        const sortedPositions = Array.from(positionMap.keys()).sort((a, b) => {
            const [rowA, colA] = a.split(',').map(Number);
            const [rowB, colB] = b.split(',').map(Number);
            if (rowA !== rowB) return rowA - rowB;
            return colA - colB;
        });

        for (const posKey of sortedPositions) {
            const wordsAtPosition = positionMap.get(posKey);

            // All words at this position get the same number
            for (const word of wordsAtPosition) {
                word.number = nextNumber;
            }

            usedNumbers.add(nextNumber);
            nextNumber++;
        }
    }

    // Get statistics about the generated crossword
    getStats() {
        const totalCells = this.grid.length * this.grid[0].length;
        let filledCells = 0;

        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[0].length; col++) {
                if (this.grid[row][col] !== '') {
                    filledCells++;
                }
            }
        }

        return {
            totalWords: this.placedWords.length,
            gridSize: `${this.grid.length} × ${this.grid[0].length}`,
            filledCells: filledCells,
            totalCells: totalCells,
            density: Math.round((filledCells / totalCells) * 100)
        };
    }
}

// Global crossword generator instance
const crosswordGenerator = new CrosswordGenerator();

// Global variables for interactive functionality
let currentCrossword = null;
let selectedCell = null;
let currentDirection = 'horizontal';
let userAnswers = [];

// --- LocalStorage utilities for saving/restoring progress ---
function getProgressKey(seed) {
    return `crossword_progress_${seed}`;
}

function saveProgress(seed) {
    if (!currentCrossword || !seed) return;

    const progressData = {
        userAnswers: userAnswers,
        timestamp: Date.now(),
        crosswordData: {
            grid: currentCrossword.grid,
            placedWords: currentCrossword.placedWords,
            stats: currentCrossword.stats
        }
    };

    try {
        localStorage.setItem(getProgressKey(seed), JSON.stringify(progressData));
    } catch (error) {
        console.warn('Failed to save progress to localStorage:', error);
    }
}

function loadProgress(seed) {
    if (!seed) return null;

    try {
        const savedData = localStorage.getItem(getProgressKey(seed));
        if (savedData) {
            const progressData = JSON.parse(savedData);

            // Check if the saved data is for the same crossword (same grid)
            if (progressData.crosswordData &&
                JSON.stringify(progressData.crosswordData.grid) === JSON.stringify(currentCrossword.grid)) {
                return progressData;
            }
        }
    } catch (error) {
        console.warn('Failed to load progress from localStorage:', error);
    }

    return null;
}

function clearProgress(seed) {
    if (!seed) return;

    try {
        localStorage.removeItem(getProgressKey(seed));
    } catch (error) {
        console.warn('Failed to clear progress from localStorage:', error);
    }
}

// Auto-save progress periodically and on user input
function setupAutoSave(seed) {
    // Save progress every 5 seconds
    const autoSaveInterval = setInterval(() => {
        if (currentCrossword && seed) {
            saveProgress(seed);
            console.log('Progress saved');
        }
    }, 5000);

    // Save progress on page unload
    window.addEventListener('beforeunload', () => {
        if (currentCrossword && seed) {
            saveProgress(seed);
        }
    });

    // Return the interval ID so it can be cleared if needed
    return autoSaveInterval;
}

// Main function called from HTML
function generateCrossword() {
    const wordListText = document.getElementById('wordList').value;
    const maxSize = 20; // Default value
    const minWordLength = 3; // Default value

    if (!wordListText.trim()) {
        alert('Please enter some words!');
        return;
    }

    const wordList = wordListText.split('\n').filter(word => word.trim() !== '');

    try {
        const result = crosswordGenerator.generateCrossword(wordList, maxSize, minWordLength);
        displayCrossword(result);
    } catch (error) {
        alert('Error generating crossword: ' + error.message);
    }
}

// --- Seeded RNG utility ---
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Generate a random 32-bit integer seed
function generateSeed() {
    return Math.floor(Math.random() * 0xFFFFFFFF);
}

// Store the last used seed (hidden from user, but accessible for reproducibility)
let lastCrosswordSeed = null;

// Utility: get seed from URL (now supports string seeds)
function getSeedFromURL() {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    if (!seed) return null;
    // If it's a daily seed, return as string
    if (seed.startsWith('DAILY-')) return seed;
    // Otherwise, try to parse as int
    const num = parseInt(seed, 10);
    return isNaN(num) ? seed : num;
}

// Utility: set seed in URL (supports string seeds)
function setSeedInURL(seed) {
    const params = new URLSearchParams(window.location.search);
    params.set('seed', seed);
    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
}

// Show/hide shared message and generate button
function updateSharedUI(isShared) {
    const msg = document.getElementById('sharedCrosswordMsg');
    const btn = document.querySelector('button[onclick="generateRandomCrossword()"]');
    const dailyBtn = document.getElementById('dailyCrosswordBtn');
    // Determine if the current seed is a daily seed
    let seed = getSeedFromURL();
    let isDaily = typeof seed === 'string' && seed.startsWith('DAILY-');
    if (msg) {
        if (isShared) {
            if (isDaily) {
                // Extract date from seed
                const dateStr = seed.substring(6); // after 'DAILY-'
                msg.textContent = `Showing Daily Crossword for ${dateStr}`;
            } else {
                msg.textContent = 'Showing Shared Crossword';
            }
        } else {
            msg.textContent = '';
        }
    }
    if (msg && btn) {
        if (isShared) {
            msg.style.display = '';
            btn.style.display = 'none';
            if (dailyBtn) dailyBtn.style.display = 'none';
        } else {
            msg.style.display = 'none';
            btn.style.display = '';
            if (dailyBtn) dailyBtn.style.display = '';
        }
    }
}

// Main entry: on page load, check for seed in URL
window.addEventListener('DOMContentLoaded', () => {
    // Hide progress section initially
    showProgressSection(false);

    const seed = getSeedFromURL();
    if (seed) {
        // Shared crossword: use seed, show message, hide button
        updateSharedUI(true);
        generateRandomCrossword(seed);
    } else {
        // Not shared: show button, hide message
        updateSharedUI(false);
    }

    // Make the title clickable to clear the seed from the URL
    const titleLink = document.getElementById('titleLink');
    if (titleLink) {
        titleLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove seed from URL and reload page
            const params = new URLSearchParams(window.location.search);
            params.delete('seed');
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            window.location.href = newUrl;
        });
    }
});

// Utility: get a daily seed as a string 'DAILY-YYYY-MM-DD'
function getDailySeed() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `DAILY-${yyyy}-${mm}-${dd}`;
}

// Convert a string seed (including 'DAILY-YYYY-MM-DD') to a numeric seed for RNG
function stringToSeed(str) {
    // Simple hash function for string to int
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash) % 4294967296; // 32-bit unsigned
}

function generateDailyCrossword() {
    const dailySeed = getDailySeed();
    setSeedInURL(dailySeed);
    updateSharedUI(true);
    generateRandomCrossword(dailySeed);
}

// Modified generateRandomCrossword to accept string or numeric seed
async function generateRandomCrossword(seed) {
    const maxSize = 20; // Default value
    const minWordLength = 3; // Default value

    // Use provided seed or generate a new one
    let displaySeed = seed;
    let rngSeed;
    if (typeof seed === 'undefined' || seed === null) {
        rngSeed = generateSeed();
        displaySeed = rngSeed;
        setSeedInURL(displaySeed);
        updateSharedUI(false);
    } else if (typeof seed === 'string' && seed.startsWith('DAILY-')) {
        rngSeed = stringToSeed(seed);
        setSeedInURL(seed);
        updateSharedUI(true);
    } else if (typeof seed === 'string') {
        rngSeed = stringToSeed(seed);
        setSeedInURL(seed);
        updateSharedUI(true);
    } else {
        rngSeed = seed;
        setSeedInURL(seed);
        updateSharedUI(true);
    }
    lastCrosswordSeed = displaySeed;
    const rng = mulberry32(rngSeed);

    // Show loading indicator
    const loadingElement = document.getElementById('loading');
    const containerElement = document.getElementById('crosswordContainer');
    loadingElement.style.display = 'block';
    containerElement.style.display = 'none';

    try {
        // Get 20 random words and clues from the file, using the seeded RNG
        const wordCluePairs = await getRandomWordsFromFile(20, rng);

        // Extract just the words for the crossword generator
        const wordList = wordCluePairs.map(pair => pair.word);

        // Store the clues globally for use in generateClue
        window.wordClues = {};
        wordCluePairs.forEach(pair => {
            window.wordClues[pair.word] = pair.clue;
        });

        // Generate the crossword
        const result = crosswordGenerator.generateCrossword(wordList, maxSize, minWordLength);

        // Hide loading and display crossword
        loadingElement.style.display = 'none';

        // Initialize currentCrossword first, then load saved progress
        currentCrossword = result;
        const savedProgress = loadProgress(displaySeed);
        displayCrossword(result, savedProgress);

        // Set up auto-save for this seed
        setupAutoSave(displaySeed);

    } catch (error) {
        loadingElement.style.display = 'none';
        alert('Error generating crossword: ' + error.message);
    }
}

// Display the crossword puzzle
function displayCrossword(result, savedProgress = null) {
    const container = document.getElementById('crosswordContainer');
    const gridElement = document.getElementById('crosswordGrid');
    const cluesElement = document.getElementById('cluesSection');

    // Store current crossword data globally
    // currentCrossword is already set in generateRandomCrossword
    selectedCell = null;
    currentDirection = 'horizontal';

    // Initialize user answers array
    userAnswers = [];
    for (let row = 0; row < result.grid.length; row++) {
        userAnswers[row] = [];
        for (let col = 0; col < result.grid[row].length; col++) {
            userAnswers[row][col] = '';
        }
    }

    // Restore saved progress if available
    if (savedProgress && savedProgress.userAnswers) {
        // Restore user answers
        for (let row = 0; row < Math.min(savedProgress.userAnswers.length, result.grid.length); row++) {
            for (let col = 0; col < Math.min(savedProgress.userAnswers[row].length, result.grid[row].length); col++) {
                if (savedProgress.userAnswers[row][col]) {
                    userAnswers[row][col] = savedProgress.userAnswers[row][col];
                }
            }
        }

        // Show notification that progress was restored
        showProgressRestoredNotification();
    }

    // Show container
    container.style.display = 'block';

    // Hide progress section for new crossword
    showProgressSection(false);

    // Log stats to console
    const stats = result.stats;
    console.log('Crossword Stats:', {
        totalWords: stats.totalWords,
        gridSize: stats.gridSize,
        density: `${stats.density}% (${stats.filledCells}/${stats.totalCells} cells)`
    });

    // Generate grid HTML
    let gridHTML = '';
    for (let row = 0; row < result.grid.length; row++) {
        gridHTML += '<div class="crossword-row">';
        for (let col = 0; col < result.grid[row].length; col++) {
            const cell = result.grid[row][col];
            const cellClass = cell === '' ? 'black' : 'editable';
            const cellNumber = getCellNumber(result.placedWords, row, col);
            const savedLetter = userAnswers[row][col] || '';

            gridHTML += `<div class="crossword-cell ${cellClass}" data-row="${row}" data-col="${col}">`;
            if (cellNumber) {
                gridHTML += `<span class="number">${cellNumber}</span>`;
            }
            gridHTML += `<span class="letter">${savedLetter}</span>`;
            gridHTML += '</div>';
        }
        gridHTML += '</div>';
    }
    gridElement.innerHTML = gridHTML;

    // Add click handlers to cells
    const cells = gridElement.querySelectorAll('.crossword-cell.editable');
    cells.forEach(cell => {
        cell.addEventListener('click', () => selectCell(cell, true));
    });

    // Generate clues
    const acrossClues = [];
    const downClues = [];

    for (const word of result.placedWords) {
        const clue = {
            number: word.number,
            word: word.word,
            clue: generateClue(word.word),
            direction: word.direction,
            row: word.row,
            col: word.col
        };

        if (word.direction === 'horizontal') {
            acrossClues.push(clue);
        } else {
            downClues.push(clue);
        }
    }

    // Sort clues by number
    acrossClues.sort((a, b) => a.number - b.number);
    downClues.sort((a, b) => a.number - b.number);

    // Display clues
    let cluesHTML = `
        <div class="clues-column">
            <h3>Across</h3>
            ${acrossClues.map(clue => `
                <div class="clue-item" data-number="${clue.number}" data-direction="horizontal">
                    <div class="clue-content">
                        <span class="clue-number">${clue.number}.</span>
                        ${clue.clue}
                    </div>
                    <button class="show-solution-btn" onclick="showSolution(${clue.number}, 'horizontal')">Show Solution</button>
                </div>
            `).join('')}
        </div>
        <div class="clues-column">
            <h3>Down</h3>
            ${downClues.map(clue => `
                <div class="clue-item" data-number="${clue.number}" data-direction="vertical">
                    <div class="clue-content">
                        <span class="clue-number">${clue.number}.</span>
                        ${clue.clue}
                    </div>
                    <button class="show-solution-btn" onclick="showSolution(${clue.number}, 'vertical')">Show Solution</button>
                </div>
            `).join('')}
        </div>
    `;
    cluesElement.innerHTML = cluesHTML;

    // Add click handlers to clues
    const clueItems = cluesElement.querySelectorAll('.clue-item');
    clueItems.forEach(clueItem => {
        clueItem.addEventListener('click', (e) => {
            // Don't trigger clue selection if clicking the button
            if (!e.target.classList.contains('show-solution-btn')) {
                selectClue(clueItem);
            }
        });
    });

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);

    // Restore solution highlighting if saved progress exists
    if (savedProgress) {
        restoreSolutionHighlighting();
    }
}

// Select a cell in the grid
function selectCell(cell, inferDirection = false) {
    // Remove previous selection
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }

    // Select new cell
    selectedCell = cell;
    cell.classList.add('selected');

    // Only infer direction if requested (e.g., on user click)
    if (inferDirection) {
        inferDirectionForCell(cell);
    }

    // Highlight the word containing this cell
    highlightWord(cell);
}

// Automatically infer the correct direction for a cell
function inferDirectionForCell(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Find all words that contain this cell
    const containingWords = currentCrossword.placedWords.filter(word => {
        const wordLength = word.word.length;
        for (let i = 0; i < wordLength; i++) {
            const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
            const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;
            if (wordRow === row && wordCol === col) {
                return true;
            }
        }
        return false;
    });

    if (containingWords.length === 0) {
        return; // No words contain this cell
    }

    // If this cell is the start of a word (has a number), prefer that word's direction
    const cellNumber = getCellNumber(currentCrossword.placedWords, row, col);
    if (cellNumber) {
        const startingWord = containingWords.find(word => word.number === cellNumber);
        if (startingWord) {
            currentDirection = startingWord.direction;
            return;
        }
    }

    // If multiple words contain this cell, prefer the current direction if it's valid
    const currentDirectionWord = containingWords.find(word => word.direction === currentDirection);
    if (currentDirectionWord) {
        return; // Keep current direction
    }

    // Otherwise, prefer horizontal over vertical (common crossword convention)
    const horizontalWord = containingWords.find(word => word.direction === 'horizontal');
    if (horizontalWord) {
        currentDirection = 'horizontal';
    } else {
        currentDirection = 'vertical';
    }
}

// Select a clue
function selectClue(clueItem) {
    // Remove previous clue selection
    const allClues = document.querySelectorAll('.clue-item');
    allClues.forEach(clue => clue.classList.remove('selected'));

    // Select new clue
    clueItem.classList.add('selected');

    const number = parseInt(clueItem.dataset.number);
    const direction = clueItem.dataset.direction;

    // Find the word in the crossword
    const word = currentCrossword.placedWords.find(w => w.number === number && w.direction === direction);

    if (word) {
        // Select the first cell of the word
        const firstCell = document.querySelector(`[data-row="${word.row}"][data-col="${word.col}"]`);
        if (firstCell) {
            selectCell(firstCell, true);
            currentDirection = direction;
            highlightWord(firstCell);
        }
    }
}

// Highlight the word containing the selected cell
function highlightWord(cell) {
    // Remove previous highlighting
    const allCells = document.querySelectorAll('.crossword-cell');
    allCells.forEach(c => {
        c.classList.remove('highlighted');
        c.classList.remove('current-word');
    });

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Find all words that contain this cell
    const containingWords = currentCrossword.placedWords.filter(word => {
        const wordLength = word.word.length;
        for (let i = 0; i < wordLength; i++) {
            const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
            const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;
            if (wordRow === row && wordCol === col) {
                return true;
            }
        }
        return false;
    });

    // Highlight all containing words
    containingWords.forEach(word => {
        const wordLength = word.word.length;
        for (let i = 0; i < wordLength; i++) {
            const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
            const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;
            const wordCell = document.querySelector(`[data-row="${wordRow}"][data-col="${wordCol}"]`);
            if (wordCell) {
                wordCell.classList.add('highlighted');
            }
        }
    });

    // Highlight the current word in the current direction
    const currentWord = containingWords.find(word => word.direction === currentDirection);
    if (currentWord) {
        const wordLength = currentWord.word.length;
        for (let i = 0; i < wordLength; i++) {
            const wordRow = currentWord.direction === 'horizontal' ? currentWord.row : currentWord.row + i;
            const wordCol = currentWord.direction === 'horizontal' ? currentWord.col + i : currentWord.col;
            const wordCell = document.querySelector(`[data-row="${wordRow}"][data-col="${wordCol}"]`);
            if (wordCell) {
                wordCell.classList.add('current-word');
            }
        }
    }
}

// Handle keyboard input
function handleKeyPress(event) {
    if (!selectedCell) return;

    const key = event.key.toUpperCase();

    // Handle letter input
    if (/^[A-Z]$/.test(key)) {
        event.preventDefault();

        // Update the cell
        const letterSpan = selectedCell.querySelector('.letter');
        if (letterSpan) {
            letterSpan.textContent = key;
        }

        // Store user answer
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        userAnswers[row][col] = key;

        // Save progress immediately
        const seed = getSeedFromURL();
        if (seed) {
            saveProgress(seed);
        }

        // Move to next cell
        moveToNextCell();
    }
    // Handle backspace
    else if (key === 'BACKSPACE') {
        event.preventDefault();

        // Clear the cell
        const letterSpan = selectedCell.querySelector('.letter');
        if (letterSpan) {
            letterSpan.textContent = '';
        }

        // Store user answer
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        userAnswers[row][col] = '';

        // Save progress immediately
        const seed = getSeedFromURL();
        if (seed) {
            saveProgress(seed);
        }

        // Move to previous cell
        moveToPreviousCell();
    }
    // Handle arrow keys
    else if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) {
        event.preventDefault();

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        let newRow = row;
        let newCol = col;

        switch (key) {
            case 'ARROWUP':
                newRow = row - 1;
                break;
            case 'ARROWDOWN':
                newRow = row + 1;
                break;
            case 'ARROWLEFT':
                newCol = col - 1;
                break;
            case 'ARROWRIGHT':
                newCol = col + 1;
                break;
        }

        // Find the new cell
        const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell && newCell.classList.contains('editable')) {
            selectCell(newCell);
        }
    }
    // Handle tab to switch direction
    else if (key === 'TAB') {
        event.preventDefault();
        currentDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
        highlightWord(selectedCell);
    }
}

// Move to the next cell in the current direction
function moveToNextCell() {
    if (!selectedCell) return;

    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);

    let nextRow = row;
    let nextCol = col;

    if (currentDirection === 'horizontal') {
        nextCol = col + 1;
    } else {
        nextRow = row + 1;
    }

    // Find the next cell
    const nextCell = document.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (nextCell && nextCell.classList.contains('editable')) {
        selectCell(nextCell);
    }
}

// Move to the previous cell in the current direction
function moveToPreviousCell() {
    if (!selectedCell) return;

    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);

    let prevRow = row;
    let prevCol = col;

    if (currentDirection === 'horizontal') {
        prevCol = col - 1;
    } else {
        prevRow = row - 1;
    }

    // Find the previous cell
    const prevCell = document.querySelector(`[data-row="${prevRow}"][data-col="${prevCol}"]`);
    if (prevCell && prevCell.classList.contains('editable')) {
        selectCell(prevCell);
    }
}

// Get cell number for intersection points
function getCellNumber(placedWords, row, col) {
    for (const word of placedWords) {
        // Only return the number for the first cell of each word
        if (word.row === row && word.col === col) {
            return word.number;
        }
    }
    return null;
}

// Generate a simple clue for a word
function generateClue(word) {
    // Use the actual clue from the file if available

    if (window.wordClues && window.wordClues[word.toLowerCase()])
    {
        return window.wordClues[word.toLowerCase()];
    }

    return `Error in getting clue for "${word.toLowerCase()}"`;
}

// Check if user's answers are correct
function checkAnswers() {
    if (!currentCrossword) return;

    let correctCount = 0;
    let totalCells = 0;

    // Clear any previous highlighting
    const allCells = document.querySelectorAll('.crossword-cell');
    allCells.forEach(cell => {
        cell.classList.remove('correct-answer');
    });

    for (let row = 0; row < currentCrossword.grid.length; row++) {
        for (let col = 0; col < currentCrossword.grid[row].length; col++) {
            const originalLetter = currentCrossword.grid[row][col];
            const userLetter = userAnswers[row][col];

            if (originalLetter !== '') {
                totalCells++;
                if (userLetter === originalLetter) {
                    correctCount++;

                    // Highlight correct answers in light green (but not if already shown as solution)
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell && !cell.classList.contains('solution')) {
                        cell.classList.add('correct-answer');
                    }
                }
            }
        }
    }

    const percentage = Math.round((correctCount / totalCells) * 100);

    // Update progress bar
    updateProgressBar(correctCount, totalCells, percentage);
}

// Function to show/hide progress section
function showProgressSection(show) {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.style.display = show ? 'block' : 'none';
    }
}

// Function to update progress bar
function updateProgressBar(correctCount, totalCells, percentage) {
    const progressSection = document.getElementById('progressSection');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const progressDetails = document.getElementById('progressDetails');

    if (progressSection && progressText && progressBar && progressDetails) {
        // Show the progress section
        progressSection.style.display = 'block';

        // Update progress text
        progressText.textContent = `Progress: ${percentage}%`;

        // Update progress bar width
        progressBar.style.width = `${percentage}%`;

        // Update progress details
        progressDetails.textContent = `${correctCount} out of ${totalCells} letters correct`;

        // Change color based on performance
        if (percentage === 100) {
            progressBar.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            progressText.textContent = '🎉 Perfect! 100% Complete!';
        } else if (percentage >= 80) {
            progressBar.style.background = 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
        } else if (percentage >= 60) {
            progressBar.style.background = 'linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)';
        } else {
            progressBar.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        }
    }
}

// Clear the crossword display
function clearCrossword() {
    // Clear saved progress for current seed
    const seed = getSeedFromURL();
    if (seed) {
        clearProgress(seed);
    }

    // Remove seed from URL and reload page (same as clicking the title)
    const params = new URLSearchParams(window.location.search);
    params.delete('seed');
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = newUrl;
}

// Function to get n random words from the text file
async function getRandomWordsFromFile(n, rng) {
    try {
        // Fetch the text file
        const response = await fetch('XwhenYwalksin.txt');
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        // Validate input
        if (n <= 0) {
            throw new Error('n must be a positive integer');
        }

        if (n > lines.length) {
            throw new Error(`Requested ${n} words but file only contains ${lines.length} lines`);
        }

        // Select n random lines using the seeded RNG
        const selectedLines = [];
        const lineIndices = Array.from({length: lines.length}, (_, i) => i);

        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor((rng ? rng() : Math.random()) * lineIndices.length);
            const lineIndex = lineIndices.splice(randomIndex, 1)[0];
            selectedLines.push(lines[lineIndex].trim());
        }

        // Extract words and clues
        const wordCluePairs = selectedLines.map(line => {
            const match = line.match(/^\((.*?)\) -> .*? -> (.*?)$/);
            if (match) {
                return {
                    word: match[1],
                    clue: match[2]
                };
            } else {
                throw new Error(`Invalid line format: ${line}`);
            }
        });

        return wordCluePairs;

    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

// Show solution for a specific word
function showSolution(number, direction) {
    if (!currentCrossword) return;

    // Find the word in the crossword
    const word = currentCrossword.placedWords.find(w => w.number === number && w.direction === direction);

    if (word) {
        const wordLength = word.word.length;

        // Fill in the word and highlight cells
        for (let i = 0; i < wordLength; i++) {
            const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
            const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;

            // Find the cell
            const cell = document.querySelector(`[data-row="${wordRow}"][data-col="${wordCol}"]`);
            if (cell) {
                // Add the letter
                const letterSpan = cell.querySelector('.letter');
                if (letterSpan) {
                    letterSpan.textContent = word.word[i];
                }

                // Add solution highlighting
                cell.classList.add('solution');

                // Update user answers
                userAnswers[wordRow][wordCol] = word.word[i];
            }
        }

        // Update the clue button to show it's been used
        const clueItem = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueItem) {
            const button = clueItem.querySelector('.show-solution-btn');
            if (button) {
                button.textContent = '✓ Shown';
                button.disabled = true;
                button.style.opacity = '0.6';
            }
        }

        // Save progress immediately
        const seed = getSeedFromURL();
        if (seed) {
            saveProgress(seed);
        }
    }
}

// Restore solution highlighting from saved progress
function restoreSolutionHighlighting() {
    if (!currentCrossword) return;

    // Check which words have been solved (all letters filled correctly)
    for (const word of currentCrossword.placedWords) {
        let isComplete = true;
        const wordLength = word.word.length;

        // Check if all letters in this word are filled correctly
        for (let i = 0; i < wordLength; i++) {
            const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
            const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;

            const userLetter = userAnswers[wordRow][wordCol];
            const correctLetter = word.word[i];

            if (userLetter !== correctLetter) {
                isComplete = false;
                break;
            }
        }

        // If word is complete, add solution highlighting
        if (isComplete) {
            for (let i = 0; i < wordLength; i++) {
                const wordRow = word.direction === 'horizontal' ? word.row : word.row + i;
                const wordCol = word.direction === 'horizontal' ? word.col + i : word.col;

                const cell = document.querySelector(`[data-row="${wordRow}"][data-col="${wordCol}"]`);
                if (cell) {
                    cell.classList.add('solution');
                }
            }

            // Update the clue button to show it's been used
            const clueItem = document.querySelector(`[data-number="${word.number}"][data-direction="${word.direction}"]`);
            if (clueItem) {
                const button = clueItem.querySelector('.show-solution-btn');
                if (button) {
                    button.textContent = '✓ Shown';
                    button.disabled = true;
                    button.style.opacity = '0.6';
                }
            }
        }
    }
}

// Show notification that progress was restored
function showProgressRestoredNotification() {
    const notification = document.createElement('div');
    notification.className = 'progress-restored-notification';
    notification.textContent = 'Previous progress restored!';

    document.body.appendChild(notification);

    setTimeout(() => {
        // Add sliding-out class to trigger the slide animation
        notification.classList.add('sliding-out');

        // Remove the element after the animation completes
        setTimeout(() => {
            notification.remove();
        }, 300); // Match the transition duration
    }, 3000);
}

window.generateRandomCrossword = generateRandomCrossword;
window.generateRandomCrossword = generateRandomCrossword;