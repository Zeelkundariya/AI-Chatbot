# Deployment Guide 🚀

Your **Study Bot Elite** is ready for the world! Follow these steps to host your project for submission:

## 1. Backend (Render.com)
1.  Sign in to [Render.com](https://render.com).
2.  Create a **New Web Service** and connect your GitHub repo.
3.  Choose the `backend` folder as the root.
4.  Configure Environment Variables:
    - `GROQ_API_KEY`: Your Groq API Key.
    - `MONGO_URI`: Your MongoDB connection string.
    - `SECRET_KEY`: Any random string for security.

## 2. Frontend (Render.com or Vercel)
1.  Create a **New Static Site**.
2.  Build Command: `npm run build`
3.  Publish Directory: `dist`
4.  Environment Variable:
    - `VITE_BACKEND_URL`: The URL of your live backend (once it's running).

## 3. Submission Artifacts
- **Hosted API Link**: The URL Render gives your backend.
- **GitHub Repo**: Push all your local changes to your repo!
- **Screenshots**: Use the backend's `/docs` page to show your API works.

Good luck with your submission on February 22nd! 🎓✨
