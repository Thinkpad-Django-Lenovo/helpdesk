from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
import re 
from django.utils import timezone

# Create your models here.

def validate_file_extension(file):
    allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
    ext = file.name.split('.')[-1].lower()
    if ext not in allowed_extensions:
        raise ValidationError("Unsupported file extension. Allowed types: pdf, jpg, png, doc, docx, xls, xlsx.")

def validate_file_size(file):
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        raise ValidationError("File size should not exceed 10MB.")

class CustomUserManager(UserManager):
    def _create_user(self, username, email, password, **extra_fields):
        email = self.normalize_email(email)
        user = CustomUser(username=username, email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("user_type", "O")

        assert extra_fields["is_staff"]
        assert extra_fields["is_superuser"]
        return self._create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('it_personnel', 'IT Personnel'),
        ('end_user', 'End User'),
    ]

    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    password = models.CharField(max_length=256)
    user_type = models.CharField(choices=USER_TYPE_CHOICES, default='end_user', max_length=20)
    department = models.CharField(max_length=150, null=True, blank=True)
    position = models.CharField(max_length=150, null=True, blank=True)
    branch = models.CharField(max_length=150, null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    is_password_changed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = CustomUserManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.username} ({self.get_user_type_display()})"

    def get_username(self):
        return f"{self.username}"

    def clean(self):
        self.username = self.username.strip().lower()
        self.email = self.email.strip().lower()

        if len(self.first_name.strip()) < 2:
            raise ValidationError("First name must be at least 2 characters.")

        if len(self.last_name.strip()) < 2:
            raise ValidationError("Last name must be at least 2 characters.")

        if not re.match(r'^\+?\d{7,20}$', self.phone) and self.phone:
            raise ValidationError("Enter a valid phone number.")

        if CustomUser.objects.exclude(pk=self.pk).filter(username__iexact=self.username).exists():
            raise ValidationError("This username is already taken.")

        if CustomUser.objects.exclude(pk=self.pk).filter(email__iexact=self.email).exists():
            raise ValidationError("This email is already registered.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class Ticket(models.Model):    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'user_type': 'end_user'}, related_name='created_tickets')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        self.subject = self.subject.strip()

        if Ticket.objects.exclude(pk=self.pk).filter(user=self.user, subject__iexact=self.subject, status__in=['new', 'assigned', 'in_progress']).exists():
            raise ValidationError("You already have an open ticket with this subject.")

    def save(self, *args, **kwargs):
        self.full_clean()  # triggers `clean()`
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject} ({self.get_priority_display()}) - {self.status.capitalize()}"

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ] 

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    assigned_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):

        if self.deadline and self.deadline < timezone.now().date():
            raise ValidationError("Deadline cannot be in the past.")

        if self.assigned_by and self.assigned_to == self.assigned_by:
            raise ValidationError("You cannot assign a task to yourself.")

    def save(self, *args, **kwargs):
        self.full_clean()  
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.status.capitalize()})"

class AuditLog(models.Model):
    actor = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    event = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.username} - {self.event} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"