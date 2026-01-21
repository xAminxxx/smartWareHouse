# 🚛 SmartWarehouse AI

> An AI-powered logistics management system that transforms camera images into intelligent warehouse decisions.

![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20Next.js%20%7C%20MySQL%20%7C%20Gemini-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Overview

SmartWarehouse AI is a complete logistics platform that handles both **inbound** (supplier deliveries) and **outbound** (client pickups) warehouse flows using computer vision and AI reasoning.

### Core Features

- 🎥 **Vision Pipeline**: YOLO-based license plate detection + Gemini OCR
- 🧠 **RAG Engine**: Context-aware decision making using ChromaDB
- 💬 **AI Chatbot**: Natural language order creation and tracking
- 📦 **Inventory Management**: Real-time stock tracking with alerts
- 🔐 **Role-Based Access**: Admin and Client dashboards

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js 15    │───▶│   FastAPI API    │───▶│  MySQL (Docker) │
│   (Frontend)    │    │   (Backend)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌──────────────┐    ┌──────────────┐
           │  Gemini API  │    │  ChromaDB    │
           │  (Vision+LLM)│    │  (RAG Store) │
           └──────────────┘    └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- Google Gemini API Key

### 1. Clone & Configure

```bash
git clone <repo-url>
cd smartWareHouse

# Copy environment template
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start Database

```bash
# Stop local MySQL if running
sudo systemctl stop mysql

# Start Docker containers
docker compose up -d db phpmyadmin
```

### 3. Start Backend

```bash
# Activate virtual environment
source /home/med-amin/envs/ml/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run FastAPI server
python main.py
```

### 4. Start Frontend

```bash
cd frontend
npm install  # First time only
npm run dev
```

### 5. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| phpMyAdmin | http://localhost:8080 |

## 👤 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smart.com | admin |
| Client | client@test.com | client |

## 📁 Project Structure

```
smartWareHouse/
├── main.py                 # FastAPI entry point
├── src/
│   ├── vision.py          # YOLO + Gemini OCR pipeline
│   ├── agent.py           # AI reasoning agent
│   ├── rag_engine.py      # ChromaDB RAG engine
│   └── database.py        # MySQL operations
├── data/                   # RAG knowledge base (markdown)
│   ├── clients/
│   ├── inventory/
│   ├── orders/
│   ├── policies/
│   └── suppliers/
├── frontend/               # Next.js 15 application
│   └── src/
│       ├── app/           # App router pages
│       ├── lib/           # Utilities (api, auth)
│       └── components/    # Reusable components
├── docker-compose.yml      # Database containers
├── requirements.txt        # Python dependencies
└── smartALPR_best.pt      # YOLO model weights
```

## 🔧 API Endpoints

### Vision & AI
- `POST /process-entrance` - Process vehicle image
- `POST /chatbot-order` - AI chatbot interaction

### Inventory
- `GET /inventory` - List all products
- `POST /inventory` - Add product
- `PUT /inventory/{id}` - Update product
- `DELETE /inventory/{id}` - Delete product

### Orders
- `GET /orders` - List all orders
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status

### Clients
- `GET /clients` - List all clients

### Chat Sessions
- `GET /chat-sessions/{user_id}` - Get user's chat sessions
- `GET /chat-messages/{session_id}` - Get session messages

## 🧪 Development Notes

### Database Schema

The system uses MySQL with the following key tables:
- `user` - Authentication
- `client` - Customer profiles
- `camion` - Vehicle registry
- `produit` - Inventory items
- `commande` - Orders (with quantity tracking)
- `chat_session` / `chat_message` - Conversation history

### RAG Knowledge Base

The AI uses markdown files in `/data/` for context:
- **policies/warehouse_logic.md** - Operational rules
- **clients/client_profiles.md** - Customer priorities
- **suppliers/supplier_profiles.md** - Vendor reliability
- **inventory/stock_levels.md** - Stock thresholds

To update the RAG index:
```bash
python src/rag_engine.py
```

## 📝 License

MIT License - see LICENSE file for details.
