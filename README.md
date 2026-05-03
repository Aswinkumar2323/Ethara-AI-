# Ethara-AI: Modern Team Task Manager

Ethara-AI is a state-of-the-art, full-stack team task management application designed with a focus on high-performance, security, and a premium user experience. Built with a robust **Node.js/Express** backend and a dynamic **React/Vite** frontend, it leverages **Prisma ORM** for seamless database management and **Railway** for reliable production deployments.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🚀 Key Features

- **🔐 Secure Authentication**: Robust user registration and login system utilizing JWT (JSON Web Tokens) and Bcrypt password hashing.
- **📊 Interactive Dashboard**: Real-time overview of task statistics including Todo, In Progress, Done, and Overdue tracking.
- **📂 Project Management**: Create and manage multiple projects, each with its own isolated environment and team members.
- **✅ Dynamic Task Board**: Kanban-style task management allowing status updates, assignments, and due date tracking.
- **👥 Team Collaboration**: Add members to projects via email and manage roles (Admin/Member) to control access.
- **🎨 Premium UI/UX**: A modern, glassmorphic design system built for clarity, speed, and responsiveness.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
- **Styling**: Modern CSS with Glassmorphism principles
- **Icons**: [Lucide React](https://lucide.dev/)
- **Networking**: [Axios](https://axios-http.com/)
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: JWT & Bcrypt

### DevOps & Deployment
- **Platform**: [Railway](https://railway.app/)
- **CI/CD**: GitHub Integration
- **Containerization**: Nixpacks / Railpack

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Aswinkumar2323/Ethara-AI-.git
cd Ethara-AI-
```

### 2. Install Dependencies
Install dependencies for both the root and sub-packages:
```bash
npm install
```
*(This triggers a custom `install` and `postinstall` script to set up both frontend and backend automatically.)*

### 3. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-secure-secret-key"
PORT=5000
```

### 4. Database Setup
Synchronize the Prisma schema with your database:
```bash
npx prisma db push
```

### 5. Running Locally
Start the development server for both frontend and backend:
```bash
# From the root directory
npm run dev
```

---

## 📁 Project Structure

```text
Ethara-AI/
├── backend/            # Express server & API routes
│   ├── src/            # TypeScript source code
│   └── dist/           # Compiled JavaScript
├── frontend/           # React application
│   ├── src/            # Components, Pages, Context
│   └── dist/           # Production build
├── prisma/             # Database schema & migrations
├── Procfile            # Deployment configuration
└── railway.json        # Infrastructure configuration
```

---

## 🛡️ Security Best Practices
- **Passwords**: Never stored in plain text; hashed with Bcrypt (salt rounds: 10).
- **API Security**: Protected routes require valid JWT tokens.
- **CORS**: Configured to restrict cross-origin requests to trusted domains.
- **Robustness**: Implemented global error handlers to prevent silent crashes and data leaks.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Developed with ❤️ by [Aswin Kumar](https://github.com/Aswinkumar2323)**
