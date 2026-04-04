# Live Link: https://linear-regression-model-climate-deployed-on-internet-9nzzhgkhd.vercel.app

# 🌩 AtmosAI — Premium Climate Intelligence Engine

**AtmosAI** is a high-accuracy climate prediction platform that leverages Linear Regression to estimate average temperatures based on 8 key meteorological parameters. It features a stunning, premium dark-themed "Glassmorphism" UI with advanced weather animations including drifting clouds, subtle rain, and random lightning flashes.

![AtmosAI Preview](static/css/images/login_page_mockup.png) <!-- Note: Replace with actual screenshot path if available -->

## ✨ Core Features

- **🚀 Advanced Prediction Engine:** Uses a serialized scikit-learn Linear Regression model trained on real-world climate data.
- **🕒 Prediction History Dashboard:** Save every analysis you run. View historical reports with detailed input/output breakdowns or delete entries you no longer need.
- **📊 Interactive Data Visualization:** Dynamic feature distribution charts powered by **Chart.js**.
- **📡 Real-time Model Accuracy:** Displays both Training and Test R² scores onEvery result page ensures data transparency.
- **☁️ Atmospheric UI/UX:**
  - **Dynamic Backgrounds:** Drifting nebulous blobs and CSS-animated floating clouds.
  - **Weather Particles:** Responsive CSS rain drizzle with varied speeds.
  - **Lightning Engine:** Randomly triggered JavaScript lightning flashes with SVG bolt streaks.
  - **Smooth Transitions:** Custom-built page loader and field-stagger animations.

## 🛠 Tech Stack

- **Backend:** Flask (Python)
- **Machine Learning:** Scikit-learn, Pandas, Joblib
- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **Charts:** Chart.js

## 📥 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/AtmosAI.git
   cd AtmosAI
   ```

2. **Set up a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Prepare the model (if needed):**
   If `model.pkl` and `features.pkl` are not present, run the assessment script first:
   ```bash
   python assess_model.py
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open in Browser:**
   Navigate to `http://127.0.0.1:5000`

## 🌦 Input Parameters

The model accepts 8 meteorological inputs:
- **Max Temp (°C)**
- **Min Temp (°C)**
- **Humidity (%)**
- **Rainfall (mm)**
- **Wind Speed (km/h)**
- **AQI (Air Quality Index)**
- **Pressure (hPa)**
- **Cloud Cover (%)**

## 📂 Project Structure

- `app.py`: Main Flask server and routing logic.
- `assess_model.py`: Training script and model persistence logic.
- `templates/`: HTML5 templates (Index, Result, About, History).
- `static/`: CSS styling, JavaScript animations, and images.
- `model.pkl`: Serialized Linear Regression model.
- `history.json`: Local storage for prediction logs.

---
Developed with ❤️ by **AtmosAI Team** — *2026 Climate Intelligence Platform*
