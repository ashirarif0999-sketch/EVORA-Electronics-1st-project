// Search functionality for Evora Electronics
class SearchSystem {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.searchQuery = '';
        this.currentFilters = {
            brands: [],
            minPrice: 0,
            maxPrice: 5000
        };
        this.sortBy = 'relevance';
        
        this.init();
    }
    
    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.extractQueryFromURL();
        this.populateBrandFilters();
        this.updatePriceRange();
        if (this.searchQuery) {
            this.performSearch();
        }
    }
    
    async loadProducts() {
        try {
            const response = await fetch('../products.json');
            this.products = await response.json();
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback: try loading from root if ../products.json doesn't work
            try {
                const response = await fetch('products.json');
                this.products = await response.json();
                this.filteredProducts = [...this.products];
            } catch (error2) {
                console.error('Error loading products from root:', error2);
            }
        }
    }
    
    setupEventListeners() {
        // Main search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchQuery = e.target.value.trim();
                    this.performSearch();
                }
            });
        }
        
        // Navbar search input
        const navbarSearchInput = document.getElementById('navbar-search-input');
        if (navbarSearchInput) {
            navbarSearchInput.addEventListener('input', (e) => this.handleNavbarSearchInput(e));
            navbarSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
        
        // Sort select
        const sortSelect = document.getElementById('sort-select');
        const mobileSortSelect = document.getElementById('mobile-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFiltersAndSort();
            });
        }
        if (mobileSortSelect) {
            mobileSortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFiltersAndSort();
            });
        }
        
        // Price range sliders
        const minPriceSlider = document.getElementById('min-price');
        const maxPriceSlider = document.getElementById('max-price');
        if (minPriceSlider) {
            minPriceSlider.addEventListener('input', (e) => {
                this.currentFilters.minPrice = parseInt(e.target.value);
                document.getElementById('min-price-value').textContent = `$${e.target.value}`;
                this.applyFiltersAndSort();
            });
        }
        if (maxPriceSlider) {
            maxPriceSlider.addEventListener('input', (e) => {
                this.currentFilters.maxPrice = parseInt(e.target.value);
                document.getElementById('max-price-value').textContent = `$${e.target.value}`;
                this.applyFiltersAndSort();
            });
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }
    
    handleSearchInput(e) {
        const query = e.target.value.trim();
        this.showAutocompleteSuggestions(query, 'autocomplete-suggestions');
    }
    
    handleNavbarSearchInput(e) {
        const query = e.target.value.trim();
        this.showAutocompleteSuggestions(query, 'navbar-autocomplete-suggestions');
    }
    
    showAutocompleteSuggestions(query, containerId) {
        if (!query) {
            document.getElementById(containerId).style.display = 'none';
            return;
        }
        
        const suggestionsContainer = document.getElementById(containerId);
        if (!suggestionsContainer) return;
        
        // Find products that match the query
        const matchingProducts = this.products
            .filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 8); // Limit to 8 suggestions
        
        if (matchingProducts.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        // Create suggestion elements
        suggestionsContainer.innerHTML = '';
        matchingProducts.forEach(product => {
            const suggestion = document.createElement('div');
            suggestion.className = 'autocomplete-suggestion';
            suggestion.textContent = product.name;
            suggestion.addEventListener('click', () => {
                document.getElementById(containerId.replace('-suggestions', '-input')).value = product.name;
                suggestionsContainer.style.display = 'none';
                // Perform search for the selected product
                this.searchQuery = product.name;
                if (containerId.includes('navbar')) {
                    window.location.href = `search-results.html?q=${encodeURIComponent(product.name)}`;
                } else {
                    this.performSearch();
                }
            });
            suggestionsContainer.appendChild(suggestion);
        });
        
        suggestionsContainer.style.display = 'block';
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!suggestionsContainer.contains(e.target) && 
                e.target.id !== containerId.replace('-suggestions', '-input')) {
                suggestionsContainer.style.display = 'none';
            }
        }, { once: true });
    }
    
    extractQueryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = urlParams.get('q') || '';
        const searchInput = document.getElementById('search-input');
        if (searchInput && this.searchQuery) {
            searchInput.value = this.searchQuery;
        }
    }
    
    populateBrandFilters() {
        const brandFiltersContainer = document.getElementById('brand-filters');
        if (!brandFiltersContainer) return;
        
        // Get unique brands
        const brands = [...new Set(this.products.map(product => product.brand))];
        
        brandFiltersContainer.innerHTML = '';
        brands.forEach(brand => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'form-check brand-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.id = `brand-${brand.toLowerCase()}`;
            checkbox.value = brand;
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!this.currentFilters.brands.includes(brand)) {
                        this.currentFilters.brands.push(brand);
                    }
                } else {
                    this.currentFilters.brands = this.currentFilters.brands.filter(b => b !== brand);
                }
                this.applyFiltersAndSort();
            });
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `brand-${brand.toLowerCase()}`;
            label.textContent = brand;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            
            brandFiltersContainer.appendChild(checkboxDiv);
        });
    }
    
    updatePriceRange() {
        if (this.products.length === 0) return;
        
        const prices = this.products.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        const minSlider = document.getElementById('min-price');
        const maxSlider = document.getElementById('max-price');
        const minDisplay = document.getElementById('min-price-value');
        const maxDisplay = document.getElementById('max-price-value');
        
        if (minSlider) {
            minSlider.min = Math.floor(minPrice);
            minSlider.max = Math.ceil(maxPrice);
            minSlider.value = Math.floor(minPrice);
        }
        
        if (maxSlider) {
            maxSlider.min = Math.floor(minPrice);
            maxSlider.max = Math.ceil(maxPrice);
            maxSlider.value = Math.ceil(maxPrice);
        }
        
        if (minDisplay) minDisplay.textContent = `$${Math.floor(minPrice)}`;
        if (maxDisplay) maxDisplay.textContent = `$${Math.ceil(maxPrice)}`;
        
        // Update filter values
        this.currentFilters.minPrice = Math.floor(minPrice);
        this.currentFilters.maxPrice = Math.ceil(maxPrice);
    }
    
    performSearch() {
        if (!this.searchQuery) {
            this.filteredProducts = [...this.products];
        } else {
            // Multi-keyword OR search
            const keywords = this.searchQuery.toLowerCase().split(/\s+/).filter(k => k);
            
            this.filteredProducts = this.products.filter(product => {
                return keywords.some(keyword => 
                    product.name.toLowerCase().includes(keyword) ||
                    product.description.toLowerCase().includes(keyword)
                );
            });
        }
        
        this.applyFiltersAndSort();
    }
    
    applyFiltersAndSort() {
        let results = [...this.filteredProducts];
        
        // Apply brand filters
        if (this.currentFilters.brands.length > 0) {
            results = results.filter(product => 
                this.currentFilters.brands.includes(product.brand)
            );
        }
        
        // Apply price filters
        results = results.filter(product => 
            product.price >= this.currentFilters.minPrice && 
            product.price <= this.currentFilters.maxPrice
        );
        
        // Apply sorting
        results.sort((a, b) => {
            switch (this.sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'brand-asc':
                    return a.brand.localeCompare(b.brand);
                case 'brand-desc':
                    return b.brand.localeCompare(a.brand);
                case 'relevance':
                default:
                    // For relevance, prioritize products that match more keywords
                    if (!this.searchQuery) return 0;
                    
                    const keywords = this.searchQuery.toLowerCase().split(/\s+/).filter(k => k);
                    const aMatches = keywords.filter(keyword => 
                        a.name.toLowerCase().includes(keyword) || 
                        a.description.toLowerCase().includes(keyword)
                    ).length;
                    const bMatches = keywords.filter(keyword => 
                        b.name.toLowerCase().includes(keyword) || 
                        b.description.toLowerCase().includes(keyword)
                    ).length;
                    
                    if (aMatches !== bMatches) {
                        return bMatches - aMatches; // More matches = higher priority
                    }
                    return a.name.localeCompare(b.name); // Then sort by name
            }
        });
        
        this.displayResults(results);
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById('results-container');
        const resultsInfo = document.getElementById('results-info');
        
        if (!resultsContainer || !resultsInfo) return;
        
        // Update results count
        resultsInfo.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${this.searchQuery}"`;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fa-solid fa-search"></i>
                    <h4>No products found</h4>
                    <p>Try different keywords or remove some filters</p>
                </div>
            `;
            return;
        }
        
        // Generate product cards with highlighted matches
        const keywords = this.searchQuery.toLowerCase().split(/\s+/).filter(k => k);
        
        resultsContainer.innerHTML = `
            <div class="row g-4">
                ${results.map(product => this.createProductCard(product, keywords)).join('')}
            </div>
        `;
    }
    
    createProductCard(product, keywords) {
        // Highlight matching text in name and description
        let highlightedName = product.name;
        let highlightedDesc = product.description;
        
        if (keywords.length > 0) {
            // Create a case-insensitive regex for each keyword
            keywords.forEach(keyword => {
                const regex = new RegExp(`(${keyword})`, 'gi');
                highlightedName = highlightedName.replace(regex, '<mark class="highlight">$1</mark>');
                highlightedDesc = highlightedDesc.replace(regex, '<mark class="highlight">$1</mark>');
            });
        }
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="product-card h-100">
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                    <div class="product-info">
                        <h5 class="product-title">${highlightedName}</h5>
                        <p class="product-desc">${highlightedDesc}</p>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-primary flex-grow-1 add-to-cart-btn" 
                                data-product-id="${product.id}" 
                                data-product-name="${product.name}" 
                                data-product-price="${product.price}" 
                                data-product-image="${product.image}">
                                Add to Cart
                            </button>
                            <a href="${product.link}" class="btn btn-outline-secondary">
                                <i class="fa-solid fa-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    clearFilters() {
        // Clear brand filters
        this.currentFilters.brands = [];
        const brandCheckboxes = document.querySelectorAll('#brand-filters input[type="checkbox"]');
        brandCheckboxes.forEach(checkbox => checkbox.checked = false);
        
        // Reset price filters to min/max
        if (this.products.length > 0) {
            const prices = this.products.map(p => p.price);
            const minPrice = Math.floor(Math.min(...prices));
            const maxPrice = Math.ceil(Math.max(...prices));
            
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
            
            const minSlider = document.getElementById('min-price');
            const maxSlider = document.getElementById('max-price');
            const minDisplay = document.getElementById('min-price-value');
            const maxDisplay = document.getElementById('max-price-value');
            
            if (minSlider) minSlider.value = minPrice;
            if (maxSlider) maxSlider.value = maxPrice;
            if (minDisplay) minDisplay.textContent = `$${minPrice}`;
            if (maxDisplay) maxDisplay.textContent = `$${maxPrice}`;
        }
        
        // Reset sort to default
        this.sortBy = 'relevance';
        const sortSelect = document.getElementById('sort-select');
        const mobileSortSelect = document.getElementById('mobile-sort-select');
        if (sortSelect) sortSelect.value = 'relevance';
        if (mobileSortSelect) mobileSortSelect.value = 'relevance';
        
        // Reapply filters (which will now be empty)
        this.applyFiltersAndSort();
    }
}

// Initialize search system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the cart system if it exists
    if (typeof Cart !== 'undefined') {
        // Cart is already handled by existing script
    }
    
    // Initialize search system
    new SearchSystem();
    
    // Add event listeners for Add to Cart buttons (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('add-to-cart-btn'))) {
            
            const btn = e.target.classList.contains('add-to-cart-btn') ? 
                e.target : e.target.parentElement;
                
            const productData = {
                id: btn.getAttribute('data-product-id'),
                name: btn.getAttribute('data-product-name'),
                price: parseFloat(btn.getAttribute('data-product-price')),
                image: btn.getAttribute('data-product-image')
            };
            
            // Add to cart using existing cart system
            if (window.cart && typeof window.cart.addToCart === 'function') {
                window.cart.addToCart(productData);
            } else if (typeof addToCart === 'function') {
                addToCart(productData.id, productData.name, productData.price, productData.image);
            } else {
                console.error('Cart system not available');
            }
        }
    });
});