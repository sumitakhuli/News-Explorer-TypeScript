"use strict";
let newsData = [];
async function fetchNewsData() {
    try {
        const response = await fetch('news.json');
        if (!response.ok)
            throw new Error('Failed to fetch news data');
        newsData = await response.json();
        renderNews();
    }
    catch (error) {
        console.error('Error loading news:', error);
        newsGrid.innerHTML = '<div class="no-results">Error loading news articles. Please try again later.</div>';
    }
}
// App State
let selectedCategories = new Set(['All']);
let searchQuery = '';
let visibleCountAtBeginning = 7;
let currentVisibleCount = visibleCountAtBeginning;
let debounceTimeout;
// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const showMoreBtn = document.getElementById('showMoreBtn');
const searchInput = document.getElementById('searchInput');
const categoryTags = document.getElementById('categoryTags');
// Helper: Format Date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
// Function to highlight search text
function highlightSearch(text, query) {
    if (!query)
        return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}
// Function to Render News
function renderNews() {
    // 1. Filter and Sort
    let filteredNews = newsData
        .filter(news => {
        // Category filter
        const matchesCategory = selectedCategories.has('All') || selectedCategories.has(news.category);
        // Search filter
        const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            news.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalFiltered = filteredNews.length;
    // 2. Slice for visible count
    const displayedNews = filteredNews.slice(0, currentVisibleCount);
    // 3. Update Grid
    newsGrid.innerHTML = '';
    if (displayedNews.length === 0) {
        newsGrid.innerHTML = '<div class="no-results">No news articles found matching your criteria.</div>';
    }
    else {
        displayedNews.forEach(news => {
            const card = document.createElement('div');
            card.className = 'news-card';
            const highlightedTitle = highlightSearch(news.title, searchQuery);
            const highlightedContent = highlightSearch(news.content, searchQuery);
            card.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1585829365234-750516440232?auto=format&fit=crop&q=80&w=800'">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${news.category}</span>
                        <span class="card-date">${formatDate(news.date)}</span>
                    </div>
                    <h3 class="card-title">${highlightedTitle}</h3>
                    <p class="card-excerpt">${highlightedContent}</p>
                </div>
            `;
            newsGrid.appendChild(card);
        });
    }
    // 4. Update Show More Button
    if (currentVisibleCount >= totalFiltered) {
        showMoreBtn.style.display = 'none';
    }
    else {
        showMoreBtn.style.display = 'block';
    }
}
// Event Listeners
showMoreBtn.addEventListener('click', () => {
    currentVisibleCount = newsData.length; // Show all on click
    renderNews();
});
// Debounced Search
searchInput.addEventListener('input', (e) => {
    const target = e.target;
    window.clearTimeout(debounceTimeout);
    debounceTimeout = window.setTimeout(() => {
        searchQuery = target.value;
        currentVisibleCount = visibleCountAtBeginning; // Reset view on search
        renderNews();
    }, 300);
});
// Category Tag Click Logic
categoryTags.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('tag'))
        return;
    const category = target.getAttribute('data-category');
    if (!category)
        return;
    if (category === 'All') {
        selectedCategories.clear();
        selectedCategories.add('All');
    }
    else {
        // If All was selected, remove it
        if (selectedCategories.has('All')) {
            selectedCategories.delete('All');
        }
        // Toggle the clicked category
        if (selectedCategories.has(category)) {
            selectedCategories.delete(category);
            // If nothing is selected, default back to All
            if (selectedCategories.size === 0) {
                selectedCategories.add('All');
            }
        }
        else {
            selectedCategories.add(category);
        }
    }
    // Update UI Tags
    updateTagUI();
    // Reset and Render
    currentVisibleCount = visibleCountAtBeginning;
    renderNews();
});
function updateTagUI() {
    const buttons = categoryTags.querySelectorAll('.tag');
    buttons.forEach(btn => {
        const cat = btn.getAttribute('data-category');
        if (cat && selectedCategories.has(cat)) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
}
// Initial Call
document.addEventListener('DOMContentLoaded', () => {
    fetchNewsData();
});
