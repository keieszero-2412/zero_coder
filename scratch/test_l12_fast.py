import json
import os
import sys
import time
import traceback

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.show = lambda *args, **kwargs: None

base_dir = r"d:\PYTHON\ZEROCODER\Last-term lectures\Lecture12"
nb_path = os.path.join(base_dir, "Lecture_12_Excercise_1_End_to_end_machine_learning_project.ipynb")

with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

glob_ns = {"__name__": "__main__"}
os.chdir(base_dir)

# Run cells 0 to 72 first
for idx, cell in enumerate(nb["cells"]):
    if cell.get("cell_type") != "code":
        continue
    if idx == 73:
        # Patch cell 73 to use cv=2 so it runs fast!
        print("  -> Cell 73 (fast cv=2)...", flush=True)
        src = """
from sklearn.model_selection import cross_val_score
rf_score = cross_val_score(RF_reg, housing_prepared, housing_target, scoring="neg_mean_squared_error", cv=2)
rf_rmse_scores = np.sqrt(-rf_score)
"""
    elif idx == 78:
        # Patch cell 78 to use 1 combination cv=2 so it runs in 0.5s!
        print("  -> Cell 78 (fast cv=2)...", flush=True)
        src = """
from sklearn.model_selection import GridSearchCV
Param_grid = [{'n_estimators': [3], 'max_features': [2]}]
forest_reg = RandomForestRegressor()
grid_search = GridSearchCV(forest_reg, Param_grid, cv=2, scoring='neg_mean_squared_error', return_train_score=True)
grid_search.fit(housing_prepared, housing_target)
"""
    else:
        src = "".join(cell.get("source", []))
    
    cleaned_lines = []
    for line in src.split("\n"):
        trimmed = line.strip()
        if trimmed.startswith("!") or trimmed.startswith("%") or trimmed.startswith("fig.show("):
            cleaned_lines.append("# [stripped] " + line)
        else:
            cleaned_lines.append(line)
    cleaned_src = "\n".join(cleaned_lines)
    
    try:
        t0 = time.time()
        exec(cleaned_src, glob_ns)
        dt = time.time() - t0
        if idx >= 70:
            print(f"Cell {idx} OK ({dt:.2f}s)", flush=True)
    except Exception as e:
        print(f"❌ Cell {idx} ERROR: {type(e).__name__}: {e}", flush=True)
        print(f"   Code preview:\n" + "\n".join("      " + l for l in src.strip().split("\n")[:4]), flush=True)
        print(f"   Traceback:\n" + "".join("      " + l for l in traceback.format_exc().splitlines(keepends=True)[-3:]), flush=True)

print("Finished testing L12 Ex 1!")
