
document.addEventListener('DOMContentLoaded', () => {
    console.log('Product-detail.js script loaded and DOM ready');
    const MAX_PRODUCTS = 3;
    let allProducts = [];
    let compareList = JSON.parse(localStorage.getItem('compareList')) || [];

    // DOM Elements
    const productSearch = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const compareContainer = document.getElementById('compareContainer');
    const emptyState = document.getElementById('emptyState');

    // Fetch Data
    fetch('./js/PRODUCT-DETAILS.JSON')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Products data loaded:', data);
            allProducts = data;
            renderCompareTable();
        })
        .catch(error => {
            console.error('Error loading products:', error);
            // Fallback to global products if fetch fails
            if (typeof products !== 'undefined') {
                console.log('Using fallback products array');
                allProducts = products;
                renderCompareTable();
            } else {
                console.log('No fallback products available');
            }
        });

    // Search Functionality
    productSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            searchResults.style.display = 'block';
            filtered.forEach(product => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <div class="name">${product.name}</div>
                        <div class="brand">${product.brand}</div>
                        <div class="description">${product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}</div>
                        <div class="price">$${product.price}</div>
                        ${product.specs ? `<div class="specs-preview">${product.specs.dimensions || product.specs.display_size || 'Specs available'}</div>` : ''}
                    </div>
                `;
                div.addEventListener('click', () => addToCompare(product));
                searchResults.appendChild(div);
            });
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!productSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Add to Compare
    function addToCompare(product) {
        console.log('Adding product to compare:', product);
        if (compareList.length >= MAX_PRODUCTS) {
            alert(`You can only compare up to ${MAX_PRODUCTS} products.`);
            return;
        }
        if (compareList.some(p => p.id === product.id)) {
            alert('This product is already in the comparison list.');
            return;
        }

        compareList.push(product);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        renderCompareTable();
        productSearch.value = '';
        searchResults.style.display = 'none';
        
        // Show confirmation
        const confirmation = document.createElement('div');
        confirmation.className = 'confirmation-message';
        confirmation.textContent = `${product.name} added to comparison!`;
        document.body.appendChild(confirmation);
        
        // Remove confirmation after 2 seconds
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 2000);
    }

    // Remove from Compare
    window.removeFromCompare = (id) => {
        compareList = compareList.filter(p => p.id !== id);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        renderCompareTable();
    };

    // Render Compact Details
    function renderCompareTable() {
        console.log('Rendering compare table with compareList:', compareList);
        if (compareList.length === 0) {
            compareContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        compareContainer.style.display = 'block';
        emptyState.style.display = 'none';

        let html = `
            <div class="compare-container-grid">
                ${compareList.map(p => `
                    <div class="product-compact-card">
                        <button class="remove-btn" data-product-id="${p.id}">&times;</button>
                        <img src="${p.image}" alt="${p.name}">
                        <h3>${p.name}</h3>
                        <p class="brand">${p.brand}</p>
                        <p class="price">$${p.price}</p>
                        <p class="description">${p.description}</p>
                        <div class="specs">
                            ${renderSpecs(p.specs)}
                        </div>
                        <a href="${p.link}" class="btn-primary btn-sm">View Details</a>
                    </div>
                `).join('')}
            </div>
        `;

        compareContainer.innerHTML = html;
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                removeFromCompare(productId);
            });
        });
    }

    // Render product specifications
    function renderSpecs(specs) {
        if (!specs || Object.keys(specs).length === 0) {
            return '<p><strong>Specifications:</strong> Not available for this product</p>';
        }

        let html = '';
        for (const key in specs) {
            if (key === 'features') {
                if (Array.isArray(specs.features)) {
                    html += `<p><strong>Features:</strong> ${specs.features.join(', ')}</p>`;
                } else {
                    html += `<p><strong>Features:</strong> ${specs.features}</p>`;
                }
            } else {
                html += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${specs[key]}</p>`;
            }
        }
        return html;
    }

    function formatLabel(str) {
        return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
});
