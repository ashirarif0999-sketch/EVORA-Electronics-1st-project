#!/usr/bin/env python3
import re
import json
import os
from bs4 import BeautifulSoup

def extract_products_from_html(file_path):
    """Extract product information from an HTML file"""
    products = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use regex to find product cards
    pattern = r'<div class="product-card[^>]*>.*?<img src="([^"]*?)"[^>]*alt="([^"]*?)">.*?<div class="product-title">([^<]*?)</div>.*?<div class="product-desc">([^<]*?)</div>.*?<div class="product-price[^>]*>\$?([^<]*?)</div>.*?data-product-id="([^"]*?)"[^>]*data-product-name="([^"]*?)"[^>]*data-product-price="([^"]*?)"[^>]*data-product-image="([^"]*?)"'
    
    # Find all product cards
    soup = BeautifulSoup(content, 'html.parser')
    product_cards = soup.find_all('div', class_='product-card')
    
    for card in product_cards:
        img_tag = card.find('img')
        title_div = card.find(class_='product-title')
        desc_div = card.find(class_='product-desc')
        price_div = card.find(class_='product-price')
        add_to_cart_btn = card.find('button', class_='add-to-cart-btn')
        
        if img_tag and title_div and desc_div and price_div and add_to_cart_btn:
            img_src = img_tag.get('src', '')
            title = title_div.get_text(strip=True)
            description = desc_div.get_text(strip=True)
            
            # Clean price
            price_text = price_div.get_text(strip=True)
            price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
            price = float(price_match.group()) if price_match else 0.0
            
            # Get data attributes from the button
            product_id = add_to_cart_btn.get('data-product-id', '')
            product_name = add_to_cart_btn.get('data-product-name', title)  # fallback to title if not found
            product_price = add_to_cart_btn.get('data-product-price', str(price))  # fallback to parsed price
            product_image = add_to_cart_btn.get('data-product-image', img_src)  # fallback to img src
            
            # Extract brand from filename
            brand = os.path.basename(file_path).split('-')[0].title()
            if brand == 'Apple':
                brand = 'Apple'
            elif brand == 'Bosch':
                brand = 'Bosch'
            elif brand == 'Electrolux':
                brand = 'Electrolux'
            elif brand == 'Haier':
                brand = 'Haier'
            elif brand == 'Lg':
                brand = 'LG'
            elif brand == 'Panasonic':
                brand = 'Panasonic'
            elif brand == 'Sony':
                brand = 'Sony'
            elif brand == 'Whirlpool':
                brand = 'Whirlpool'
            elif brand == 'Samsung':
                brand = 'Samsung'
            
            product = {
                "id": product_id,
                "name": product_name,
                "description": description,
                "image": product_image,
                "price": float(product_price),
                "brand": brand,
                "link": file_path.replace('/workspace/', './')  # Adjust path as needed
            }
            
            products.append(product)
    
    return products

def main():
    html_files = []
    
    # Find all HTML files that might contain products
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html') and ('productpage' in file or file in ['HOME.html', 'BRANDS.HTML', 'product2.html']):
                html_files.append(os.path.join(root, file))
    
    print(f"Found {len(html_files)} HTML files to process")
    
    all_products = []
    for html_file in html_files:
        print(f"Processing {html_file}")
        products = extract_products_from_html(html_file)
        print(f"  Found {len(products)} products")
        all_products.extend(products)
    
    print(f"Total products found: {len(all_products)}")
    
    # Write to JSON file
    with open('/workspace/products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products, f, indent=2, ensure_ascii=False)
    
    print("products.json created successfully!")

if __name__ == "__main__":
    main()