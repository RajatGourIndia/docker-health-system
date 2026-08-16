# Docker Dashboard

A lightweight, self-hosted web dashboard for monitoring and managing local Docker containers.

<!-- TODO: add a screenshot here, e.g. -->
<!-- ![Docker Dashboard — Containers view](docs/screenshot-containers.png) -->

## Quick start

The easiest way to run it is with Docker Compose:

```bash
git clone https://github.com/RajatGourIndia/docker-health-system.git
cd docker-health-system
cp .env.example .env
docker compose up -d
```

Or, without Compose, the equivalent `docker run` one-liner:

```bash
docker build -t docker-health-system .
docker run -d --name dashboard \
  -p 3000:3000 \
  --env-file .env \
  --user root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v dashboard-data:/app/data \
  docker-health-system
```

### First run

Open **http://localhost:3000**. Since no admin account exists yet, you'll land on a **Create Admin Account** screen instead of a login page — pick a username and password there. Every visit after that shows the normal login screen.

## Features

- **Containers** — live list (auto-updating via server-sent events), search/filter, pagination, per-container CPU and memory meters
- **Container actions** — Start, Stop, Restart, Pause, Resume, right from the list
- **Logs** — tail recent output or follow it live, with a one-click download
- **Images** — repository/tag, size, and creation date for everything pulled or built locally
- **Admin settings** — change the admin password, tune the live-refresh interval and session idle timeout, and view read-only system info (Docker Engine/API version, dashboard uptime)

## Security note

**This tool is intended for local or private-network use** (localhost, a home network, or an internal company network). It has not been hardened for direct exposure to the public internet — do not expose it directly without adding your own reverse proxy, TLS, and rate-limiting.

## Password recovery

There's no email-based password reset (this is a self-hosted, single-admin tool with no SMTP setup). If you forget the password, run this from the host:

```bash
docker exec -it dashboard npm run reset-admin-password
```

It'll prompt for a new password right in the terminal. (Replace `dashboard` with your container's actual name if you changed it.)

## License

[MIT](./LICENSE)
