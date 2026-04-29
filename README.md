---

## 🚀 Getting Started

### Prerequisites

- **Java 21+** ([download](https://adoptium.net/))
- **Node.js 18+** ([download](https://nodejs.org/))
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop/))
- **Google Gemini API key** ([get one here](https://aistudio.google.com/app/apikey)) — free tier works

### 1. Clone the repository

```bash
git clone https://github.com/rtsh7609/codementor.git
cd codementor
```

### 2. Start the database

```bash
docker run --name codementor-postgres \
  -e POSTGRES_DB=codementor \
  -e POSTGRES_USER=codementor \
  -e POSTGRES_PASSWORD=codementor123 \
  -p 5433:5432 \
  -d postgres:16-alpine
```

### 3. Start the backend

```bash
cd backend
```

Set your Gemini API key as an environment variable:

**Windows (Command Prompt):**
```cmd
set GEMINI_API_KEY=your-actual-key-here
```

**macOS / Linux:**
```bash
export GEMINI_API_KEY=your-actual-key-here
```

Then run:

```bash
mvnw spring-boot:run
```

Backend will start on **http://localhost:8080**.

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on **http://localhost:5173**.

### 5. Open the app

Visit **http://localhost:5173** in your browser. Register an account and start submitting code for AI review!

---

## 🎯 Key Engineering Decisions

### Why a layered architecture?
Each layer (controller → service → repository → entity) has a single responsibility. The controller doesn't know about the database. The service doesn't know about HTTP. This makes the code easier to test, easier to extend, and matches the patterns used in production Java applications.

### Why structured JSON from Gemini?
Free-form LLM output is unpredictable and hard to display. By prompt-engineering Gemini to return strict JSON in a defined schema, the frontend can render bugs, suggestions, and complexity analysis in beautiful, dedicated components — instead of a single block of text.

### Why store the raw JSON response?
Even though we extract the score and summary into separate columns for fast queries, the full Gemini response is preserved in the `raw_json` column. This means we can always re-render the review with new UI improvements without re-calling the API.

### Why client-side search & filtering?
For the typical user (dozens, not thousands, of submissions), client-side filtering provides instant feedback with zero network calls. If the dataset grew large, the next step would be debounced server-side queries with pagination.

### Why Monaco Editor?
Users submit *code*, so the editor matters. Monaco is the same engine that powers VS Code — same syntax highlighting, same shortcuts, same comfort. It's free, well-maintained, and has a built-in side-by-side diff editor (used in the review view to compare original vs fixed code).

### Why bcrypt for passwords?
Bcrypt is deliberately slow and salts each password automatically — making brute-force attacks expensive. Even if the database is compromised, attacker still has to crack each hash individually.

### Why JWT (stateless) instead of sessions?
JWT tokens are self-contained and signed — every request carries proof of identity, no server-side session storage needed. This makes the API horizontally scalable and CSRF-resistant by default.

---

## 🌱 Why I Built This

I wanted to build something real — not another to-do app or weather widget. The goal: a full-stack project that touches every layer of a modern web application and integrates with a real-world AI service.

CodeMentor combines several technologies I genuinely wanted to learn deeply:
- **Spring Boot with Spring Security** — the framework that runs much of enterprise Java
- **JWT authentication done properly** — instead of copy-pasting from a tutorial
- **Working with LLM APIs** — particularly the challenge of getting predictable, structured output from a non-deterministic model
- **A frontend that doesn't look like a tutorial project** — design that respects the user

Building this end-to-end forced me to think through real engineering decisions: how to structure code for maintainability, how to handle errors gracefully, how to make the AI integration reliable despite occasional API failures, and how to build a UI that feels like a product instead of a demo.

---

## 🔮 Roadmap

Things I'd add next given more time:

- [ ] Docker Compose for one-command setup of the full stack
- [ ] Public deployment (Render or Railway for backend + Vercel for frontend)
- [ ] User dashboard with stats (avg score over time, languages used, streaks)
- [ ] Multiple reviews per submission (rerun with different model versions)
- [ ] GitHub OAuth login as an alternative to email/password
- [ ] Export reviews as PDF
- [ ] Rate limiting on review submission

---

## 📫 Connect

[GitHub: @rtsh7609](https://github.com/rtsh7609)

---

⭐ If you found this project interesting, consider giving it a star — it helps it reach others.