class JokeGenerator {
    constructor() {
        this.currentJoke = null;
        this.currentCategory = 'any';
        this.favorites = [];
        this.jokeCount = 0;
        this.apiBaseUrl = 'https://official-joke-api.appspot.com/jokes';
        this.init();
    }

    init() {
        this.loadFavorites();
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Main buttons
        document.getElementById('getJokeBtn').addEventListener('click', () => this.fetchJoke());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyJoke());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareJoke());
        document.getElementById('clearFavoritesBtn').addEventListener('click', () => this.clearFavorites());

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.category-btn').classList.add('active');
                this.currentCategory = e.target.closest('.category-btn').dataset.category;
                this.fetchJoke();
            });
        });

        // Enter key to fetch joke
        document.getElementById('jokeText').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchJoke();
        });
    }

    async fetchJoke() {
        this.showLoading(true);
        this.hideError();

        try {
            let url;
            
            if (this.currentCategory === 'any') {
                // Get random joke from any category
                const categories = ['general', 'programming', 'knock-knock'];
                const randomCat = categories[Math.floor(Math.random() * categories.length)];
                url = `${this.apiBaseUrl}/${randomCat}/random`;
            } else {
                url = `${this.apiBaseUrl}/${this.currentCategory}/random`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch joke');
            }

            const data = await response.json();
            
            // Handle both single joke and array responses
            const joke = Array.isArray(data) ? data[0] : data;
            
            this.currentJoke = {
                setup: joke.setup || '',
                punchline: joke.punchline || joke.joke || '',
                category: joke.type || this.currentCategory,
                id: joke.id
            };

            this.displayJoke();
            this.jokeCount++;
            this.updateStats();
        } catch (error) {
            console.error('Error:', error);
            this.showError('Oops! Could not load a joke. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayJoke() {
        if (!this.currentJoke) return;

        const jokeText = document.getElementById('jokeText');
        const categoryTag = document.getElementById('categoryTag');

        // Format joke text
        let fullJoke = this.currentJoke.setup;
        if (this.currentJoke.punchline) {
            fullJoke += fullJoke ? '\n\n' : '';
            fullJoke += this.currentJoke.punchline;
        }

        jokeText.textContent = fullJoke;
        categoryTag.textContent = this.formatCategory(this.currentJoke.category);
        jokeText.style.animation = 'none';
        setTimeout(() => {
            jokeText.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }

    copyJoke() {
        if (!this.currentJoke) {
            alert('No joke to copy!');
            return;
        }

        let fullJoke = this.currentJoke.setup;
        if (this.currentJoke.punchline) {
            fullJoke += fullJoke ? '\n' : '';
            fullJoke += this.currentJoke.punchline;
        }

        navigator.clipboard.writeText(fullJoke).then(() => {
            const btn = document.getElementById('copyBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        });
    }

    shareJoke() {
        if (!this.currentJoke) {
            alert('No joke to share!');
            return;
        }

        let fullJoke = this.currentJoke.setup;
        if (this.currentJoke.punchline) {
            fullJoke += fullJoke ? '\n' : '';
            fullJoke += this.currentJoke.punchline;
        }

        if (navigator.share) {
            navigator.share({
                title: 'Check out this joke!',
                text: fullJoke
            }).catch(err => console.log('Share cancelled:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(fullJoke);
            alert('Share not supported on this device. Joke copied to clipboard!');
        }
    }

    addToFavorites() {
        if (!this.currentJoke) return;

        const exists = this.favorites.some(f => f.id === this.currentJoke.id);
        if (!exists) {
            this.favorites.push(this.currentJoke);
            this.saveFavorites();
            this.renderFavorites();
            this.updateStats();
            this.showNotification('Added to favorites! ❤️');
        } else {
            this.showNotification('Already in favorites!');
        }
    }

    removeFromFavorites(id) {
        this.favorites = this.favorites.filter(f => f.id !== id);
        this.saveFavorites();
        this.renderFavorites();
        this.updateStats();
    }

    renderFavorites() {
        const list = document.getElementById('favoritesList');
        list.innerHTML = '';

        if (this.favorites.length === 0) {
            list.innerHTML = '<div class="empty-favorites">No favorites yet. Add some jokes!</div>';
            return;
        }

        this.favorites.forEach(joke => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            let fullJoke = joke.setup;
            if (joke.punchline) {
                fullJoke += fullJoke ? ' ' : '';
                fullJoke += joke.punchline;
            }

            item.innerHTML = `
                <span class="favorite-text">${this.escapeHtml(fullJoke)}</span>
                <button class="favorite-btn" onclick="jokeApp.removeFromFavorites(${joke.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            list.appendChild(item);
        });
    }

    saveFavorites() {
        localStorage.setItem('jokesFavorites', JSON.stringify(this.favorites));
    }

    loadFavorites() {
        const stored = localStorage.getItem('jokesFavorites');
        this.favorites = stored ? JSON.parse(stored) : [];
        this.renderFavorites();
    }

    clearFavorites() {
        if (this.favorites.length === 0) {
            alert('No favorites to clear!');
            return;
        }

        if (confirm('Remove all favorite jokes?')) {
            this.favorites = [];
            this.saveFavorites();
            this.renderFavorites();
            this.updateStats();
        }
    }

    updateStats() {
        document.getElementById('jokeCount').textContent = this.jokeCount;
        document.getElementById('favCount').textContent = this.favorites.length;
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 16px 24px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatCategory(category) {
        return category.replace('-', ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const jokeApp = new JokeGenerator();
