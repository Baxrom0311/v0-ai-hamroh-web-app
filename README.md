# AI Hamroh Frontend

Next.js frontend for the AI Hamroh MVP. It connects to the FastAPI backend on port `8000`.

## Run Locally

From the project root, start the backend:

```bash
./run_demo.sh
```

Then start the frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Default value:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Demo Accounts

```text
Patient: +998901111111 / demo1234
Family:  +998902222222 / demo1234
Doctor:  +998903333333 / demo1234
```

## Checks

```bash
pnpm lint
pnpm build
```
