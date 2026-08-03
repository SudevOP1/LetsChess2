# LetsChess2

LetsChess2 is a fullstack real-time multiplayer chess platform.

[View Live](https://sudevop1.github.io/LetsChess2/)

## Table Of Contents

- [Architecture](#️-architecture)
- [Tech Stacks](#️-tech-stacks)
- [Website Design](#-website-design)
- [How to run it locally](#-how-to-run-it-locally)

## ⚙️ Architecture

![Architecture Diagram](https://raw.githubusercontent.com/SudevOP1/LetsChess2/main/Architecture_Diagram_dark.png)<br>
<br>

## 🛠️ Tech Stacks

- **Frontend**: `React` + `Tailwind CSS`
- **Backend**: `FastAPI`
- **Database**: `MongoDB`
  <br>

## ✨ Website Design

![Example](https://raw.githubusercontent.com/SudevOP1/LetsChess2/main/Implementation.png)<br>
<br>

## 🚀 How to run it locally

### 1. Clone the repo

```powershell
git clone https://github.com/SudevOP1/LetsChess2.git
cd LetsChess2
```

### 2. Backend Server

- Create & Setup Virtual Environment

  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```

- Install Dependencies

  ```powershell
  pip install -r requirements.txt
  ```

- Set up environment variables by creating a .env file in the `apps/backend`:

  ```
  MONGO_DB_URI=
  JWT_SECRET=
  ```

- Run Server

  ```powershell
  cd apps/backend
  uvicorn main:app --reload
  ```

### 3. Frontend Server

- Navigate to the frontend directory

  ```
  cd apps/frontend
  ```

- Install Dependencies

  ```powershell
  npm i
  ```

- Run Server
  ```powershell
  npm run dev
  ```

### 4. See the magic happen

Open `http://localhost:5173/LetsChess2` in your browser<br>
