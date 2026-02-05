# Publishing Your NASA Weather AI App

This application is built with **React** and **Vite**. You can publish it for free using services like Vercel, Netlify, or GitHub Pages.

## Option 1: Vercel (Recommended - Easiest)

1.  **Create a GitHub Repository**:
    *   Go to GitHub.com and create a new repository (e.g., `nasa-weather-app`).
    *   Push your code to this repository.

2.  **Sign up for Vercel**:
    *   Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.

3.  **Import Project**:
    *   Click "Add New..." -> "Project".
    *   Select your `nasa-weather-app` repository.

4.  **Configure Project**:
    *   **Framework Preset**: Select `Vite` (Vercel usually detects this automatically).
    *   **Root Directory**: `./` (Default).
    *   **Build Command**: `npm run build` (Default).
    *   **Output Directory**: `dist` (IMPORTANT: Ensure this is set to `dist`. If it defaults to `public`, change it).
    
    *   **Environment Variables** (Required):
        *   **Name**: `API_KEY`
        *   **Value**: (Paste your Google Gemini API Key here)

5.  **Deploy**:
    *   Click "Deploy". Vercel will build your site.

### Troubleshooting "Page Not Found" (404)
If you see a 404 error after deploying:
1.  **Check Output Directory**: Go to your Vercel Project Settings -> Build & Development. Ensure **Output Directory** is set to `dist`.
2.  **vercel.json**: We have added a `vercel.json` file to the project. Ensure this file is pushed to your GitHub repository. It tells Vercel how to handle the application routing.

## Option 2: Netlify

1.  Push your code to GitHub.
2.  Log in to [netlify.com](https://netlify.com).
3.  Click "Add new site" -> "Import from existing project".
4.  Connect to GitHub and pick your repo.
5.  **Build Settings**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
6.  **Environment Variables**:
    *   Go to "Site settings" -> "Environment variables".
    *   Add `API_KEY` with your Gemini API key.
7.  Click "Deploy site".

## Running Locally

If you just want to run it on your machine:

1.  Open terminal in the project folder.
2.  Run `npm install`.
3.  Run `npm run dev`.
4.  Open the localhost link provided.
