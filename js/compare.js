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

    // Load product specifications with comprehensive error handling
    loadProductSpecifications();

    async function loadProductSpecifications() {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                console.log(`Attempting to load product specifications (attempt ${attempt + 1}/${maxRetries})`);

                // Try multiple potential paths for the JSON file
                const possiblePaths = [
                    './js/PRODUCT-DETAILS.JSON',
                    'js/PRODUCT-DETAILS.JSON',
                    './PRODUCT-DETAILS.JSON',
                    'PRODUCT-DETAILS.JSON'
                ];

                let response = null;
                let successfulPath = null;

                for (const path of possiblePaths) {
                    try {
                        console.log(`Trying path: ${path}`);
                        response = await fetch(path, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Cache-Control': 'no-cache'
                            },
                            // Add timeout
                            signal: AbortSignal.timeout(5000) // 5 second timeout
                        });

                        if (response.ok) {
                            successfulPath = path;
                            console.log(`Successfully loaded from: ${path}`);
                            break;
                        } else {
                            console.warn(`Path ${path} returned status: ${response.status}`);
                        }
                    } catch (pathError) {
                        console.warn(`Failed to load from ${path}:`, pathError.message);
                        continue;
                    }
                }

                if (!response || !response.ok) {
                    throw new Error(`All paths failed. Last response status: ${response?.status || 'unknown'}`);
                }

                const data = await response.json();

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

                console.log(`Successfully loaded ${validProducts.length} products with specifications from ${successfulPath}`);
                console.log('Sample product specs:', validProducts[0]?.specs);

                allProducts = validProducts;
                renderCompareTable();
                return; // Success, exit the function

            } catch (error) {
                attempt++;
                console.error(`Attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    console.log(`Retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    console.error('All retry attempts exhausted');
                }
            }
        }

        // All attempts failed - implement fallback strategy
        console.warn('Failed to load product specifications from JSON. Implementing fallback strategy...');

        // Fallback 1: Try to merge specs into existing products array
        if (typeof products !== 'undefined' && Array.isArray(products)) {
            console.log('Attempting to use products array with embedded specs fallback');

            // Create a minimal specs fallback for common products
            const specsFallback = {
                "130": { // Apple iPhone 15 Pro Max
                    "dimensions": "6.7 inches",
                    "weight": "221 g",
                    "processor": "A17 Pro chip",
                    "storage": "256GB",
                    "camera": "48MP Main, 12MP Ultra Wide, 12MP Telephoto",
                    "features": ["Face ID", "USB-C connector", "Water resistant"]
                },
                "131": { // Apple iPhone 15
                    "dimensions": "6.1 inches",
                    "weight": "171 g",
                    "processor": "A16 Bionic chip",
                    "storage": "128GB",
                    "camera": "48MP Main, 12MP Ultra Wide",
                    "features": ["Dynamic Island", "Face ID", "USB-C connector"]
                },
                "241": { // Bosch Dishwasher
                    "dimensions": "24 x 24 x 34 inches",
                    "capacity": "16 place settings",
                    "noise_level": "38 dBA",
                    "energy_efficiency": "ENERGY STAR certified",
                    "features": ["CrystalDry technology", "InfoLight", "Third rack"]
                },
                "106": { // Bosch Refrigerator
                    "dimensions": "35.6 x 69.2 x 32.3 inches",
                    "capacity": "20.5 cu. ft.",
                    "configuration": "French door with bottom freezer",
                    "energy_efficiency": "ENERGY STAR certified",
                    "features": ["Home Connect", "VitaFresh Pro drawers", "LED lighting"]
                },
                "277": { // Electrolux Washer
                    "dimensions": "27 x 39 x 32 inches",
                    "capacity": "4.5 cu. ft.",
                    "motor": "Direct drive inverter motor",
                    "energy_efficiency": "ENERGY STAR certified",
                    "features": ["LuxCare Wash System", "Perfect Steam", "15-minute fast wash"]
                },
                "215": { // Haier Washing Machine
                    "dimensions": "21.7 x 21.7 x 37.4 inches",
                    "capacity": "7 kg",
                    "spin_speed": "720 RPM",
                    "energy_efficiency": "5-star rated",
                    "features": ["Child lock", "LED display", "Delay start"]
                },
                "33": { // LG Refrigerator
                    "dimensions": "35.75 x 69.75 x 32.75 inches",
                    "capacity": "28 cu. ft.",
                    "configuration": "French door with bottom freezer",
                    "energy_efficiency": "ENERGY STAR certified",
                    "features": ["InstaView Door-in-Door", "Craft Ice maker", "SmartThinQ"]
                },
                "162": { // LG Washer
                    "dimensions": "27 x 39 x 32 inches",
                    "capacity": "5.2 cu. ft.",
                    "motor": "AI Direct Drive inverter motor",
                    "energy_efficiency": "ENERGY STAR certified",
                    "features": ["TurboWash 360", "TrueSteam", "SmartThinQ"]
                },
                "45": { // Panasonic Refrigerator
                    "dimensions": "35.4 x 70.9 x 32.3 inches",
                    "capacity": "537 liters (18.9 cu. ft.)",
                    "configuration": "4-door with multi-zone compartments",
                    "features": ["Prime Freeze", "nanoe™ X technology", "AgClean coating"]
                },
                "178": { // LG TV
                    "dimensions": "48.3 x 28.1 x 2.2 inches",
                    "display_size": "55 inches",
                    "resolution": "4K Ultra HD (3840 x 2160)",
                    "panel_type": "OLED evo",
                    "refresh_rate": "120Hz",
                    "features": ["α9 AI Processor", "Dolby Vision IQ", "Gaming features"]
                },
                "190": { // Panasonic Washing Machine
                    "dimensions": "21.7 x 21.7 x 37.4 inches",
                    "capacity": "7 kg",
                    "spin_speed": "780 RPM",
                    "energy_efficiency": "5-star rated",
                    "features": ["Active Foam Wash", "Ag+ Silver technology", "Child lock"]
                }
            };

            // Merge specs into products array
            allProducts = products.map(product => {
                const specs = specsFallback[product.id];
                if (specs) {
                    return { ...product, specs };
                }
                return product;
            });

            console.log(`Merged specs into ${allProducts.length} products`);
            renderCompareTable();
            return;
        }

        // Fallback 2: Show error message and disable compare functionality
        console.error('CRITICAL: Unable to load product specifications. Compare functionality will be limited.');

        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
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
            max-width: 400px;
        `;
        errorMessage.innerHTML = `
            <h3>⚠️ Product Data Loading Error</h3>
            <p>Unable to load product specifications. Please check your internet connection and refresh the page.</p>
            <p>If the problem persists, contact support.</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px; background: white; color: red; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        `;
        document.body.appendChild(errorMessage);

        // Set minimal fallback data
        allProducts = [];
        renderCompareTable();
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
                        <button class="remove-btn" onclick="removeFromCompare('${p.id}')">&times;</button>
                        <img src="${p.image}" alt="${p.name}">
                        <h3>${p.name}</h3>
                        <p class="brand">${p.brand}</p>
                        <p class="price">$${p.price}</p>
                        <p class="description">${p.description}</p>
                        <div class="specs">
                            ${(() => {
                                console.log('Rendering specs for product:', p.name, 'specs:', p.specs);
                                return renderSpecs(p.specs);
                            })()}
                        </div>
                        <a href="${p.link}" class="btn-primary btn-sm">View Details</a>
                    </div>
                `).join('')}
            </div>
        `;

        compareContainer.innerHTML = html;
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