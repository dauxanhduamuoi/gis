from django.urls import path  
from . import views  

app_name = 'maps'  

urlpatterns = [  
    path('', views.simplemap),  
    path('co-ban/', views.simplemap, name="co-ban"), 
    # path('index', views.index, name='index'), 
      path('api/cafes/', views.get_cafes, name='get_cafes'),  # URL để lấy dữ liệu quán cà phê
      path('cafes/<slug:slug>/', views.cafe_detail, name='cafe_detail'),
      path('register/', views.register_view, name='register'),
      path('login/', views.login_view, name='login_view'),
      path('login_1/', views.login_view_1, name='login_view_1'),
]  