import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold, cross_val_score, GridSearchCV
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import os

# Load data
DATA_FILE = 'Climate Dataset new.csv'
if not os.path.exists(DATA_FILE):
    print(f"Error: {DATA_FILE} not found!")
    exit(1)

df = pd.read_csv(DATA_FILE)

# Use correct column names
features = ['Temperature_Max (°C)', 'Temperature_Min (°C)', 'Humidity (%)', 
            'Rainfall (mm)', 'Wind_Speed (km/h)', 'AQI', 
            'Pressure (hPa)', 'Cloud_Cover (%)']
target = 'Temperature_Avg (°C)'

# Data Cleaning
for col in features + [target]:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(df[col].median())

X = df[features]
y = df[target]

# 1. Properly split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. Pipeline with Scaling and Regularization (Ridge)
# Ridge helps prevent overfitting by penalizing large coefficients (L2 Regularization)
pipeline = Pipeline([
    ('scaler', StandardScaler()), 
    ('model', Ridge())
])

# 3. Hyperparameter Tuning using GridSearchCV
param_grid = {
    'model__alpha': [0.01, 0.1, 1.0, 10.0, 100.0]
}
grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='r2')
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_

# 4. Cross-Validation Assessment
kf = KFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(best_model, X_train, y_train, cv=kf, scoring='r2')

# 5. Final Evaluation
train_score = best_model.score(X_train, y_train)
test_score = best_model.score(X_test, y_test)

with open('model_assessment.txt', 'w', encoding='utf-8') as f:
    f.write(f"Best Alpha: {grid_search.best_params_['model__alpha']}\n")
    f.write(f"Train R2: {train_score:.4f}\n")
    f.write(f"Test R2: {test_score:.4f}\n")
    f.write(f"CV Mean R2: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})\n")
    
    diff = train_score - test_score
    f.write(f"Train-Test Gap: {diff:.4f}\n")
    
    if diff > 0.05:
        f.write("Status: Potential Overfitting Detected. Try increasing Alpha or reducing features.\n")
    elif diff < 0:
        f.write("Status: Potential Underfitting. Try reducing Alpha.\n")
    else:
        f.write("Status: Model is well-generalized and stable.\n")

# Save the best model and features
joblib.dump(best_model, 'model.pkl')
joblib.dump(features, 'features.pkl')

print("Assessment & Training complete. Regularized model saved as model.pkl.")
