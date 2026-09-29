# ⚡ TaskFlow – Simple Task Manager

TaskFlow is a clean, modern, beginner-friendly full-stack task management web application built with **Node.js, Express, and Vanilla JavaScript**.

It is specifically engineered to be simple, fast, and easy to deploy on an **AWS EC2 Ubuntu server** without the overhead of heavy build tools or external database setups.

---

## 📋 Table of Contents

- [Overview & Features](#-overview--features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Installation & Setup](#-local-installation--setup)
- [REST API Reference](#-rest-api-reference)
- [Example API Requests (cURL)](#-example-api-requests-curl)
- [Production Mode](#-production-mode)
- [AWS EC2 Ubuntu Deployment Guide (Step-by-Step)](#-aws-ec2-ubuntu-deployment-guide-step-by-step)
  - [1. Connect to EC2 via SSH](#1-connect-to-ec2-via-ssh)
  - [2. Update System & Install Node.js](#2-update-system--install-nodejs)
  - [3. Configure AWS Security Groups](#3-configure-aws-security-groups)
  - [4. Clone the Repository & Install Dependencies](#4-clone-the-repository--install-dependencies)
  - [5. Run with PM2 Process Manager](#5-run-with-pm2-process-manager)
  - [6. Configure Nginx Reverse Proxy](#6-configure-nginx-reverse-proxy)
  - [7. Verify and Monitor](#7-verify-and-monitor)
- [License](#-license)

---

## ✨ Overview & Features

1. **Intuitive Dashboard**: Real-time counter of total tasks, pending tasks, completed tasks, and a dynamic completion progress bar.
2. **Add Tasks**: Simple input with validation preventing blank entries.
3. **Toggle Completion**: Mark tasks as pending or completed with immediate visual distinction (strikethrough & status badge).
4. **Delete Tasks**: Remove tasks with single-click actions.
5. **Filter Views**: Easily toggle between **All**, **Pending**, and **Completed** tasks.
6. **Live Server Health Indicator**: Real-time status badge checking the backend `/api/health` endpoint.
7. **Zero-Configuration In-Memory Storage**: Works instantly out of the box with zero database provisioning required.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JS | Lightweight, responsive, zero-build-step UI |
| **Backend** | Node.js + Express.js | Fast, minimalist REST API server |
| **Styling** | Vanilla CSS + Plus Jakarta Sans | Modern design tokens, micro-animations, glassmorphism badges |
| **State / Storage**| In-Memory Data Store | Beginner-friendly, zero external database setup |
| **Package Manager**| npm | Standard Node.js package manager |

---

## 📁 Project Structure

```text
taskflow/
├── server/
│   ├── server.js              # Express app setup, middleware, and static server
│   ├── routes/
│   │   └── taskRoutes.js      # REST API route definitions & health check
│   └── controllers/
│       └── taskController.js  # Task business logic & in-memory store
├── public/
│   ├── index.html             # Single-page application markup
│   ├── style.css              # Custom styling & responsive layouts
│   └── script.js              # Frontend Fetch API integration & UI logic
├── .env.example               # Template for environment variables
├── .gitignore                 # Files excluded from git tracking
├── package.json               # Project metadata and dependencies
└── README.md                  # Complete documentation and EC2 guide
```

---

## 💻 Prerequisites

Ensure you have the following installed locally:

- **Node.js**: v18.x, v20.x, or v22.x ([Download Node.js](https://nodejs.org/))
- **npm**: v9.x or higher (comes bundled with Node.js)
- **Git**: ([Download Git](https://git-scm.com/))

---

## 🚀 Local Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Akhileswar6/Student-Project.git
cd Student-Project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Copy the `.env.example` file to `.env`:

```bash
# On Linux / macOS / Git Bash
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

*(Optional) You can open `.env` and change the default port if desired:*
```env
PORT=3000
```

### 4. Start the Application

**Standard Start:**
```bash
npm start
```

**Development Mode (Auto-reloads on file changes with Node `--watch`):**
```bash
npm run dev
```

### 5. Access the Web App

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 📡 REST API Reference

The server exposes the following RESTful endpoints:

| Method | Endpoint | Description | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check | *None* | `200 OK` |
| `GET` | `/api/tasks` | Get all tasks | *None* | `200 OK` |
| `POST` | `/api/tasks` | Create a new task | `{ "title": "string" }` | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/tasks/:id` | Update task status or title | `{ "completed": boolean }` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/tasks/:id` | Delete a task by ID | *None* | `200 OK`, `404 Not Found` |

---

## 🧪 Example API Requests (cURL)

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/health
```
**Response:**
```json
{
  "status": "OK",
  "message": "TaskFlow server is running"
}
```

### 2. Fetch All Tasks
```bash
curl -X GET http://localhost:3000/api/tasks
```

### 3. Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Deploy TaskFlow to AWS EC2"}'
```
**Response:**
```json
{
  "id": "c1f7b764-cf36-4d22-8356-991f24d27150",
  "title": "Deploy TaskFlow to AWS EC2",
  "completed": false,
  "createdAt": "2026-09-29T16:00:00.000Z"
}
```

### 4. Mark Task as Completed (PUT)
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### 5. Delete a Task (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

---

## ⚙️ Production Mode

To run in production mode locally:

```bash
NODE_ENV=production PORT=3000 node server/server.js
```

---

## ☁️ AWS EC2 Ubuntu Deployment Guide (Step-by-Step)

This guide takes you through deploying TaskFlow onto an **AWS EC2 Ubuntu 22.04 / 24.04 LTS** instance using **PM2** as the process manager and **Nginx** as a reverse proxy.

---

### 1. Connect to EC2 via SSH

Locate your downloaded private key (`.pem` file) from AWS, set its permissions, and SSH into your instance:

```bash
# Set permissions (required on Linux/macOS)
chmod 400 your-key.pem

# Connect to your instance
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP_OR_DNS>
```

---

### 2. Update System & Install Node.js

Once logged into your Ubuntu EC2 instance, update the package list and install Node.js (v20 or v22 LTS):

```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify installation
node -v
npm -v
```

---

### 3. Configure AWS Security Groups

In the **AWS Management Console**:
1. Go to **EC2** &rarr; **Instances** &rarr; Select your instance.
2. Click the **Security** tab &rarr; Click your **Security Group**.
3. Under **Inbound Rules**, click **Edit inbound rules** and ensure the following rules are present:

| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | SSH remote terminal |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web traffic via Nginx |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | SSL/TLS encrypted web traffic |
| **Custom TCP** | TCP | `3000` | `0.0.0.0/0` | *(Optional)* Direct Node port |

---

### 4. Clone the Repository & Install Dependencies

On your EC2 instance:

```bash
# Navigate to web root or home directory
cd /var/www || cd ~

# Clone your repository
git clone https://github.com/Akhileswar6/Student-Project.git taskflow

# Change into the project directory
cd taskflow

# Create environment configuration
cp .env.example .env

# Install production dependencies
npm install --omit=dev
```

---

### 5. Run with PM2 Process Manager

PM2 keeps your Node.js application running in the background and automatically restarts it if the server reboots or crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start TaskFlow under PM2
pm2 start server/server.js --name taskflow

# View application status
pm2 status

# View live application logs
pm2 logs taskflow

# Enable PM2 to restart on system boot
pm2 startup systemd
# (Run the command generated in your terminal output)

# Save the current PM2 process list
pm2 save
```

---

### 6. Configure Nginx Reverse Proxy

Nginx allows users to access your app on standard port 80 (HTTP) without typing `:3000` in their browser.

#### A. Install Nginx
```bash
sudo apt install -y nginx
```

#### B. Create Nginx Configuration
Create a new server block configuration file:

```bash
sudo nano /etc/nginx/sites-available/taskflow
```

Paste the following configuration (replace `<YOUR_EC2_PUBLIC_IP>` with your EC2 public IP or domain name):

```nginx
server {
    listen 80;
    server_name <YOUR_EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit (`Ctrl + O`, `Enter`, then `Ctrl + X`).

#### C. Enable the Site and Restart Nginx
```bash
# Enable the configuration by symlinking to sites-enabled
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Restart Nginx service
sudo systemctl restart nginx
```

#### D. Adjust Firewall (UFW)
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable
```

---

### 7. Verify and Monitor

1. Open your web browser and navigate directly to:
   ```text
   http://<YOUR_EC2_PUBLIC_IP>
   ```
2. Test the health endpoint:
   ```text
   http://<YOUR_EC2_PUBLIC_IP>/api/health
   ```
3. Monitor your application:
   ```bash
   pm2 monit
   ```

---

## 📄 License

This project is licensed under the ISC License.
