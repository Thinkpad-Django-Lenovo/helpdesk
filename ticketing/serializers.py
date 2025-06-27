from rest_framework import serializers
from ticketing import models
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.validators import UniqueValidator
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth.password_validation import validate_password
from django.utils.encoding import force_str
import re
from django.utils import timezone

class CustomUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=True, min_length=8)
    user_type = serializers.ChoiceField(choices=models.CustomUser.USER_TYPE_CHOICES)

    class Meta:
        model = models.CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 'phone',
            'password', 'user_type', 'department', 'position',
            'branch', 'location', 'is_email_verified', 'is_password_changed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_email_verified', 'is_password_changed']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = models.CustomUser(**validated_data)
        user.set_password(password)  
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class LoginSerializer(serializers.Serializer):  
    username = serializers.CharField(max_length=155)
    password = serializers.CharField(max_length=68, write_only=True)

    class Meta:
        fields = ['username', 'password']

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        request = self.context.get('request')
        user = authenticate(request, username=username, password=password)        
        if not user:
            raise AuthenticationFailed("Invalid credentials, try again")

        return {
            'user': user,
        }
    
    def tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": user.username,
            'department': user.department.name if user.department else None,
            'position': user.position.name if user.position else None,
            'user_type': user.get_user_type_display(),
            'is_email_verified': user.is_email_verified,
            'is_password_changed': user.is_password_changed
        }
    
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs

class PublicUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 'phone',
            'user_type', 'department', 'position', 'branch', 'location'
        ]

class TicketSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset= models.CustomUser.objects.all(), source='user', write_only=True
    )
    user = serializers.StringRelatedField(read_only=True)  # shows username or __str__

    class Meta:
        model = models.Ticket
        fields = [
            'id',
            'user',         # read-only user string (e.g., name or username)
            'user_id',      # write-only field for POST/PUT
            'subject',
            'description',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'status']

    def validate_subject(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Subject must be at least 5 characters long.")
        return value

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        return value

    def validate(self, attrs):
        subject = attrs.get("subject", "").strip()
        user = attrs.get("user") or self.instance.user if self.instance else None

        if user and models.Ticket.objects.exclude(pk=self.instance.pk if self.instance else None)\
            .filter(user=user, subject__iexact=subject, status__in=['new', 'assigned', 'in_progress'])\
            .exists():
            raise serializers.ValidationError("You already have an open ticket with this subject.")
        return attrs
    
class TaskSerializer(serializers.ModelSerializer):
    ticket_id = serializers.PrimaryKeyRelatedField(
        queryset= models.Ticket.objects.all(), source='ticket', write_only=True, required=False
    )
    ticket = serializers.StringRelatedField(read_only=True)

    assigned_by_id = serializers.PrimaryKeyRelatedField(
        queryset= models.CustomUser.objects.all(), source='assigned_by', write_only=True
    )
    assigned_by = serializers.StringRelatedField(read_only=True)

    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset= models.CustomUser.objects.all(), source='assigned_to', write_only=True
    )
    assigned_to = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = models.Task
        fields = [
            'id',
            'status',
            'deadline',
            'ticket', 'ticket_id',
            'assigned_by', 'assigned_by_id',
            'assigned_to', 'assigned_to_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_deadline(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value

    def validate(self, attrs):
        assigned_by = attrs.get('assigned_by') or self.instance.assigned_by if self.instance else None
        assigned_to = attrs.get('assigned_to') or self.instance.assigned_to if self.instance else None

        if assigned_by and assigned_by == assigned_to:
            raise serializers.ValidationError("You cannot assign a task to yourself.")

        return attrs            
    
class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.StringRelatedField(read_only=True)
    actor_id = serializers.PrimaryKeyRelatedField(
        queryset= models.CustomUser.objects.all(), source='actor', write_only=True, required=False
    )

    class Meta:
        model =  models.AuditLog
        fields = [
            'id',
            'actor', 'actor_id',
            'event',
            'timestamp',
        ]
        read_only_fields = ['id', 'actor', 'timestamp']

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data["actor"] = request.user
        return super().create(validated_data)    