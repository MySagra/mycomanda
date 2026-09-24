<div align="center">

<p align="center">
  <img src="public/logo.svg" alt="MyComanda logo" width="120" />
</p>

# 🍳 MyComanda

**Real-time Kitchen Order Monitor for Restaurants & Food Events**

[![License: PolyForm Shield 1.0.0](https://img.shields.io/badge/License-PolyForm_Shield_1.0.0-blue.svg)](https://polyformproject.org/licenses/shield/1.0.0)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Docker](#-docker-deployment) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 About

**MyComanda** is a kitchen display system built with Next.js. Designed for restaurants, cafes, and food events like sagre and festivals, it shows the orders sent to the kitchen in real time, grouped by the printers each station follows. Staff mark dishes as ready and complete orders directly from a desktop screen or a tablet.

Part of the **MySagra** ecosystem, MyComanda receives orders from the MySagra backend as soon as they are confirmed at the cash register ([MyCassa](https://github.com/MySagra/mycassa)).

## ✨ Features

### 🎯 Core Functionality
- **Live Order Monitor** - Orders appear as soon as they are confirmed, through Server-Sent Events (SSE)
- **Printer Selection** - Each monitor follows one or more printers and shows only the dishes sent to them
- **Cash Register Filter** - Printers bound to an enabled cash register (receipt printers) are hidden from the selection
- **Dish Progress** - Mark single dishes as ready; the order turns green when every dish is done
- **Pin & Reorder** - Pin urgent orders to the top and reorder cards with drag and drop
- **Completed Orders** - Review today's completed orders and send one back to the monitor
- **Ticket Numbers** - Show the ticket number or the order code first (`SHOW_NUMBERS`)

### 📱 Devices
- **Desktop & Tablet Modes** - Hover actions with a mouse, large tap targets on touch screens; detected automatically, changeable in the settings
- **Mobile Header** - On small screens the header actions move into the user menu
- **Installable PWA** - Install MyComanda as an app on tablets and kiosks, with an offline page
- **Fullscreen Mode** - One click to use the whole screen in the kitchen

### 🎨 User Experience
- **Adjustable Card Size** - Slider in the settings to make the order cards larger
- **Dark/Light Mode** - Theme switching with next-themes
- **Built-in Guide** - Step-by-step tutorial after the first login, available again from the settings
- **Multi-language** - Italian and English interface with i18next
- **Toast Notifications** - User-friendly feedback with Sonner

### 🛠️ Technical Features
- **Backend-for-Frontend (BFF)** - Next.js API Routes proxy every call; the backend URL is never exposed to the browser
- **Type Safety** - Full TypeScript implementation
- **Docker Support** - Multi-platform image (`linux/amd64`, `linux/arm64`) published to GitHub Container Registry

## 🚀 Installation

### Prerequisites

- **Node.js** 22.x or higher
- **npm**
- Access to MySagra backend API

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/MySagra/mycomanda.git
   cd mycomanda
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update the following variables:
   ```env
   # Backend API base URL (server-side only)
   API_URL=http://localhost:8000

   # Secret used to sign the user JWT
   JWT_SECRET=your_secure_random_secret_here

   # Show the ticket number before the order code
   SHOW_NUMBERS=false
   ```

   > **Note**: All API calls are made server-side through Next.js API Routes. The `API_URL` environment variable is never sent to the browser.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3035](http://localhost:3035)

## 🐳 Docker Deployment

MyComanda includes full Docker support for production deployments.

### Using the Published Image

Every GitHub release publishes an image to GitHub Container Registry:

```bash
docker pull ghcr.io/mysagra/mysagra-mycomanda:latest
```

### Using Docker Compose

1. **Ensure you have a `.env` file configured** (see Installation section)

2. **Build and run the container**
   ```bash
   docker compose up -d
   ```

3. **Access the application**

   The application will be available at [http://localhost:3035](http://localhost:3035)

### Docker Configuration

The application uses a multi-stage Dockerfile for optimized builds:
- **Dependencies stage** - Installs npm packages
- **Builder stage** - Builds the Next.js application in standalone mode
- **Runner stage** - Minimal production image running as a non-root user

Environment variables are read at runtime: change `.env` and restart the container, no rebuild needed.

## 🛠️ Tech Stack

### Frontend Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety

### UI Components & Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Base UI](https://base-ui.com/)** - Unstyled, accessible components
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library

### Internationalization
- **[i18next](https://www.i18next.com/)** - Translation framework
- **[react-i18next](https://react.i18next.com/)** - React bindings for i18next

### Utilities
- **[date-fns](https://date-fns.org/)** - Date manipulation
- **[clsx](https://github.com/lukeed/clsx)** - Conditional className utility
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind classes
- **[sonner](https://sonner.emilkowal.ski/)** - Toast notifications

## 📁 Project Structure

```
mycomanda/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (BFF proxy to the backend)
│   ├── commands/          # Order monitor and completed orders
│   ├── login/             # Authentication page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── commands/         # Monitor, completed orders, header, guide
│   ├── login/            # Login form
│   ├── settings/         # Settings cards and header
│   ├── providers/        # Context providers
│   └── ui/               # shadcn/ui components
├── actions/              # Server Actions (login, logout)
├── hooks/                # Custom React hooks
├── lib/                  # Auth helpers, i18n, env, utilities
├── public/               # Static assets, PWA icons, service worker
├── .github/workflows/    # CI and Docker image publishing
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose configuration
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3035 |
| `npm run build` | Build production bundle |
| `npm start` | Start production server on port 3035 |
| `npm run lint` | Run ESLint for code quality |

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | Backend API URL (server-side only) | `http://localhost:8000` |
| `JWT_SECRET` | Secret used to sign the user JWT | Random string (generate with `openssl rand -base64 32`) |
| `SHOW_NUMBERS` | `true` shows the ticket number first, otherwise the order code | `false` |

> **Architecture Note**: All API communication is handled server-side through Next.js API Routes. The backend URL is never exposed to the client.

## 🔄 Continuous Integration

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Push and pull request on `main` | Installs dependencies and builds the app |
| `docker-publish.yml` | Published release or manual run | Builds and pushes the Docker image to `ghcr.io` |

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add Italian and English translations for every new text
- Test your changes on both desktop and tablet mode before submitting
- Ensure TypeScript types are properly defined

## 📄 License

This project is licensed under the **PolyForm Shield License 1.0.0**.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You can use it for your own restaurant, cafe, or event
- ❌ You cannot use it to build a product that competes with MySagra

See the [LICENSE](LICENSE.md) file for full details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) by Vercel
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Part of the [MySagra](https://github.com/MySagra) ecosystem

## 📞 Support

If you encounter any issues or have questions:

- 🐛 [Open an issue](https://github.com/MySagra/mycomanda/issues)
- 💬 Check existing issues for solutions
- 📧 Contact the MySagra team

---

<div align="center">

**Made with ❤️ by the MySagra Team**

[⬆ Back to Top](#-mycomanda)

</div>
