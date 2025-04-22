from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from .models import *
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import CustomUserCreationForm, RegisterForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.db.models import Avg

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
        if not request.user.is_authenticated:
            messages.error(request, "Bạn cần đăng nhập để đánh giá.")
            return redirect('login') + f'?next={request.path}'

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