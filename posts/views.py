from django.shortcuts import render,get_object_or_404
from .models import Post
from django.http import HttpResponse


def post_list(request):
    posts = Post.objects.all().order_by('-date')  # Lấy tất cả bài viết, mới nhất trước
    return render(request, 'posts/post_list.html', {'posts': posts})
def post_page(request, slug ):
    return HttpResponse(slug)
def post_page(request, slug):
    post = get_object_or_404(Post, slug=slug)
    return render(request, 'posts/post_detail.html', {'post': post})    
def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk)
    return render(request, 'posts/detail.html', {'post': post})

# from django.shortcuts import render
# from .models import Cafe

# def index(request):
#     cafes = Cafe.objects.all()  # Lấy tất cả quán cà phê từ cơ sở dữ liệu
#     return render(request, 'index.html', {'cafes': cafes})

