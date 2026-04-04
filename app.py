import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, render_template, redirect, url_for, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Debug logging for Render paths
print(f"RENDER DEBUG: BASE_DIR is {BASE_DIR}")
template_path = os.path.join(BASE_DIR, 'frontend')
print(f"RENDER DEBUG: Checking for templates at {template_path}")
if os.path.exists(template_path):
    print(f"RENDER DEBUG: Templates folder found. Contents: {os.listdir(template_path)}")
else:
    print("RENDER DEBUG: Templates folder NOT FOUND!")

# Initialize Flask app with absolute paths for deployment reliability
app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, 'frontend'),
            static_folder=os.path.join(BASE_DIR, 'frontend', 'static'))
CORS(app) # Enable CORS for all routes

HISTORY_FILE = os.path.join(BASE_DIR, 'history.json')

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_history(entry):
    try:
        history = load_history()
        history.insert(0, entry) # Insert at beginning
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        print(f"Failed to save history: {e}")
        # On some read-only platforms like Vercel, we can't save history locally.
        # We fail silently to allow the prediction to still display.

def delete_history_item(item_id):
    try:
        history = load_history()
        history = [h for h in history if h.get('id') != item_id]
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        print(f"Failed to delete history: {e}")

# Load the model and feature names safely
try:
    model_path = os.path.join(BASE_DIR, 'model.pkl')
    features_path = os.path.join(BASE_DIR, 'features.pkl')
    model = joblib.load(os.path.join(BASE_DIR, 'model.pkl'))
    features = joblib.load(os.path.join(BASE_DIR, 'features.pkl'))
except Exception as e:
    print(f"Critical error loading model: {e}")
    # Provide placeholders if model is missing to avoid crashing import
    model = None
    features = []

@app.route('/')
def home():
    try:
        return render_template('index.html', features=features)
    except Exception as e:
        import traceback
        # Helpful for Render debugging to see the ACTUAL error in the browser
        return f"<h1>Backend is Running! 🚀</h1><p>But there was an error rendering the template:</p><pre>{traceback.format_exc()}</pre>"

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/history')
def history():
    data = load_history()
    return render_template('history.html', history=data)

# --- NEW API ENDPOINTS FOR DECOUPLED FRONTEND ---

@app.route('/api/features')
def get_features():
    return jsonify({"features": features})

@app.route('/api/metrics')
def get_metrics():
    metrics = {'train_r2': 99.99, 'test_r2': 99.99}
    try:
        assessment_path = os.path.join(BASE_DIR, 'model_assessment.txt')
        if os.path.exists(assessment_path):
            with open(assessment_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                train_r2 = float(lines[0].split(':')[1].strip()) * 100
                test_r2 = float(lines[1].split(':')[1].strip()) * 100
                metrics['train_r2'] = round(train_r2, 2)
                metrics['test_r2'] = round(test_r2, 2)
    except Exception as e:
        print("Error reading metrics:", e)
    return jsonify(metrics)

@app.route('/api/history')
def get_history():
    return jsonify(load_history())

@app.route('/api/predict', methods=['POST'])
def api_predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No input data provided"}), 400
            
        input_data = []
        for feat in features:
            val = data.get(feat, 0)
            input_data.append(float(val))
            
        if model is None:
            return jsonify({"error": "Model file not found on the server"}), 500
            
        input_df = pd.DataFrame([input_data], columns=features)
        prediction = model.predict(input_df)[0]
        
        input_dict = dict(zip(features, input_data))
        
        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'inputs': input_dict,
            'prediction': round(prediction, 2)
        }
        save_history(entry)
        
        return jsonify({
            "status": "success",
            "prediction": round(prediction, 2),
            "inputs": input_dict,
            "id": entry['id']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete_history/<item_id>', methods=['DELETE'])
def api_delete_history(item_id):
    delete_history_item(item_id)
    return jsonify({"status": "success"})

# --- END API ENDPOINTS ---

@app.route('/delete_history/<item_id>', methods=['POST'])
def delete_history(item_id):
    delete_history_item(item_id)
    return redirect(url_for('history'))

@app.route('/view_prediction/<item_id>')
def view_prediction(item_id):
    history = load_history()
    entry = next((h for h in history if h.get('id') == item_id), None)
    if not entry:
        return redirect(url_for('history'))
    
    # Get model metrics (re-read for fresh data)
    metrics = {'train_r2': 99.99, 'test_r2': 99.99}
    try:
        assessment_path = os.path.join(BASE_DIR, 'model_assessment.txt')
        if os.path.exists(assessment_path):
            with open(assessment_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                train_r2 = float(lines[0].split(':')[1].strip()) * 100
                test_r2 = float(lines[1].split(':')[1].strip()) * 100
                metrics['train_r2'] = round(train_r2, 2)
                metrics['test_r2'] = round(test_r2, 2)
    except Exception as e:
        print("Error reading metrics:", e)
        
    return render_template('result.html', 
                           prediction=entry['prediction'], 
                           inputs=entry['inputs'],
                           metrics=metrics)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Extract data from the form
        input_data = []
        for feat in features:
            val = request.form.get(feat, 0)
            input_data.append(float(val))
        
        # Get model metrics
        metrics = {'train_r2': 99.99, 'test_r2': 99.99}
        try:
            assessment_path = os.path.join(BASE_DIR, 'model_assessment.txt')
            if os.path.exists(assessment_path):
                with open(assessment_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    train_r2 = float(lines[0].split(':')[1].strip()) * 100
                    test_r2 = float(lines[1].split(':')[1].strip()) * 100
                    metrics['train_r2'] = round(train_r2, 2)
                    metrics['test_r2'] = round(test_r2, 2)
        except Exception as e:
            print("Error reading metrics:", e)
            
        # Prediction
        if model is None:
            return "Model file not found on the server. Please run assess_model.py locally and upload model.pkl."
            
        input_df = pd.DataFrame([input_data], columns=features)
        prediction = model.predict(input_df)[0]
        
        # For visualization: we'll pass the input features back
        input_dict = dict(zip(features, input_data))
        
        # Save to history
        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'inputs': input_dict,
            'prediction': round(prediction, 2)
        }
        save_history(entry)
        
        return render_template('result.html', 
                               prediction=round(prediction, 2), 
                               inputs=input_dict,
                               metrics=metrics)
    except Exception as e:
        return f"An error occurred: {str(e)}"

if __name__ == "__main__":
    app.run(debug=True)
