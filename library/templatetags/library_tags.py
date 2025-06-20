from django import template

register = template.Library()

@register.filter
def get_range(value):
    """
    Returns a list containing range(1, value + 1)
    
    Usage:
    {% for i in value|get_range %}
        {{ i }}
    {% endfor %}
    """
    return range(1, int(value) + 1) 