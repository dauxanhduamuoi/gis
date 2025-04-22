from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from django.urls import reverse
from .models import *
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import CustomUserCreationForm, RegisterForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.db.models import Avg

def simplemap(request):
    return render(request, 'simple-map.html')  # Hiển thị trang HTML

def get_cafes(request):
    cafes = Cafe.objects.all().values('name', 'address', 'hours', 'latitude', 'longitude', 'image', 'slug', 'average_rating')
    cafes_list = list(cafes)
    return JsonResponse(cafes_list, safe=False)

def cafe_detail_1(request, slug):
    cafe = get_object_or_404(Cafe, slug=slug)
    return render(request, 'maps/cafe_detail.html', {'cafe': cafe})

def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()  # Lưu user vào DB
            user = form.save()
            user.is_staff = True  # Set is_staff to True
            user.save()  # Save the updated user object
            
            messages.success(request, 'Đăng ký thành công! Bạn có thể đăng nhập.')
            return redirect('login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('/trang-moi-sau-login/')  # <== chuyển hướng ở đây
        else:
            return render(request, 'login.html', {'error': 'Đăng nhập thất bại'})
    return render(request, 'registration/login.html')

def login_view_1(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        next_url = request.POST.get('next') or '/'  # fallback nếu không có next

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(next_url)
        else:
            messages.error(request, "Tên đăng nhập hoặc mật khẩu không đúng.")

    # Nếu có ?next=... trong querystring, truyền tiếp vào form
    return render(request, 'registration/login_1.html', {
        'next': request.GET.get('next', '/')
    })

def cafe_detail(request, slug):
    cafe = get_object_or_404(Cafe, slug=slug)
    reviews = cafe.reviews.select_related('user').order_by('-created_at')

    # Cập nhật điểm trung bình
    avg = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    cafe.average_rating = round(avg, 1)
    Cafe.objects.filter(pk=cafe.pk).update(average_rating=cafe.average_rating)

    # Lấy review của user hiện tại (nếu có)
    user_review = None
    if request.user.is_authenticated:
        user_review = reviews.filter(user=request.user).first()

    # Xử lý form POST khi đánh giá
    if request.method == 'POST':
         user_review = None
    if request.user.is_authenticated:
        user_review = reviews.filter(user=request.user).first()

    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.error(request, "Bạn cần đăng nhập để đánh giá.")
            return redirect(f"{reverse('login')}?next={request.path}")

        # Xử lý xóa review
        if 'delete_review' in request.POST:
            if user_review:
                user_review.delete()
                messages.success(request, "Đã xoá đánh giá của bạn.")
            return redirect('maps:cafe_detail', slug=slug)

        # Xử lý tạo / cập nhật
        try:
            rating = int(request.POST.get('rating', 0))
        except ValueError:
            rating = 0
        comment = request.POST.get('comment', '').strip()

        if rating < 1 or rating > 5:
            messages.error(request, "Vui lòng chọn từ 1 đến 5 sao.")
        else:
            Review.objects.update_or_create(
                cafe=cafe,
                user=request.user,
                defaults={'rating': rating, 'comment': comment}
            )
            messages.success(request, "Cảm ơn bạn đã đánh giá!")
        return redirect('maps:cafe_detail', slug=slug)

    return render(request, 'maps/cafe_detail.html', {
        'cafe': cafe,
        'reviews': reviews,
        'user_review': user_review,
    })
