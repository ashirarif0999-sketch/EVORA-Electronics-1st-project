document.addEventListener('DOMContentLoaded', () => {
    console.log('Compare.js script loaded and DOM ready');
    const MAX_PRODUCTS = 3;
    let allProducts = [];
    let compareList = JSON.parse(localStorage.getItem('compareList')) || [];

    // DOM Elements
    const productSearch = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const compareContainer = document.getElementById('compareContainer');
    const emptyState = document.getElementById('emptyState');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Load product specifications with comprehensive error handling
    loadProductSpecifications();

    async function loadProductSpecifications() {
        try {
            console.log('Attempting to load product specifications from JSON file');
            
            // Show loading state
            showLoadingState();
            
            // Try multiple approaches to load the JSON data
            let data = null;
            
            // Approach 1: Try fetch (works with web server)
            try {
                console.log('Trying fetch method...');
                const response = await fetch('./js/PRODUCT-DETAILS.JSON', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (!response.ok) {
                    throw new Error(`Failed to load product data: ${response.status} ${response.statusText}`);
                }

                data = await response.json();
                console.log('Loaded data via fetch');
            } catch (fetchError) {
                console.warn('Fetch failed:', fetchError.message);
                
                // Approach 2: Try XMLHttpRequest (alternative for web server)
                try {
                    console.log('Trying XMLHttpRequest method...');
                    data = await loadJSONViaXHR();
                    console.log('Loaded data via XMLHttpRequest');
                } catch (xhrError) {
                    console.warn('XMLHttpRequest failed:', xhrError.message);
                    
                    // Approach 3: Try to load embedded data (for file:// protocol)
                    try {
                        console.log('Trying embedded data approach...');
                        data = await loadEmbeddedData();
                        console.log('Loaded embedded data');
                    } catch (embeddedError) {
                        console.warn('Embedded data approach failed:', embeddedError.message);
                        
                        // Approach 4: Try to load from products.js if available
                        try {
                            console.log('Trying products.js approach...');
                            if (typeof products !== 'undefined' && Array.isArray(products)) {
                                data = products;
                                console.log('Loaded data from products.js');
                            } else {
                                throw new Error('products.js not available or not an array');
                            }
                        } catch (productsError) {
                            console.warn('products.js approach failed:', productsError.message);
                            throw new Error('All loading methods failed. Please run this page through a web server.');
                        }
                    }
                }
            }

            // Validate the data structure
            if (!Array.isArray(data)) {
                throw new Error('Product data is not an array');
            }

            if (data.length === 0) {
                throw new Error('Product data array is empty');
            }

            // Validate that products have required fields and specs
            const validProducts = data.filter(product => {
                const hasRequiredFields = product.id && product.name && product.price !== undefined;
                const hasSpecs = product.specs && typeof product.specs === 'object';

                if (!hasRequiredFields) {
                    console.warn(`Product missing required fields:`, product);
                    return false;
                }

                if (!hasSpecs) {
                    console.warn(`Product missing specifications: ${product.name}`);
                    return false;
                }

                return true;
            });

            if (validProducts.length === 0) {
                throw new Error('No valid products with specifications found');
            }

            console.log(`Successfully loaded ${validProducts.length} products with specifications`);
            console.log('Sample product specs:', validProducts[0]?.specs);

            allProducts = validProducts;
            renderCompareTable();
            
        } catch (error) {
            console.error('Error loading product specifications:', error.message);
            handleErrorState(error.message);
        }
    }

    // Fallback method to load JSON via XMLHttpRequest
    function loadJSONViaXHR() {
        return new Promise((resolve, reject) => {
            console.log('Attempting to load JSON via XMLHttpRequest as fallback');
            
            const xhr = new XMLHttpRequest();
            xhr.open('GET', './js/PRODUCT-DETAILS.JSON', true);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.timeout = 10000; // 10 second timeout
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (parseError) {
                        reject(new Error('Failed to parse JSON data: ' + parseError.message));
                    }
                } else {
                    reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error occurred while loading product data'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('Request timeout while loading product data'));
            };
            
            try {
                xhr.send();
            } catch (sendError) {
                reject(new Error('Failed to send request: ' + sendError.message));
            }
        });
    }

    // Fallback method to load embedded data
    function loadEmbeddedData() {
        return new Promise((resolve, reject) => {
            console.log('Attempting to load embedded data');
            
            // Try to fetch the raw file content and parse it
            const xhr = new XMLHttpRequest();
            xhr.open('GET', './js/PRODUCT-DETAILS.JSON', true);
            xhr.timeout = 10000; // 10 second timeout
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        // For local files, we might get the raw content
                        const content = xhr.responseText;
                        
                        // Try to parse as JSON
                        const data = JSON.parse(content);
                        resolve(data);
                    } catch (parseError) {
                        // If parsing fails, it might be due to CORS restrictions
                        console.warn('Failed to parse embedded data:', parseError.message);
                        
                        // Try a different approach - create a script tag to load the data
                        reject(new Error('Cannot load data due to CORS restrictions. Please run through a web server.'));
                    }
                } else {
                    reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error occurred while loading product data. This is likely due to CORS restrictions when loading local files.'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('Request timeout while loading product data'));
            };
            
            try {
                xhr.send();
            } catch (sendError) {
                reject(new Error('Failed to send request: ' + sendError.message));
            }
        });
    }

    function showLoadingState() {
        // Could implement a loading spinner here if needed
        console.log('Loading product data...');
    }

    function handleErrorState(errorMessage) {
        // Hide loading state
        hideLoadingState();
        
        // Show user-friendly error message
        const errorMessageElement = document.createElement('div');
        errorMessageElement.className = 'error-message';
        errorMessageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        errorMessageElement.innerHTML = `
            <h3>⚠️ Product Data Loading Error</h3>
            <p>Unable to load product specifications due to browser security restrictions.</p>
            <p><strong>Solution:</strong> Please run this page through a local web server instead of opening it directly.</p>
            <p>Error: ${errorMessage}</p>
            <div style="margin-top: 15px; text-align: left; font-size: 14px;">
                <p><strong>To fix this issue:</strong></p>
                <ol>
                    <li>Open a terminal/command prompt</li>
                    <li>Navigate to your project folder: <code>cd d:/E-PROJECT</code></li>
                    <li>Run a local server:</li>
                    <ul>
                        <li><strong>Python:</strong> <code>python -m http.server 8000</code></li>
                        <li><strong>Node.js:</strong> <code>npx http-server</code></li>
                        <li><strong>PHP:</strong> <code>php -S localhost:8000</code></li>
                    </ul>
                    <li>Open your browser to: <code>http://localhost:8000/compare.html</code></li>
                </ol>
            </div>
            <button id="closeErrorMsgBtn" style="margin-top: 10px; padding: 8px 16px; background: white; color: red; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        `;
        document.body.appendChild(errorMessageElement);
        
        // Add event listener for close button
        document.getElementById('closeErrorMsgBtn').addEventListener('click', function() {
            this.parentElement.remove();
        });

        // Set minimal fallback data
        allProducts = [];
        renderCompareTable();
    }

    function hideLoadingState() {
        // Hide any loading indicators
        console.log('Loading complete');
    }

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
            p.brand.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );

        if (filtered.length > 0) {
            searchResults.style.display = 'block';
            filtered.slice(0, 10).forEach(product => { // Limit to 10 results for performance
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="search-result-details">
                        <div class="name">${product.name}</div>
                        <div class="brand">${product.brand}</div>
                        <div class="description">${product.description ? (product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description) : ''}</div>
                        <div class="price">$${product.price}</div>
                        ${product.specs ? `<div class="specs-preview">${getSpecsPreview(product.specs)}</div>` : ''}
                    </div>
                `;
                div.addEventListener('click', () => addToCompare(product));
                
                // Add error handling for image
                const img = div.querySelector('.product-image');
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                });
                
                searchResults.appendChild(div);
            });
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Get a preview of specs for search results
    function getSpecsPreview(specs) {
        if (!specs) return '';
        
        // Try to get the most relevant spec for preview
        return specs.dimensions || 
               specs.display || 
               specs.processor || 
               specs.storage || 
               specs.camera || 
               'Specs available';
    }

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!productSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Clear All Button Event Listener
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllProducts);
        console.log('Clear All button event listener added');
    } else {
        console.error('Clear All button not found');
    }

    // Add to Compare
    function addToCompare(product) {
        console.log('Adding product to compare:', product);
        if (compareList.length >= MAX_PRODUCTS) {
            showNotification(`You can only compare up to ${MAX_PRODUCTS} products.`, 'error');
            return;
        }
        if (compareList.some(p => p.id === product.id)) {
            showNotification('This product is already in the comparison list.', 'warning');
            return;
        }

        compareList.push(product);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        renderCompareTable();
        productSearch.value = '';
        searchResults.style.display = 'none';
        
        // Show confirmation
        showNotification(`${product.name} added to comparison!`, 'success');
    }

    // Remove from Compare
    window.removeFromCompare = (id) => {
        compareList = compareList.filter(p => p.id !== id);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        renderCompareTable();
        showNotification('Product removed from comparison.', 'info');
    };

    // Clear All Products
    function clearAllProducts() {
        console.log('Clear All button clicked');
        console.log('Current compareList:', compareList);

        if (compareList.length === 0) {
            showNotification('No products to clear.', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all products from comparison?')) {
            compareList = [];
            localStorage.setItem('compareList', JSON.stringify(compareList));
            renderCompareTable();
            showNotification('All products cleared from comparison.', 'success');
            console.log('Products cleared successfully');
        }
    }

    // Show notification to user
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification-message');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification-message ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
                position: fixed;
    top: 85px;
    justify-self: center;
    padding: 12px 20px;
    border-radius: 50px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 10px;
    animation: popupIn 0.4s ease;
    background: rgb(23, 162, 184);
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : type === 'success' ? '#28a745' : '#17a2b8'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('removing');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

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
                        <button class="remove-btn" data-product-id="${p.id}" aria-label="Remove product">&times;</button>
                        <img src="${p.image}" alt="${p.name}" class="product-image">
                        <h3>${p.name}</h3>
                        <p class="brand">${p.brand}</p>
                        <p class="price">$${p.price}</p>
                        <p class="description">${p.description || ''}</p>
                        <div class="specs">
                            ${renderSpecs(p.specs)}
                        </div>
                        ${p.link ? `<a href="${p.link}" class="btn-primary btn-sm">View Details</a>` : ''}
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
        
        // Add error handling for images
        document.querySelectorAll('.product-image').forEach(img => {
            img.addEventListener('error', function() {
                this.style.display = 'none';
            });
        });
    }

    // Render product specifications
    function renderSpecs(specs) {
        console.log('renderSpecs called with:', specs);
        if (!specs || Object.keys(specs).length === 0) {
            console.log('No specs available, returning default message');
            return '<p><strong>Specifications:</strong> Not available for this product</p>';
        }

        let html = '';
        for (const key in specs) {
            if (key === 'features') {
                if (Array.isArray(specs.features)) {
                    html += `<p><strong>Features:</strong> ${specs.features.join(', ')}</p>`;
                } else if (typeof specs.features === 'string') {
                    html += `<p><strong>Features:</strong> ${specs.features}</p>`;
                } else {
                    html += `<p><strong>Features:</strong> ${JSON.stringify(specs.features)}</p>`;
                }
            } else {
                const formattedKey = formatLabel(key);
                const value = specs[key];
                html += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
            }
        }
        return html;
    }

    function formatLabel(str) {
        // Convert camelCase to readable format
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
});