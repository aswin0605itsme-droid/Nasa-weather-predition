# 🛰️ NASA Weather Intelligence Dashboard
### **1st Year B.E. Computer Science Project | Vel Tech Multi Tech College**

A high-performance weather prediction dashboard built using **24 years of NASA POWER meteorological data** and the **Google Gemini API**. This project leverages modern frontend architecture and statistical preprocessing to provide hyper-accurate temperature forecasts.

---

## 🚀 The Core Problem & Solution
Most basic weather models suffer from **"Mean Reversion,"** where the model predicts the average temperature (e.g., $9^\circ\text{C}$) rather than seasonal peaks ($22\text{-}30^\circ\text{C}$). 

**How I fixed it:**
* **Cyclical Time Encoding:** Converted dates into Sine/Cosine waves so the AI understands that December and January are seasonally linked.
* **Sliding Window Logic:** The model processes a 7-day "lookback" period to predict the 8th day.
* **MinMax Scaling:** Implemented mathematical normalization to keep data within a $0\text{-}1$ range, preventing weight collapse.

---

## ✨ Features
* **Bento Grid UI:** A modular, modern layout for data density and clarity.
* **Glassmorphism Design:** Immersive blur effects and deep blue gradients.
* **Real-time AI Analysis:** Uses Google Gemini Pro to interpret historical patterns.
* **Framer Motion:** Smooth, staggered entrance animations.

---

## 🛠️ Tech Stack
* **Framework:** [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **AI Engine:** [Google Gemini API](https://ai.google.dev/)
* **Deployment:** [Vercel](https://vercel.com/)

---

## 🎓 Learning Outcomes (Project Viva Prep)
1.  **Data Preprocessing:** Mastered the conversion of Kelvin to Celsius and the implementation of MinMax scaling for neural network stability.
2.  **State Management:** Managed complex API states using React Hooks (`useState`, `useEffect`) to handle 24 years of data points efficiently.
3.  **Modern CI/CD:** Successfully automated the deployment pipeline using GitHub and Vercel.
4.  **UI/UX Principles:** Applied Glassmorphism and CSS Grid (Bento layout) to create a professional-grade dashboard.

---

## 📦 Local Setup

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/aswin0605itsme-droid/Nasa-weather-predition.git
    cd Nasa-weather-predition
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file:
    ```env
    VITE_API_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 👨‍💻 Author
**Aswin R** *1st Year B.E. CSE Student* *Vel Tech Multi Tech College*
