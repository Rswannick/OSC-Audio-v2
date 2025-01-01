// Function to fetch categories from the Gumroad store page
function fetchCategories(storeUrl) {
    console.log(`Fetching categories from: ${storeUrl}`);
    return fetch(storeUrl, { method: "GET", redirect: "follow" })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to fetch store page');
            }
            return response.text();
        })
        .then(function(html) {
            console.log('Store page fetched successfully');
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, "text/html");
            var categoryElements = Array.from(doc.querySelectorAll("h2"));
            console.log(`Found ${categoryElements.length} category elements`);

            var categories = categoryElements.map(function(h2) {
                return h2.textContent.trim();
            });

            console.log(`Categories fetched: ${categories}`);
            return categories;
        })
        .catch(function(error) {
            console.error('Error fetching categories:', error);
            return [];
        });
}

// Function to fetch product data for each product card
function fetchProductData(productUrl) {
    console.log(`Fetching product data for: ${productUrl}`);
    return fetch(productUrl, { method: "GET", redirect: "follow" })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to fetch product page');
            }
            return response.text();
        })
        .then(function(html) {
            console.log('Product page fetched successfully');
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, "text/html");

            var productName = productUrl.split('/l/')[1]?.split('?')[0] || "Unnamed Product";
            var productPrice = doc.querySelector(".price")?.textContent || "N/A";
            var productImage = doc.querySelector("article.product-card img")?.src || "";
            var productLink = doc.querySelector("article.product-card a")?.href || "";

            if (productName === "Unnamed Product") {
                productName = doc.querySelector("h3")?.textContent.trim() || "Unnamed Product";
            }

            console.log(`Product fetched: ${productName} - Price: ${productPrice}`);
            return {
                name: productName,
                price: productPrice,
                image: productImage,
                link: productLink,
                id: extractProductID(productLink) // New ProductID extraction
            };
        })
        .catch(function(error) {
            console.error('Error fetching product data:', error);
            return null;
        });
}

// Function to extract ProductID from the product URL
function extractProductID(productUrl) {
    // Assuming ProductID can be extracted from the URL as a part of the product's link
    var productIDMatch = productUrl.match(/\/l\/([^/?]+)/);
    return productIDMatch ? productIDMatch[1] : null;
}

// Function to fetch products for a category dynamically
function fetchProductsForCategory(category) {
    console.log(`Fetching products for category: ${category}`);
    var categoryUrl = `https://oscaudio.gumroad.com/#/${category.toLowerCase()}`;

    return fetch(categoryUrl)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to fetch category page');
            }
            return response.text();
        })
        .then(function(html) {
            console.log('Category page fetched successfully');
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, "text/html");

            var productCards = Array.from(doc.querySelectorAll(".product-card"));
            console.log(`Found ${productCards.length} product cards`);

            var products = productCards.map(function(card) {
                var productLink = card.querySelector("a")?.href || "";
                var productImage = card.querySelector("img")?.src || "";
                var productName = card.querySelector("h3")?.textContent.trim() || "Unnamed Product";
                var productPrice = card.querySelector(".price")?.textContent || "N/A";

                if (productName === "Unnamed Product") {
                    productName = productLink.split('/l/')[1]?.split('?')[0] || "Unnamed Product";
                }

                return {
                    name: productName,
                    price: productPrice,
                    link: productLink,
                    image: productImage,
                    id: extractProductID(productLink) // New ProductID extraction
                };
            });

            return products;
        })
        .catch(function(error) {
            console.error('Error fetching products for category:', error);
            return [];
        });
}

// Set to store unique product IDs to prevent duplicates
let displayedProductIDs = new Set();

// Function to load and display products dynamically for the selected category
function loadProducts(category) {
    var productRow = document.getElementById('productRow');
    productRow.innerHTML = "";

    console.log(`Loading products for category: ${category}`);
    fetchProductsForCategory(category).then(function(products) {
        if (products.length > 0) {
            products.forEach(function(product) {
                // Skip product if it's already displayed
                if (displayedProductIDs.has(product.id)) {
                    return; // Skip this product
                }

                // Add the product ID to the set to avoid duplicates
                displayedProductIDs.add(product.id);

                var productCard = document.createElement('article');
                productCard.classList.add('product-card');

                var imgElement = document.createElement('img');
                imgElement.src = product.image;
                imgElement.alt = product.name;
                imgElement.style.width = "50%";
                imgElement.style.height = "150px";
                imgElement.style.objectFit = "cover";

                productCard.innerHTML = 
                    `<figure>${imgElement.outerHTML}</figure>
                     <header><a href="${product.link}" class="stretched-link"><h4 itemprop="name">${product.name}</h4></a></header>
                     <footer><div class="price" itemprop="price" content="${product.price}">${product.price}</div></footer>`;

                productRow.appendChild(productCard);
            });
        } else {
            productRow.innerHTML = "<p>No products available for this category.</p>";
        }
    });
}

// Function to dynamically populate the sidebar with categories
function loadCategories() {
    var storeUrl = "https://oscaudio.gumroad.com/";
    var menu = document.querySelector(".menu ul");

    console.log('Loading categories...');
    fetchCategories(storeUrl).then(function(categories) {
        if (categories.length > 0) {
            menu.innerHTML = "";
            categories.forEach(function(category, index) {
                var listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#" title="${category}" data-category="${category}">${category}</a>`;
                menu.appendChild(listItem);

                if (index === 0) {
                    listItem.classList.add('selected');
                    loadProducts(category);
                }
            });
        } else {
            menu.innerHTML = "<li>No categories found</li>";
        }
    });

    menu.addEventListener("click", function(event) {
        if (event.target && event.target.nodeName === "A") {
            var selectedCategory = event.target.dataset.category;
            var allLinks = menu.querySelectorAll("a");

            allLinks.forEach(function(link) {
                link.parentElement.classList.remove("selected");
            });

            event.target.parentElement.classList.add("selected");

            loadProducts(selectedCategory);
        }
    });
}

// Call the loadCategories function when the page is loaded
window.onload = loadCategories;
