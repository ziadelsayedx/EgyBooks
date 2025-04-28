document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('.form-container');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.querySelector('.results');
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        
        if (query) {
            searchBooks(query);
        } else {
            alert('Please enter a search term');
        }
    });
    
    function searchBooks(query) {
        const books = [
            {
                title: 'Programming for Beginners',
                author: 'Mohamed Ahmed',
                available: true,
                image: 'Style/Images/book1.jpg'
            },
            {
                title: 'Short Stories',
                author: 'Fatima Ali',
                available: false,
                image: 'Style/Images/book1.jpg'
            },
            {
                title: 'Data Structures',
                author: 'Ahmed Hassan',
                available: true,
                image: 'Style/Images/book1.jpg'
            },
            {
                title: 'Web Development',
                author: 'Sara Mohamed',
                available: true,
                image: 'Style/Images/book1.jpg'
            }
        ];
        
        const filteredBooks = books.filter(book => {
            return book.title.toLowerCase().includes(query) || 
                   book.author.toLowerCase().includes(query);
        });
        resultsContainer.innerHTML = '';
        
        if (filteredBooks.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No books found matching your search.</p>';
            return;
        }
        filteredBooks.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.className = 'book';
            
            const statusClass = book.available ? 'available' : 'unavailable';
            const statusText = book.available ? 'Available' : 'Not Available';
            
            bookElement.innerHTML = `
                <img src="${book.image}" alt="${book.title}">
                <div>
                    <h3>Book Title: ${book.title}</h3>
                    <p>Author: ${book.author}</p>
                    <p>Status: <span class="${statusClass}">${statusText}</span></p>
                    <a href="ViewBook.html"><button class="view-btn">View Book</button></a>
                </div>
            `;
            
            resultsContainer.appendChild(bookElement);
        });
    }
});