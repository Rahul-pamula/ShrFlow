# Sh_R_Mail — Docker Cheat Sheet

This document contains everything you need to know to run the Sh_R_Mail platform locally using Docker, without needing to manually start multiple terminal windows.

---

## 1. Prerequisites (The Magic Oven)
Before running any Docker commands, **Docker Desktop** must be opened and "Engine Running." 
If you run commands without Docker open, you will receive an error like: `Cannot connect to the Docker daemon`.

---

## 2. Starting & Stopping the Servers

> [!IMPORTANT]
> **Always run these commands from the root directory of your project folder (`/Users/pamula/Desktop/Sh_R_Mail`).**
> If you run them from a subfolder (like `/platform/api`), Docker will not be able to find all your project files!
### ▶️ Start Everything
To bake the images and spin up all of your databases, APIs, workers, and frontend clients into the background:
```bash
docker-compose up --build -d
```
*(The `-d` tells Docker to run in "detached" mode so you get your terminal back).*

### ⏹️ Stop Everything
When you are done working for the day and want to gracefully shut down all the servers and free up your computer's memory:
```bash
docker-compose down
```

---

## 3. Checking Live Terminal Logs

Because all your servers are running hidden in the background, you use the "logs" command to tap into their live text streams. 
The `-f` flag means **"follow"**, which streams the text live.

**To exit a log stream safely without stopping the server, press `Ctrl + C` on your keyboard.**

### View ALL logs combined:
```bash
docker-compose logs -f
```

### View the Backend API logs:
```bash
docker-compose logs -f api
```

### View the Frontend (Next.js) logs:
```bash
docker-compose logs -f client
```

### View the Primary Email Sender Worker logs:
```bash
docker-compose logs -f email_sender
```

### View the Campaign Scheduler logs:
```bash
docker-compose logs -f scheduler
```

### View the Centralized System Worker logs:
```bash
docker-compose logs -f centralized_email_worker
```

### View the Background Task Manager logs:
```bash
docker-compose logs -f background_worker
```

---

## 4. Troubleshooting
- If a container crashes on boot (e.g., `dependency failed to start`), check the logs of the `api` container first, because all other workers depend on the API being healthy before they will start.
- You can always open the visual **Docker Desktop UI**, navigate to the `Containers` tab, click on `Sh_R_Mail`, and view the colors/logs visually if you don't want to use the terminal!
