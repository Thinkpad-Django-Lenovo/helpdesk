Helpdesk Ticketing System

  Helpdesk Ticketing System Welcome to the Helpdesk Ticketing System – an efficient,
  scalable, and user-friendly platform built to streamline customer support and issue tracking for businesses.
  This system is built with Django and Channels to provide real-time notifications and smooth user interaction.

Features
  User Roles:
    Super Admin: Full access to manage users, tickets, and tasks.
    IT Personnel: Assigned tickets and tasks, with the ability to resolve and update statuses.
    End User: Submit and track the status of tickets.
    
  Real-Time Notifications:
    Instant updates on ticket creation, status changes, task assignments, and more using WebSockets.
    
  Ticket Management:
    View, create, update, and track tickets from creation to resolution.
    
  Task Management:
    Assign tasks to IT personnel, update statuses, and ensure smooth workflows between teams.
    
  Ticket Statuses:
    Tracks ticket and task statuses, including New, Assigned, In Progress, Resolved, and Closed.
    
  Re-assigning Tickets/Tasks:
    Seamless reassignment of tasks between team members based on workload and priority.
  
Technologies Used
  Backend:
      1. Django (Web Framework)
      2. Django Channels (Real-time WebSocket support)
      3. Any database of your choice
      4. Django REST Framework (API development)
      
Getting Started
  Prerequisites
    To run this project locally, you need:
      Python 3.x
      Node.js (for React development)
      PostgreSQL (or any other database if you'd like to configure that)
      
Setting Up the Backend (Django)
    Clone the repository:
        git clone https://github.com/Thinkpad-Django-Lenovo/helpdesk.git
    cd helpdesk
    Install the dependencies:
      pip install -r requirements.txt

Set up environment variables:

Create a .env file in the root of the backend directory.

Add the necessary settings, like SECRET_KEY, DEBUG, DATABASE_URL, etc.

Run migrations to set up the database:
  python manage.py migrate
  
Create a superuser (if you'd like to test as an admin):
  python manage.py createsuperuser
  
Start the development server:
  python manage.py runserver
  
The backend will now be running at http://localhost:8000. Django and Django REST Framework for building the backend.

React and WebSockets for creating the interactive frontend.

The open-source community for continuous improvement and support.

Authors
  Project Team: Yusufu Ayami and Petros Manyeka

  Contributors: Feel free to add yourself here once you contribute!

License
  This project is licensed under the MIT License - see the LICENSE file for details.

Documentation
  WebSockets for Real-Time Updates

  This project uses Django Channels to send real-time notifications to users about ticket creation, task assignments, status updates, and more.
  Users will be notified instantly via WebSockets when:
    1. A new ticket is created.
    2. A task is assigned or reassigned.
    3. The status of a ticket or task changes.
