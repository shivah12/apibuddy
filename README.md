# API Buddy

**API Buddy** is a lightweight web-based API testing tool built with React and Axios. It enables developers to construct and send HTTP requests directly from the browser, view formatted JSON responses, and debug endpoints in real-time without installing external software.

## Features

* Support for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, and more
* Custom request headers and JSON body input
* Clean and readable JSON response viewer with status codes
* Response time and network feedback display
* Plans for request history management using local storage
* Planned support for multi-tab request environments and token-based authentication

## Tech Stack

* **Frontend:** React, Tailwind CSS
* **HTTP Client:** Axios
* **State Management:** React Context (Zustand in future roadmap)
* **Deployment:** Vercel

## Getting Started

### Prerequisites

* Node.js (v16+ recommended)
* npm or yarn

### Installation

```bash
git clone https://github.com/shivah12/apibuddy.git
cd apibuddy
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser to use the tool locally.

## Deployment

This project is deployed using [Vercel](https://vercel.com). You can view the live version here:
**[https://apibuddy.vercel.app](https://apibuddy.vercel.app)**

## Roadmap

* Add request history panel with localStorage or database support
* Implement multiple request tab support
* Add Bearer token and API key auth input fields
* Optional user authentication using Supabase



Let me know if you'd like a short "How it works" diagram or want a blog post or case study based on this.
