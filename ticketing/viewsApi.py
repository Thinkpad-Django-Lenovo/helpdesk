from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ObjectDoesNotExist
from ticketing import models
from ticketing import serializers
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from django.utils.timezone import now
from ticketing import utils

# Create your views here.

class AuthAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        action = request.data.get("action") or request.query_params.get("action")

        if action == "register":
            serializer = serializers.CustomUserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    "user": serializers.CustomUserSerializer(user).data,
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif action == "login":
            serializer = serializers.LoginSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            tokens = serializer.tokens(user)
            return Response(tokens)

        elif action == "reset":
            email = request.data.get("email")
            try:
                user = models.CustomUser.objects.get(email=email)
                token = default_token_generator.make_token(user)
                return Response({"token": token, "user_id": user.id}, status=status.HTTP_200_OK)
            except ObjectDoesNotExist:
                return Response({"detail": "Email not found."}, status=status.HTTP_404_NOT_FOUND)

        elif action == "confirm_reset":
            user_id = request.data.get("user_id")
            token = request.data.get("token")
            new_password = request.data.get("new_password")
            try:
                user = models.CustomUser.objects.get(id=user_id)
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.is_password_changed = True
                    user.save()
                    return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)
                return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
            except ObjectDoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        elif action == "change_password":
            if not request.user.is_authenticated:
                return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

            serializer = serializers.ChangePasswordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user = request.user
            old_password = serializer.validated_data['old_password']

            if not user.check_password(old_password):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.is_password_changed = True
            user.save()

            return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, pk=None):
        if pk:
            user = get_object_or_404(models.CustomUser, pk=pk)
            serializer = serializers.CustomUserSerializer(user)
            return Response(serializer.data)

        if request.user.is_staff or request.user.is_superuser:
            users = models.CustomUser.objects.all()
            serializer = serializers.CustomUserSerializer(users, many=True)
            return Response(serializer.data)

        serializer = serializers.CustomUserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request, pk=None):
        if pk:
            user = get_object_or_404(models.CustomUser, pk=pk)

            if request.user != user and not request.user.is_staff and not request.user.is_superuser:
                raise PermissionDenied("You do not have permission to update this user.")

            serializer = serializers.CustomUserSerializer(user, data=request.data, partial=True)
        else:
            serializer = serializers.CustomUserSerializer(request.user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not request.user.is_staff and not request.user.is_superuser:
            raise PermissionDenied("Only admins can delete users.")

        if not pk:
            return Response({"detail": "User ID is required to delete a user."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(models.CustomUser, pk=pk)
        user.delete()
        return Response({"detail": "User deleted successfully."})
        
class TicketAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            ticket = get_object_or_404(models.Ticket, pk=pk)
            serializer = serializers.TicketSerializer(ticket)
            return Response(serializer.data)

        if request.user.user_type == 'super_admin':
            tickets = models.Ticket.objects.all()
        else:
            tickets =models.Ticket.objects.filter(user=request.user)
        serializer = serializers.TicketSerializer(tickets, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.user_type not in ['super_admin', 'it_personnel']:
            return Response({"detail": "You do not have permission to create a ticket."}, status=403)

        today = now().date()
        tickets_today = models.Ticket.objects.filter(user=request.user, created_at__date=today).count()

        if tickets_today >= 10:
            return Response(
                {"detail": "You have reached the daily limit of 10 tickets."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        serializer = serializers.TicketSerializer(data=request.data)
        if serializer.is_valid():
            ticket = serializer.save(user=request.user)
            utils.send_ws_notification(
                user_id=ticket.user.id,
                event_type="ticket_created",
                data={
                    "ticket_id": ticket.id,
                    "subject": ticket.subject,
                    "status": ticket.status,
                }
            )
            return Response(ticket.data, status=status.HTTP_201_CREATED)
        
        return Response(ticket.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        ticket = get_object_or_404(models.Ticket, pk=pk)

        if ticket.user != request.user:
            return Response({"detail": "You do not have permission to fully update this ticket."}, status=403)

        if ticket.status in ['in_progress', 'resolved', 'closed']:
            return Response({"detail": f"Tickets with status '{ticket.status}' cannot be fully updated."}, status=400)

        serializer = serializers.TicketSerializer(ticket, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        ticket = get_object_or_404(models.Ticket, pk=pk)

        if ticket.user != request.user and request.user.user_type != 'super_admin':
            return Response({"detail": "You do not have permission to partially update this ticket."}, status=403)

        if ticket.status == 'resolved':
            return Response({"detail": f"Tickets with status '{ticket.status}' cannot be updated."}, status=400)

        serializer = serializers.TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ticket = get_object_or_404(models.Ticket, pk=pk)
        
        if ticket.user != request.user:
            return Response({"detail": "You do not have permission to delete this ticket."}, status=403)
        
        if ticket.status in ['assigned', 'in_progress']:
            return Response({"detail": f"Tickets with status '{ticket.status}' cannot be deleted."}, status=400)
        
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    
class TaskAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            task = get_object_or_404(models.Task, pk=pk)
            if (
                request.user != task.assigned_to and
                request.user != task.assigned_by and
                request.user.user_type != 'super_admin'
            ):
                return Response({"detail": "You do not have permission to view this task."}, status=403)
            serializer = serializers.TaskSerializer(task)
            return Response(serializer.data)

        if request.user.user_type == 'super_admin':
            tasks = models.Task.objects.all()
        else:
            tasks = models.Task.objects.filter(assigned_to=request.user)
        serializer = serializers.TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = serializers.TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(assigned_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        task = get_object_or_404(models.Task, pk=pk)
        if request.user != task.assigned_by and request.user.user_type != 'super_admin':
            return Response({"detail": "You do not have permission to update this task."}, status=403)

        serializer = serializers.TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        task = get_object_or_404(models.Task, pk=pk)

        if request.user != task.assigned_by and request.user != task.assigned_to and request.user.user_type != 'super_admin':
            return Response({"detail": "You do not have permission to partially update this task."}, status=403)

        if 'assigned_to' in request.data:
            if task.status == 'done':
                return Response({"detail": "You cannot reassign a task that is already marked as done."}, status=400)

            try:
                new_assignee = models.CustomUser.objects.get(pk=request.data['assigned_to'])
                if new_assignee.user_type != 'it_personnel':
                    return Response({"detail": "Only IT Personnel can be assigned tasks."}, status=400)
            except models.CustomUser.DoesNotExist:
                return Response({"detail": "Assigned user does not exist."}, status=400)

        serializer = serializers.TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            ticket = task.ticket
            if ticket:
                all_tasks = ticket.tasks.all()
                statuses = set(t.status for t in all_tasks)

                if statuses == {'done'}:
                    if ticket.status not in ['resolved', 'closed']:
                        ticket.status = 'resolved'
                        ticket.save()
                        utils.send_ws_notification(
                            user_id=ticket.assigned_to.id,
                            event_type="task_assigned",
                            data={
                                "task_id": ticket.id,
                                "title": ticket.title,
                                "status": ticket.status,
                                "ticket_id": task.ticket.id if task.ticket else None,
                            }
                        )
                elif 'in_progress' in statuses:
                    if ticket.status not in ['in_progress', 'resolved', 'closed']:
                        ticket.status = 'in_progress'
                        ticket.save()
                elif 'pending' in statuses:
                    if ticket.status == 'new':
                        ticket.status = 'assigned'
                        ticket.save()
                        utils.send_ws_notification(
                            user_id=ticket.assigned_to.id,
                            event_type="task_assigned",
                            data={
                                "task_id": ticket.id,
                                "title": ticket.title,
                                "status": ticket.status,
                                "ticket_id": task.ticket.id if task.ticket else None,
                            }
                        )

            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        task = get_object_or_404(models.Task, pk=pk)

        if request.user.user_type not in ['super_admin', 'it_personnel']:
            return Response({"detail": "Only admins can delete tasks."}, status=403)

        if task.assigned_to is not None:
            return Response({"detail": "You cannot delete a task that is already assigned."}, status=400)

        task.delete()
        return Response({"detail": "Task deleted successfully."}, status=status.HTTP_204_NO_CONTENT)   