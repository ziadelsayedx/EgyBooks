from django import forms
from django.core.exceptions import ValidationError
from .models import Book, Category, Author

class BookForm(forms.ModelForm):
    author_name = forms.CharField(max_length=200, required=True, label='Author')
    language = forms.CharField(max_length=50, required=True, label='Language')
    
    class Meta:
        model = Book
        fields = ['title', 'author_name', 'category', 'description', 'cover_image', 
                 'price', 'isbn', 'publication_date', 'pages', 'language', 'stock', 'is_available']
        widgets = {
            'publication_date': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        self.instance_id = None
        if kwargs.get('instance'):
            self.instance_id = kwargs.get('instance').id
        super().__init__(*args, **kwargs)
        # Add asterisk to required fields
        for field_name, field in self.fields.items():
            if field.required:
                field.label = f'{field.label} *'
    
    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not title:
            raise ValidationError('This field is required.')
            
        # Check for duplicate titles, excluding current instance
        existing = Book.objects.filter(title__iexact=title)
        if self.instance_id:
            existing = existing.exclude(id=self.instance_id)
            
        if existing.exists():
            raise ValidationError('This title is already used by another book')
        return title
        
    def clean_isbn(self):
        isbn = self.cleaned_data.get('isbn')
        if not isbn:
            raise ValidationError('This field is required.')
            
        # Check for duplicate ISBN, excluding current instance
        existing = Book.objects.filter(isbn=isbn)
        if self.instance_id:
            existing = existing.exclude(id=self.instance_id)
            
        if existing.exists():
            raise ValidationError('This ISBN is already used by another book')
        return isbn
    
    def clean(self):
        cleaned_data = super().clean()
        author_name = cleaned_data.get('author_name')
        if author_name:
            # Get or create author
            author_obj, created = Author.objects.get_or_create(name=author_name)
            cleaned_data['author'] = author_obj
        
        # Validate numeric fields
        price = cleaned_data.get('price')
        if price is not None and price <= 0:
            self.add_error('price', 'Price must be greater than zero')
            
        pages = cleaned_data.get('pages')
        if pages is not None and pages <= 0:
            self.add_error('pages', 'Number of pages must be greater than zero')
            
        stock = cleaned_data.get('stock')
        if stock is not None and stock < 0:
            self.add_error('stock', 'Stock cannot be negative')
            
        return cleaned_data

    def save(self, commit=True):
        if 'author' in self.cleaned_data:
            self.instance.author = self.cleaned_data['author']
        return super().save(commit=commit)

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description']

class AuthorForm(forms.ModelForm):
    class Meta:
        model = Author
        fields = ['name', 'bio', 'photo']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
        } 