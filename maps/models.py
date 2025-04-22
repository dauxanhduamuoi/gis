from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser

#from myproject import settings
# Create your models here.
# from django.db import models

# class Cafe(models.Model):
#     name = models.CharField(max_length=255)
#     address = models.CharField(max_length=255)
#     hours = models.CharField(max_length=100)
#     latitude = models.FloatField()
#     longitude = models.FloatField()


#     def __str__(self):
#         return self.name
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    #avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

class Cafe(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    hours = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    # image = models.ImageField(upload_to='cafe_images/', null=True, blank=True)  # Trường hình ảnh
    image = models.ImageField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)  # Trường mô tả
    phone_number = models.CharField(max_length=20, null=True, blank=True)  # Trường số điện thoại
    website = models.URLField(null=True, blank=True)  # Trường website
    average_rating = models.FloatField(null=True, blank=True, default=0.0)  # Trường đánh giá trung bình
    slug = models.SlugField(unique=True, blank=True)  # thêm trường slug


    # def save(self, *args, **kwargs):
    #         if not self.slug:
    #             self.slug = slugify(self.name)
    #         super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            while Cafe.objects.filter(slug=unique_slug).exists():
                unique_slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    @property
    def ImageURL(self):
        try:
            url = self.image.url

        except:
            url = ''
        return url

class Review(models.Model):
    cafe = models.ForeignKey('Cafe', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()  # 1 đến 5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cafe', 'user')  # Mỗi user chỉ đánh giá 1 lần / 1 quán

    def __str__(self):
        return f"{self.user.username} đánh giá {self.cafe.name} - {self.rating}⭐"