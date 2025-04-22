# from django.http import HttpResponse
from django.shortcuts import render

def homepage(request):
    # return HttpResponse("Xin chào Django")
    return render(request, 'home.html')

def aboutpage(request):
    # return HttpResponse("Đây là trang giới thiệu")
    return render(request, 'about.html')
    