import json
import os
import sys
import traceback

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.show = lambda *args, **kwargs: None

base_dir = r"d:\PYTHON\ZEROCODER\Last-term lectures"

notebooks = [
    ("Lecture9", "Lecture_9_Exercise_1_Linear_Model_Hand_on_Lab.ipynb", "Lecture9"),
    ("Lecture10", "Lecture_10_Exercise_1_Poly_Model_Hand_on_Lab.ipynb", "Lecture10"),
    ("Lecture10", "Lecture_10_Exercise_2_Understanding Logistic Regression.ipynb", "Lecture10"),
    ("Lecture11", "Lecture_11_Excercise_1_Model_Evaluation_and_Refinement.ipynb", "Lecture11"),
    ("Lecture12", "Lecture_12_Excercise_1_End_to_end_machine_learning_project.ipynb", "Lecture12"),
    ("Lecture12", "Lecture_12_Excercise_2_Association Rules Analysis.ipynb", "Lecture12"),
    ("Lecture12", "Lecture_12_Optional_Excercise_Statistic_and_Statistical_Inference.ipynb", "Lecture12"),
]

total_errors = 0

for lec, nb_file, work_dir in notebooks:
    nb_path = os.path.join(base_dir, lec, nb_file)
    cwd = os.path.join(base_dir, work_dir)
    print(f"\n=======================================================", flush=True)
    print(f"TESTING: [{lec}] {nb_file}", flush=True)
    print(f"Working Dir: {cwd}", flush=True)
    print(f"=======================================================", flush=True)
    
    with open(nb_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    glob_ns = {"__name__": "__main__"}
    os.chdir(cwd)
    
    nb_errors = 0
    for idx, cell in enumerate(nb.get("cells", [])):
        if cell.get("cell_type") != "code":
            continue
        src = "".join(cell.get("source", []))
        
        # Clean lines like in pyodide worker
        cleaned_lines = []
        for line in src.split("\n"):
            trimmed = line.strip()
            if trimmed.startswith("!") or trimmed.startswith("%"):
                cleaned_lines.append("# [stripped] " + line)
            else:
                cleaned_lines.append(line)
        cleaned_src = "\n".join(cleaned_lines)
        
        try:
            exec(cleaned_src, glob_ns)
        except Exception as e:
            nb_errors += 1
            total_errors += 1
            print(f"❌ [Cell {idx}] ERROR: {type(e).__name__}: {e}", flush=True)
            print(f"   Code preview:\n" + "\n".join("      " + l for l in src.strip().split("\n")[:4]), flush=True)
            print(f"   Traceback:\n" + "".join("      " + l for l in traceback.format_exc().splitlines(keepends=True)[-3:]), flush=True)
            
    if nb_errors == 0:
        print(f"✅ ALL cells in [{nb_file}] passed with 0 errors!", flush=True)
    else:
        print(f"⚠️ [{nb_file}] finished with {nb_errors} error(s).", flush=True)

print(f"\n=======================================================", flush=True)
print(f"TOTAL ERRORS ACROSS ALL NOTEBOOKS: {total_errors}", flush=True)
print(f"=======================================================", flush=True)
