#!/usr/bin/env python3
import re
import os

def update_html_file(filepath):
    """Update a single HTML file to include search functionality"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if search functionality is already present
    if 'navbar-search' in content and 'search.js' in content:
        print(f"  - {os.path.basename(filepath)}: Already updated")
        return False
    
    # Update navbar to include search input
    navbar_pattern = r'(<!-- Main navigation menu -->\s*<ul class="navbar">[^<]*<li>[^<]*<a[^>]*>.*?</a>\s*</li>(?:\s*<li>.*?</li>)*?)\s*(<!-- Cart icon moved OUTSIDE the main navbar list -->)'
    
    if re.search(navbar_pattern, content, re.DOTALL):
        # Insert search bar before the cart icon
        updated_content = re.sub(
            navbar_pattern,
            r'\1\n        <!-- Search bar in navbar -->\n        <li class="navbar-search">\n          <div class="search-form">\n            <input type="text" id="navbar-search-input" class="form-control" placeholder="Search products...">\n            <div id="navbar-autocomplete-suggestions" class="autocomplete-suggestions" style="display: none;"></div>\n          </div>\n        </li>\n        \2',
            content,
            flags=re.DOTALL
        )
    else:
        # If the specific pattern isn't found, try a more general approach
        navbar_menu_pattern = r'(<ul class="navbar">.*?</ul>)'
        if re.search(navbar_menu_pattern, content, re.DOTALL):
            updated_content = re.sub(
                navbar_menu_pattern,
                r"""<ul class="navbar">
        <li>
          <a href="BRANDS.HTML">Brands</a>
        </li>
        <li><a href="product2.html">Product</a></li>
        <li><a href="compare.html">Compare</a></li>
        <li><a href="Contact.html">Contact</a></li>
        <!-- Search bar in navbar -->
        <li class="navbar-search">
          <div class="search-form">
            <input type="text" id="navbar-search-input" class="form-control" placeholder="Search products...">
            <div id="navbar-autocomplete-suggestions" class="autocomplete-suggestions" style="display: none;"></div>
          </div>
        </li>
        <!-- Cart icon moved OUTSIDE the main navbar list -->
        <div class="cart-icon-container">
          <div class="cart-link">
            <i class="fa-solid fa-cart-shopping"></i>
            <span class="cart-count">0</span>
          </div>
        </div>
      </ul>""",
                content,
                flags=re.DOTALL
            )
        else:
            print(f"  - {os.path.basename(filepath)}: Could not update navbar")
            return False
    
    # Add CSS styles for search functionality
    if '</style>' in updated_content:
        # Insert search styles before the closing style tag
        css_addition = """
    /* Search styles */
    .navbar-search {
      padding: 0 1rem;
    }
    
    .search-form {
      position: relative;
    }
    
    .autocomplete-suggestions {
      position: absolute;
      background: white;
      border: 1px solid #ced4da;
      border-top: none;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      width: 100%;
      max-width: 300px;
      top: 100%;
      left: 0;
    }
    
    .autocomplete-suggestion {
      padding: 0.5rem;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .autocomplete-suggestion:hover {
      background-color: #f8f9fa;
    }
"""
        updated_content = updated_content.replace('</style>', css_addition + '</style>')
    else:
        print(f"  - {os.path.basename(filepath)}: Could not add CSS styles")
        return False
    
    # Add search.js script after app.js
    if 'js/app.js' in updated_content:
        updated_content = updated_content.replace(
            '<script src="js/app.js" defer></script>',
            '<script src="js/app.js" defer></script>\n  <script src="js/search.js" defer></script>'
        )
    else:
        print(f"  - {os.path.basename(filepath)}: Could not add search.js script")
        return False
    
    # Write the updated content back to the file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"  - {os.path.basename(filepath)}: Updated successfully")
    return True

def main():
    html_files = []
    
    # Find all HTML files that need updating
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html') and file != 'search-results.html':  # Exclude search-results.html since it's already done
                full_path = os.path.join(root, file)
                if full_path != './extract_products.py' and full_path != './update_navbars.py':  # Exclude Python scripts
                    html_files.append(full_path)
    
    print(f"Found {len(html_files)} HTML files to update")
    
    updated_count = 0
    for html_file in html_files:
        print(f"Processing {html_file}...")
        if update_html_file(html_file):
            updated_count += 1
    
    print(f"\nUpdated {updated_count} files successfully!")

if __name__ == "__main__":
    main()