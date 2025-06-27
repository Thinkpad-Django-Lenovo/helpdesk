from django.urls import path
from ticketing import viewsApi

urlpatterns = [
    path('auth/', viewsApi.AuthAPIView.as_view()),
    path('auth/<int:pk>/', viewsApi.AuthAPIView.as_view()),

    path('tickets/', viewsApi.TicketAPIView.as_view()),
    path('tickets/<int:pk>/', viewsApi.TicketAPIView.as_view()),
    
    path('tasks/', viewsApi.TaskAPIView.as_view()),
    path('tasks/<int:pk>/', viewsApi.TaskAPIView.as_view()),
]