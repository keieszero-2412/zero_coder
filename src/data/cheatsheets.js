// src/data/cheatsheets.js

export const CHEATSHEETS = {
  "Lecture5": {
    "lectureId": "Lecture5",
    "title": "Lecture 05: Data I/O & Database / API",
    "subtitle": "Syntax for CSV, Excel, JSON, SQL Databases, and REST APIs",
    "categories": [
      {
        "id": "csv",
        "name": "Read & Write CSV",
        "icon": "FileText",
        "items": [
          {
            "title": "Read basic CSV",
            "syntax": "pd.read_csv(\"path/to/filename.csv\")",
            "code": "import pandas as pd\ndf = pd.read_csv(\"data.csv\")\ndf.head()  # Preview first 5 rows",
            "description": "Loads a standard CSV file into a pandas DataFrame.",
            "note": "By default, the first row is used as the header."
          },
          {
            "title": "Read CSV without header & set column names",
            "syntax": "pd.read_csv(\"filename.csv\", header=None, names=[\"col_1\", \"col_2\", ...])",
            "code": "df = pd.read_csv(\"data.csv\", header=None, names=[\"id\", \"name\", \"score\"])",
            "description": "Loads CSV that has no header row and sets custom column names.",
            "note": "If names are not provided, pandas assigns numeric indices."
          },
          {
            "title": "Custom separator & set index column",
            "syntax": "pd.read_csv(\"filename.csv\", sep=\";\", index_col=\"id_col\", na_values=[\"?\", \"n/a\"])",
            "code": "df = pd.read_csv(\"data.csv\", sep=\";\", index_col=\"id\", na_values=[\"?\", \"N/A\"])",
            "description": "Loads file with custom separator (semicolon, tab) and specifies ID column.",
            "note": "na_values automatically converts specified strings to np.nan."
          },
          {
            "title": "Read specific columns & limit rows",
            "syntax": "pd.read_csv(\"filename.csv\", usecols=[\"col_A\", \"col_B\"], nrows=100)",
            "code": "df = pd.read_csv(\"data.csv\", usecols=[\"id\", \"salary\"], nrows=100)",
            "description": "Loads only select columns and first N rows to save memory.",
            "note": "nrows is useful for previewing dataset structure."
          },
          {
            "title": "Export DataFrame to CSV",
            "syntax": "df.to_csv(\"output_filename.csv\", index=False)",
            "code": "df.to_csv(\"clean.csv\", index=False)",
            "description": "Saves DataFrame to a CSV file (index=False prevents extra index column).",
            "note": "Set index=False to prevent saving row numbers as an extra column."
          }
        ]
      },
      {
        "id": "excel",
        "name": "Read & Write Excel",
        "icon": "Layers",
        "items": [
          {
            "title": "Read Excel file",
            "syntax": "pd.read_excel(\"filename.xlsx\", sheet_name=0)",
            "code": "df = pd.read_excel(\"data.xlsx\", sheet_name=0)",
            "description": "Loads a sheet from an Excel (.xlsx) file into a DataFrame.",
            "note": "Requires openpyxl library."
          },
          {
            "title": "Read specific sheet & skip rows",
            "syntax": "pd.read_excel(\"filename.xlsx\", sheet_name=\"SheetName\", skiprows=2)",
            "code": "df = pd.read_excel(\"filename.xlsx\", sheet_name=\"Data_Sheet\", skiprows=2)\nprint(df.head())",
            "description": "Specify sheet name and skip initial metadata rows.",
            "note": "skiprows=N ignores the first N rows of the spreadsheet."
          },
          {
            "title": "Export data to Excel",
            "syntax": "df.to_excel(\"output_filename.xlsx\", sheet_name=\"Sheet1\", index=False)",
            "code": "df.to_excel(\"output.xlsx\", sheet_name=\"Sheet1\", index=False)",
            "description": "Saves DataFrame into an Excel file.",
            "note": "Use pd.ExcelWriter to save multiple sheets in one file."
          }
        ]
      },
      {
        "id": "json",
        "name": "Read JSON & HTML",
        "icon": "FileCode",
        "items": [
          {
            "title": "Read JSON file",
            "syntax": "pd.read_json(\"filename.json\", orient=\"records\")",
            "code": "df = pd.read_json(\"data.json\", orient=\"records\")",
            "description": "Loads JSON records or objects directly into a DataFrame.",
            "note": "orient options include \"records\", \"split\", \"index\", \"columns\", \"values\"."
          },
          {
            "title": "Export data to JSON",
            "syntax": "df.to_json(\"output_filename.json\", orient=\"records\", indent=2)",
            "code": "df.to_json(\"output.json\", orient=\"records\", indent=2)",
            "description": "Converts DataFrame into JSON string or file.",
            "note": "force_ascii=False correctly displays UTF-8 characters."
          },
          {
            "title": "Read HTML table",
            "syntax": "dfs = pd.read_html(url_or_html)",
            "code": "tables = pd.read_html(\"https://example.com/data\")\ndf = tables[0]  # First table on page",
            "description": "Scrapes and parses all <table> tags from a URL into DataFrames.",
            "note": "Returns a list of DataFrames. Use dfs[0] for the first table."
          }
        ]
      },
      {
        "id": "database",
        "name": "SQL Database Connection",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Initialize MSSQL connection",
            "syntax": "conn = pymssql.connect(server=..., user=..., password=..., database=...)",
            "code": "import pymssql\nconn = pymssql.connect(server=\"localhost\", user=\"sa\", password=\"pwd\", database=\"mydb\")",
            "description": "Creates database connection to Microsoft SQL Server via pymssql.",
            "note": "Always call conn.close() after executing queries."
          },
          {
            "title": "Query SQL to DataFrame",
            "syntax": "df = pd.read_sql(sql_query, conn)",
            "code": "df = pd.read_sql(\"SELECT * FROM users WHERE active = 1\", conn)",
            "description": "Load data directly from a database into Pandas.",
            "note": "Automatically maps SQL data types to Pandas columns."
          },
          {
            "title": "Manual cursor query",
            "syntax": "cursor = conn.cursor(); cursor.execute(query); cursor.fetchall()",
            "code": "cursor.execute(\"SELECT COUNT(*) FROM table_name\")\ntotal_count = cursor.fetchone()[0]",
            "description": "Used for executing INSERT, UPDATE, DELETE or fetching single values.",
            "note": "Remember to close both cursor and connection."
          }
        ]
      },
      {
        "id": "api",
        "name": "REST API Requests",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Send basic HTTP GET request",
            "syntax": "response = requests.get(api_url, params={\"key\": \"val\"})",
            "code": "import requests\nres = requests.get(\"https://api.example.com/data\", params={\"limit\": 10})\ndata = res.json() if res.status_code == 200 else None",
            "description": "Fetches data from a REST API endpoint via HTTP GET.",
            "note": "Status 200 is success, 404 is not found, 429 is rate limit exceeded."
          },
          {
            "title": "Convert JSON API to DataFrame",
            "syntax": "df = pd.json_normalize(response_json[\"results\"])",
            "code": "df = pd.json_normalize(data[\"results\"])",
            "description": "Normalizes nested JSON API responses into a flat 2D DataFrame.",
            "note": "json_normalize efficiently handles multi-level nested objects."
          }
        ]
      }
    ]
  },
  "Lecture6": {
    "lectureId": "Lecture6",
    "title": "Lecture 06: Data Processing & Wrangling",
    "subtitle": "Data cleaning, missing values, scaling, and one-hot encoding",
    "categories": [
      {
        "id": "overview",
        "name": "Observation & Statistics",
        "icon": "FileText",
        "items": [
          {
            "title": "Check columns & data types",
            "syntax": "df.info()",
            "code": "df.info()  # Non-null counts, column names, and dtypes",
            "description": "Display non-null counts, column names, and data types.",
            "note": "Quickly identifies columns with missing data."
          },
          {
            "title": "Descriptive statistics",
            "syntax": "df.describe() | df.describe(include=\"all\")",
            "code": "df.describe()  # count, mean, std, min, 25%, 50%, 75%, max\ndf.describe(include=\"all\")  # includes categorical unique & freq",
            "description": "Calculate count, mean, std, min, percentiles, and max.",
            "note": "String columns include unique count, top value, and frequency."
          },
          {
            "title": "Value frequency count",
            "syntax": "df[\"column_name\"].value_counts()",
            "code": "df[\"category\"].value_counts()  # Counts per category\ndf[\"category\"].value_counts(normalize=True)  # Percentages",
            "description": "Count occurrences of categorical values.",
            "note": "Useful for finding the mode to fill missing values."
          },
          {
            "title": "Filtering & indexing",
            "syntax": "df[df[\"col_A\"] > val] | df.iloc[rows, cols] | df.loc[rows, cols]",
            "code": "df[(df[\"age\"] > 25) & (df[\"status\"] == \"active\")]  # Logical condition\ndf.iloc[0:5, 0:3]  # First 5 rows, first 3 columns by index",
            "description": "Extract rows based on logic conditions or index.",
            "note": "Use & for AND, | for OR, and wrap conditions in parentheses."
          }
        ]
      },
      {
        "id": "missing",
        "name": "Handle Missing Data",
        "icon": "Layers",
        "items": [
          {
            "title": "Detect missing values",
            "syntax": "df.isnull().sum() or df.isna().sum()",
            "code": "df.isnull().sum()  # Count missing values per column",
            "description": "Finds and counts missing (NaN/null) values in each column.",
            "note": "Replace garbage characters like \"?\" or \"N/A\" with np.nan first."
          },
          {
            "title": "Drop missing rows/columns",
            "syntax": "df.dropna(subset=[\"col_name\"], axis=0, inplace=True)",
            "code": "df.dropna(subset=[\"target_col\"], inplace=True)\ndf.reset_index(drop=True, inplace=True)",
            "description": "Remove rows if target columns contain missing data.",
            "note": "axis=0 drops rows, axis=1 drops columns. drop=True resets index."
          },
          {
            "title": "Impute with Mean",
            "syntax": "df[\"col_name\"].fillna(mean_val, inplace=True)",
            "code": "mean_val = df[\"score\"].mean()\ndf[\"score\"].fillna(mean_val, inplace=True)",
            "description": "Standard method to fill missing continuous numerical data.",
            "note": "Use Median instead of Mean if data contains extreme outliers."
          },
          {
            "title": "Impute with Mode",
            "syntax": "mode_val = df[\"col_name\"].value_counts().idxmax()",
            "code": "mode_val = df[\"category\"].mode()[0]\ndf[\"category\"].fillna(mode_val, inplace=True)",
            "description": "Standard method to fill categorical data.",
            "note": "idxmax() returns the index label with the highest count."
          }
        ]
      },
      {
        "id": "casting",
        "name": "Type Casting",
        "icon": "FileCode",
        "items": [
          {
            "title": "Type casting",
            "syntax": "df[\"col_name\"] = df[\"col_name\"].astype(\"type\")",
            "code": "df[\"score\"] = df[\"score\"].astype(\"float\")\ndf[\"id\"] = df[\"id\"].astype(\"int\")",
            "description": "Convert columns to proper numeric or string types.",
            "note": "Columns with NaN cannot be converted to int directly."
          },
          {
            "title": "Data transformation",
            "syntax": "df[\"new_col\"] = formula(df[\"old_col\"])",
            "code": "df[\"km\"] = df[\"miles\"] * 1.60934  # Imperial to metric\ndf[\"efficiency\"] = 235 / df[\"mpg\"]  # Formula transform",
            "description": "Standardize metrics to standard measurement units.",
            "note": "Operators are vectorized across the entire Series."
          }
        ]
      },
      {
        "id": "scaling",
        "name": "Feature Scaling",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Simple feature scaling",
            "syntax": "df[\"col\"] = df[\"col\"] / df[\"col\"].max()",
            "code": "df[\"feature_col\"] = df[\"feature_col\"] / df[\"feature_col\"].max()",
            "description": "Scale values to 0-1 range by dividing by the max value.",
            "note": "Simple but sensitive to outliers."
          },
          {
            "title": "Min-Max scaling",
            "syntax": "df[\"col\"] = (df[\"col\"] - min) / (max - min)",
            "code": "col_min = df[\"feature_col\"].min()\ncol_max = df[\"feature_col\"].max()\ndf[\"feature_col\"] = (df[\"feature_col\"] - col_min) / (col_max - col_min)",
            "description": "Scale range strictly to 0-1.",
            "note": "Often used for ML algorithms like KNN and Neural Networks."
          },
          {
            "title": "Z-Score normalization",
            "syntax": "df[\"col\"] = (df[\"col\"] - mean) / std",
            "code": "col_mean = df[\"feature_col\"].mean()\ncol_std = df[\"feature_col\"].std()\ndf[\"feature_col\"] = (df[\"feature_col\"] - col_mean) / col_std",
            "description": "Standardize distribution to mean 0 and standard deviation 1.",
            "note": "Best suited for Linear Regression and SVM models."
          }
        ]
      },
      {
        "id": "encoding",
        "name": "Binning & Dummy Variables",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Binning numerical values",
            "syntax": "pd.cut(df[\"col\"], bins, labels=labels, include_lowest=True)",
            "code": "bins = [0, 18, 65, 100]; labels = [\"Child\", \"Adult\", \"Senior\"]\ndf[\"age_group\"] = pd.cut(df[\"age\"], bins=bins, labels=labels)",
            "description": "Groups continuous numbers into discrete categorical intervals (bins).",
            "note": "N bins require N+1 split points."
          },
          {
            "title": "One-Hot encoding",
            "syntax": "pd.get_dummies(df[\"category_col\"], prefix=\"cat\")",
            "code": "pd.get_dummies(df, columns=[\"category\"], drop_first=True)",
            "description": "Converts categorical column into binary dummy columns (0 or 1).",
            "note": "Drop the original categorical column after concatenation."
          }
        ]
      }
    ]
  },
  "Lecture7": {
    "lectureId": "Lecture7",
    "title": "Lecture 07: Exploratory Data Analysis",
    "subtitle": "EDA techniques, Pearson correlation, ANOVA, and basic plots",
    "categories": [
      {
        "id": "grouping",
        "name": "GroupBy & Pivot",
        "icon": "Layers",
        "items": [
          {
            "title": "GroupBy analysis",
            "syntax": "df.groupby([\"col_1\", \"col_2\"], as_index=False)[\"target_col\"].mean()",
            "code": "# Group by categories and compute target mean\ndf_grp = df.groupby([\"group_col_1\", \"group_col_2\"], as_index=False)[\"numeric_target\"].mean()\nprint(df_grp)",
            "description": "Group data by categories and compute aggregates.",
            "note": "as_index=False keeps categorical columns as regular columns."
          },
          {
            "title": "Create pivot table",
            "syntax": "df_grp.pivot(index=\"col_1\", columns=\"col_2\", values=\"target\")",
            "code": "pivot = df.pivot_table(index=\"dept\", columns=\"year\", values=\"salary\", fill_value=0)",
            "description": "Reshape flat table into a 2D matrix to compare variables.",
            "note": "Easily combined with Heatmap visualizations."
          },
          {
            "title": "Heatmap visualization",
            "syntax": "sns.heatmap(pivot_table, annot=True, cmap=\"RdBu\")",
            "code": "import seaborn as sns\nsns.heatmap(df.corr(), annot=True, cmap=\"coolwarm\")",
            "description": "Visualizes correlation matrix as a colored heatmap.",
            "note": "annot=True shows numbers, fmt=\".1f\" rounds to 1 decimal."
          }
        ]
      },
      {
        "id": "correlation",
        "name": "Pearson Correlation & P-value",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Correlation matrix",
            "syntax": "df.corr(numeric_only=True)",
            "code": "corr = df.corr()  # Values between -1 and +1",
            "description": "Computes pairwise Pearson correlation coefficients between numerical columns.",
            "note": "numeric_only=True avoids errors with string columns."
          },
          {
            "title": "Pearson correlation & P-value",
            "syntax": "from scipy import stats; coef, p_val = stats.pearsonr(df[\"x\"], df[\"y\"])",
            "code": "from scipy import stats\nr, p = stats.pearsonr(df[\"feature_x\"], df[\"target_y\"])  # r: coeff, p: p-value",
            "description": "Test linear relationship and its statistical significance.",
            "note": "Pearson measures strength and direction. P-value tests randomness."
          },
          {
            "title": "Evaluate Pearson & P-value",
            "syntax": "Standard statistical criteria",
            "code": "from scipy.stats import pearsonr\ncoef, p_val = pearsonr(df[\"x\"], df[\"y\"])  # (correlation, p-value)",
            "description": "Calculates Pearson correlation coefficient and p-value statistical significance.",
            "note": "Select features when correlation is high and p-value < 0.001."
          }
        ]
      },
      {
        "id": "anova",
        "name": "ANOVA (Analysis of Variance)",
        "icon": "Bookmark",
        "items": [
          {
            "title": "One-way ANOVA",
            "syntax": "stats.f_oneway(group1, group2, ...)",
            "code": "from scipy.stats import f_oneway\nf_val, p_val = f_oneway(df[df.grp=='A'].val, df[df.grp=='B'].val)",
            "description": "Tests if means of two or more groups are statistically different.",
            "note": "Identifies which categorical variable has the strongest impact."
          },
          {
            "title": "Evaluate ANOVA results",
            "syntax": "Large F-score + Small P-value",
            "code": "# F-test high & p < 0.001: Strong difference between groups\n# F-test ~ 1 & p > 0.05: No difference between group means",
            "description": "Determine if a category is useful for deeper analysis.",
            "note": "High F-score across groups requires checking individual pairs."
          }
        ]
      },
      {
        "id": "visualization",
        "name": "Seaborn & Matplotlib Plots",
        "icon": "FileCode",
        "items": [
          {
            "title": "Regplot (Scatter + Regression)",
            "syntax": "sns.regplot(x=\"feature_x\", y=\"target_y\", data=df)",
            "code": "import seaborn as sns\nsns.regplot(x=\"engine_size\", y=\"price\", data=df)",
            "description": "Plots scatter plot with linear regression trend line and confidence interval.",
            "note": "Upward slope shows positive correlation, tight points mean strong correlation."
          },
          {
            "title": "Boxplot for categories",
            "syntax": "sns.boxplot(x=\"category_col\", y=\"numeric_target\", data=df)",
            "code": "sns.boxplot(x=\"category\", y=\"price\", data=df)\nplt.show()",
            "description": "View median, percentiles, and identify outliers.",
            "note": "Overlapping boxes mean the variable has poor predictive power."
          },
          {
            "title": "Residual plot",
            "syntax": "sns.residplot(x=df[\"feature_x\"], y=df[\"target_y\"])",
            "code": "sns.residplot(x=df[\"feature_x\"], y=df[\"target_y\"])\nplt.show()",
            "description": "Show deviation between actual values and linear predictions.",
            "note": "Randomly distributed residuals suggest a linear model is appropriate."
          }
        ]
      }
    ]
  },
  "Lecture8": {
    "lectureId": "Lecture8",
    "title": "Lecture 08: Advanced Data Visualization",
    "subtitle": "Line, Area, Histogram, Bar, Pie, Box, Scatter & Bubble Plots",
    "categories": [
      {
        "id": "line_area",
        "name": "Line & Area Plots",
        "icon": "Layers",
        "items": [
          {
            "title": "Single line plot",
            "syntax": "df.loc[row_label, time_cols].plot(kind=\"line\")",
            "code": "df[\"price\"].plot(kind=\"line\", title=\"Price Trend\")",
            "description": "Plots a simple 2D line graph over time or sequence.",
            "note": "Pandas uses time index for the x-axis automatically."
          },
          {
            "title": "Multi-line plot",
            "syntax": "df.loc[[item_A, item_B], time_cols].transpose().plot(kind=\"line\")",
            "code": "df.plot(kind=\"line\", x=\"year\", y=[\"series_A\", \"series_B\"])\nplt.show()",
            "description": "Plot multiple lines to compare trends.",
            "note": "Transpose data to make time points the x-axis index."
          },
          {
            "title": "Area plot",
            "syntax": "df.head(5)[time_cols].transpose().plot(kind=\"area\", alpha=0.45, stacked=False)",
            "code": "df[[\"sales\", \"profit\"]].plot(kind=\"area\", alpha=0.5)",
            "description": "Plots an area chart showing cumulative distribution.",
            "note": "alpha sets transparency when stacked=False."
          }
        ]
      },
      {
        "id": "bar_hist",
        "name": "Bar & Histogram Charts",
        "icon": "FileText",
        "items": [
          {
            "title": "Histogram",
            "syntax": "df[\"numeric_col\"].plot(kind=\"hist\", xticks=bin_edges)",
            "code": "df[\"age\"].plot(kind=\"hist\", bins=10, title=\"Age Distribution\")",
            "description": "Plots frequency distribution of a continuous numeric variable.",
            "note": "np.histogram accurately calculates bin edges for xticks."
          },
          {
            "title": "Vertical bar chart",
            "syntax": "df.loc[row_label, time_cols].plot(kind=\"bar\", figsize=(10, 6))",
            "code": "df[\"category\"].value_counts().plot(kind=\"bar\")\nplt.show()",
            "description": "Compare sizes among discrete categories.",
            "note": "Best when the number of categories is small."
          },
          {
            "title": "Horizontal bar chart",
            "syntax": "df[\"numeric_col\"].tail(15).plot(kind=\"barh\", figsize=(10, 8))",
            "code": "df[\"category\"].value_counts().tail(10).plot(kind=\"barh\", color=\"teal\")\nplt.show()",
            "description": "Best choice for long category names or many items.",
            "note": "Easy to read y-axis labels without tilting text."
          }
        ]
      },
      {
        "id": "pie_box",
        "name": "Pie & Box Plots",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Pie chart",
            "syntax": "df.groupby(\"cat_col\")[\"val_col\"].sum().plot(kind=\"pie\", autopct=\"%1.1f%%\")",
            "code": "df[\"category\"].value_counts().plot(kind=\"pie\", autopct=\"%1.1f%%\")",
            "description": "Plots a pie chart of categorical proportions.",
            "note": "pctdistance moves labels outward, startangle adjusts balance."
          },
          {
            "title": "Box plot",
            "syntax": "df.loc[[item_A, item_B], time_cols].transpose().plot(kind=\"box\", figsize=(8, 6))",
            "code": "df[[\"col_A\", \"col_B\"]].plot(kind=\"box\")\nplt.show()",
            "description": "Evaluate percentiles, spread, and identify outliers.",
            "note": "Dots outside the whiskers represent outliers."
          }
        ]
      },
      {
        "id": "scatter_bubble",
        "name": "Scatter & Bubble Plots",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Scatter plot",
            "syntax": "df.plot(kind=\"scatter\", x=\"numeric_x\", y=\"numeric_y\")",
            "code": "df.plot(kind=\"scatter\", x=\"engine_size\", y=\"price\")\nplt.show()",
            "description": "Observe correlation and variance between two continuous variables.",
            "note": "X and Y axes must be numeric."
          },
          {
            "title": "Fit linear trend line",
            "syntax": "fit = np.polyfit(x, y, deg=1); plt.plot(x, fit[0]*x + fit[1])",
            "code": "m, b = np.polyfit(df[\"x\"], df[\"y\"], deg=1)\nplt.plot(df[\"x\"], m * df[\"x\"] + b, color=\"red\")  # y = mx + b trend line",
            "description": "Estimate trends using a first-degree linear regression equation.",
            "note": "np.polyfit with deg=1 returns slope and intercept."
          },
          {
            "title": "Bubble plot",
            "syntax": "df.plot(kind=\"scatter\", x=\"x\", y=\"y\", s=weights)",
            "code": "df.plot(kind=\"scatter\", x=\"age\", y=\"fare\", s=df[\"pclass\"] * 50)",
            "description": "Scatter plot with 3rd dimension encoded by point size (bubble radius).",
            "note": "Normalize weights and multiply by a scale factor for visibility."
          }
        ]
      }
    ]
  },
  "Lecture9": {
    "lectureId": "Lecture9",
    "title": "Lecture 09: Linear Regression",
    "subtitle": "Simple and multiple regression, coefficients, and model evaluation",
    "categories": [
      {
        "id": "linear_models",
        "name": "Linear Regression",
        "icon": "Layers",
        "items": [
          {
            "title": "Simple linear regression",
            "syntax": "lm = LinearRegression(); lm.fit(X, Y)",
            "code": "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(df[[\"size\"]], df[\"price\"])\nmodel.predict([[120]])  # Predict price for size 120",
            "description": "Fits a straight line y = ax + b predicting target from 1 feature.",
            "note": "Input X must be 2D DataFrame, target Y must be a 1D Series."
          },
          {
            "title": "Multiple linear regression",
            "syntax": "lm.fit(df[[feat1, feat2, feat3]], df[target])",
            "code": "model = LinearRegression().fit(df[[\"size\", \"rooms\"]], df[\"price\"])",
            "description": "Fits linear model predicting target from multiple features.",
            "note": "lm.coef_ returns weights corresponding to each feature column."
          },
          {
            "title": "R-squared and Mean Squared Error (MSE)",
            "syntax": "r2 = lm.score(X, Y); mse = mean_squared_error(Y, y_hat)",
            "code": "from sklearn.metrics import r2_score, mean_squared_error\nr2 = r2_score(y_true, y_pred); mse = mean_squared_error(y_true, y_pred)",
            "description": "Evaluates regression model accuracy using R² score and MSE error.",
            "note": "Higher R² and lower MSE indicate a better fit with the data."
          }
        ]
      }
    ]
  },
  "Lecture10": {
    "lectureId": "Lecture10",
    "title": "Lecture 10: Polynomial & Logistic Regression",
    "subtitle": "Non-linear polynomial regression, Pipelines, and classification",
    "categories": [
      {
        "id": "poly_pipeline",
        "name": "Polynomial & Pipeline",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Polynomial features",
            "syntax": "PolynomialFeatures(degree=2).fit_transform(X)",
            "code": "from sklearn.preprocessing import PolynomialFeatures\nX_poly = PolynomialFeatures(degree=2, include_bias=False).fit_transform(X)",
            "description": "Create higher-degree and interaction variables to model curves.",
            "note": "High degree values can cause overfitting."
          },
          {
            "title": "Automated Pipeline (StandardScaler + Model)",
            "syntax": "Pipeline([(\"scale\", StandardScaler()), (\"model\", LinearRegression())])",
            "code": "from sklearn.pipeline import make_pipeline\npipe = make_pipeline(StandardScaler(), LinearRegression()).fit(X, y)",
            "description": "Chains preprocessing and model estimator into a single pipeline.",
            "note": "Pipelines automatically prevent data leakage by transforming test sets properly."
          }
        ]
      },
      {
        "id": "logistic_reg",
        "name": "Logistic Regression",
        "icon": "FileCode",
        "items": [
          {
            "title": "Binary classification training",
            "syntax": "log_reg = LogisticRegression(); log_reg.fit(X_train, y_train)",
            "code": "clf = LogisticRegression().fit(X_train, y_train)\ny_pred = clf.predict(X_test)\nacc = clf.score(X_test, y_test)  # Accuracy score",
            "description": "Predict probabilities and classify objects into 2 binary labels (0 or 1).",
            "note": "Use confusion_matrix to check true/false positives and negatives."
          }
        ]
      }
    ]
  },
  "Lecture11": {
    "lectureId": "Lecture11",
    "title": "Lecture 11: Model Evaluation & Refinement",
    "subtitle": "Data splitting, Cross Validation, and Ridge Regression",
    "categories": [
      {
        "id": "evaluation_refinement",
        "name": "Evaluation & Tuning",
        "icon": "Bookmark",
        "items": [
          {
            "title": "K-Fold Cross-Validation",
            "syntax": "cross_val_score(model, X, Y, cv=5, scoring=\"r2\")",
            "code": "from sklearn.model_selection import cross_val_score\nscores = cross_val_score(model, X, y, cv=5)  # 5-fold cross-val scores",
            "description": "Evaluates model across k distinct train/test splits.",
            "note": "Prevents results from depending on a single randomized train/test split."
          },
          {
            "title": "Ridge Regression",
            "syntax": "ridge = Ridge(alpha=1.0); ridge.fit(X, Y)",
            "code": "from sklearn.linear_model import Ridge\nridge = Ridge(alpha=1.0).fit(X, y)",
            "description": "Linear regression with L2 regularization penalty to prevent overfitting.",
            "note": "Larger alpha simplifies the model (increases bias, decreases variance)."
          }
        ]
      }
    ]
  },
  "Lecture12": {
    "lectureId": "Lecture12",
    "title": "Lecture 12: ML Project & Association Rules",
    "subtitle": "End-to-End ML projects, GridSearchCV, and Apriori algorithm",
    "categories": [
      {
        "id": "ml_project_gridsearch",
        "name": "ML Project & GridSearchCV",
        "icon": "Layers",
        "items": [
          {
            "title": "Hyperparameter tuning (GridSearchCV)",
            "syntax": "GridSearchCV(estimator, param_grid, cv=3)",
            "code": "from sklearn.model_selection import GridSearchCV\ngrid = GridSearchCV(model, {\"alpha\": [0.1, 1.0, 10.0]}, cv=3).fit(X, y)\ngrid.best_params_  # Best hyperparameter combination",
            "description": "Searches through parameter grid to find best model hyperparameters.",
            "note": "Use best_estimator_ to extract the optimized model for predictions."
          }
        ]
      },
      {
        "id": "association_rules",
        "name": "Association Rules (Apriori)",
        "icon": "FileText",
        "items": [
          {
            "title": "Frequent itemsets (Apriori)",
            "syntax": "frequent = apriori(df_onehot, min_support=0.01, use_colnames=True)",
            "code": "from mlxtend.frequent_patterns import apriori\nfrequent = apriori(df_encoded, min_support=0.05, use_colnames=True)",
            "description": "Finds frequent item combinations in market basket data.",
            "note": "Lift > 1 indicates that buying A significantly increases the likelihood of buying B."
          }
        ]
      }
    ]
  }
};

export const MIDTERM_CHEATSHEETS = {
  "Topic1": {
    "lectureId": "Topic1",
    "title": "Topic 1: Data Types, Operators & Strings",
    "subtitle": "Type conversion, arithmetic operations, slicing, and string manipulation methods",
    "categories": [
      {
        "id": "data_types",
        "name": "Data Types & Casting",
        "icon": "Layers",
        "items": [
          {
            "title": "Type Casting & Conversion",
            "syntax": "int(x), float(x), str(x), bool(x)",
            "code": "int(\"42\")      # 42\nfloat(\"3.14\")  # 3.14\nbool(0)        # False (0, \"\", [] are False)",
            "description": "Converts data between int, float, str, and bool.",
            "note": "Empty collections, 0, and None evaluate to False in bool()."
          },
          {
            "title": "Type Checking",
            "syntax": "type(x), isinstance(x, class_or_tuple)",
            "code": "isinstance([1, 2], list)  # True\ntype(42) is int           # True",
            "description": "Checks if a variable is an instance of a specific type.",
            "note": "Prefer isinstance() over type() as it supports inheritance and multiple types."
          }
        ]
      },
      {
        "id": "operators",
        "name": "Arithmetic & Math Operators",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Floor Division & Modulo",
            "syntax": "a // b, a % b",
            "code": "17 // 5  # 3 (quotient)\n17 % 5   # 2 (remainder)",
            "description": "// gives integer quotient; % gives remainder.",
            "note": "Useful for parity checks (x % 2 == 0) and digit extraction."
          },
          {
            "title": "Divmod Combined Operation",
            "syntax": "divmod(a, b)",
            "code": "q, r = divmod(17, 5)  # q = 3, r = 2",
            "description": "Returns (quotient, remainder) simultaneously in one operation.",
            "note": "Faster than calculating // and % separately in loops."
          },
          {
            "title": "Absolute Value & Rounding",
            "syntax": "abs(x), round(x, ndigits=None)",
            "code": "abs(-15.6)         # 15.6\nround(3.14159, 2)  # 3.14",
            "description": "abs() gives positive magnitude; round() rounds to n decimals.",
            "note": "Python uses bankers rounding (round-half-to-even) for ties."
          }
        ]
      },
      {
        "id": "string_slicing",
        "name": "String Slicing & Indexing",
        "icon": "FileCode",
        "items": [
          {
            "title": "String Indexing & Negative Indices",
            "syntax": "s[index]",
            "code": "s = \"Python\"\ns[0]   # 'P'\ns[-1]  # 'n'",
            "description": "Accesses characters by index (0 is first, -1 is last).",
            "note": "Strings in Python are immutable; s[0] = \"J\" raises TypeError."
          },
          {
            "title": "Substrings with Slicing",
            "syntax": "s[start:end:step]",
            "code": "\"Hello World\"[0:5]   # 'Hello'\n\"Hello World\"[::2]   # 'HloWrd'",
            "description": "Extracts portion of string [start:stop:step].",
            "note": "Omitted start defaults to 0; omitted end defaults to string length."
          },
          {
            "title": "Reverse String with Step -1",
            "syntax": "s[::-1]",
            "code": "\"mirror\"[::-1]       # 'rorrim'\ns == s[::-1]         # True if palindrome",
            "description": "Reverses string or checks if it is a palindrome.",
            "note": "The most idiomatic and fastest way to reverse a string in Python."
          }
        ]
      },
      {
        "id": "string_methods",
        "name": "String Methods",
        "icon": "FileText",
        "items": [
          {
            "title": "Split String into List",
            "syntax": "s.split(sep=None, maxsplit=-1)",
            "code": "\"a,b,c\".split(\",\")       # ['a', 'b', 'c']\n\"hello world\".split()    # ['hello', 'world']",
            "description": "Splits string by delimiter into a list of words.",
            "note": "s.split() with no argument collapses consecutive whitespaces."
          },
          {
            "title": "Join List into String",
            "syntax": "sep.join(iterable)",
            "code": "\"-\".join([\"2026\", \"09\", \"21\"])  # '2026-09-21'\n\" \".join([\"Hello\", \"World\"])     # 'Hello World'",
            "description": "Combines a list of strings into one string with separator.",
            "note": "All elements in the iterable must be strings, or convert with map(str, lst)."
          },
          {
            "title": "Strip Leading/Trailing Characters",
            "syntax": "s.strip(chars=None)",
            "code": "\"   hello   \".strip()       # 'hello'\n\"___data.csv___\".strip(\"_\") # 'data.csv'",
            "description": "Removes spaces or specified characters from both ends.",
            "note": "Use lstrip() for left side only, or rstrip() for right side only."
          },
          {
            "title": "Replace Substrings",
            "syntax": "s.replace(old, new, count=-1)",
            "code": "\"banana\".replace(\"a\", \"o\")  # 'bonono'",
            "description": "Replaces occurrences of old substring with new substring.",
            "note": "Optional count parameter limits the number of replacements."
          },
          {
            "title": "Count & Find Substrings",
            "syntax": "s.count(sub), s.find(sub)",
            "code": "\"banana\".count(\"an\")  # 2\n\"banana\".find(\"nan\")  # 2 (-1 if missing)",
            "description": "count() counts occurrences; find() returns first index (-1 if missing).",
            "note": "find() returns -1 when not found; index() raises ValueError."
          },
          {
            "title": "String Validation & Cases",
            "syntax": "s.isdigit(), s.isalpha(), s.lower(), s.upper()",
            "code": "\"123\".isdigit()  # True\n\"Py\".lower()     # 'py'\n\"py\".upper()     # 'PY'",
            "description": "Validates characters (digits, letters) or changes case.",
            "note": "Useful for input validation and case-insensitive comparisons."
          },
          {
            "title": "F-String Formatting",
            "syntax": "f\"...{expr:spec}...\"",
            "code": "name, pi = \"Pi\", 3.14159\nf\"{name} = {pi:.2f}\"  # 'Pi = 3.14'",
            "description": "Embeds variables and expressions directly inside strings.",
            "note": "Use :.2f for decimals, :03d for zero-padded integers."
          }
        ]
      }
    ]
  },
  "Topic2": {
    "lectureId": "Topic2",
    "title": "Topic 2: Lists & Comprehensions",
    "subtitle": "List creation, mutation, sorting, built-in aggregations, and list comprehensions",
    "categories": [
      {
        "id": "list_basics",
        "name": "List Creation & Slicing",
        "icon": "Layers",
        "items": [
          {
            "title": "Initialize 1D and 2D Lists",
            "syntax": "[val] * n, [[val] * m for _ in range(n)]",
            "code": "zeros_1d = [0] * 5                      # [0, 0, 0, 0, 0]\ngrid_2d  = [[0] * 3 for _ in range(2)]  # 2 rows, 3 cols",
            "description": "Creates fixed-size 1D lists and nested 2D grids (matrix).",
            "note": "Never use [[0] * m] * n for 2D lists because rows will reference the same object."
          },
          {
            "title": "List Slicing & Copying",
            "syntax": "lst[start:end], lst[:], lst[::-1]",
            "code": "nums = [10, 20, 30, 40, 50]\nnums[1:4]   # [20, 30, 40]\nnums[::-1]  # [50, 40, 30, 20, 10]",
            "description": "Extracts sublist, makes shallow copy, or reverses list.",
            "note": "nums[:] creates a new list with the same elements, protecting original list."
          }
        ]
      },
      {
        "id": "list_methods",
        "name": "List Mutation Methods",
        "icon": "FileCode",
        "items": [
          {
            "title": "Add Elements (append & extend)",
            "syntax": "lst.append(x), lst.extend(iterable)",
            "code": "lst = [1, 2]\nlst.append(3)      # [1, 2, 3]\nlst.extend([4, 5]) # [1, 2, 3, 4, 5]",
            "description": "append() adds single item; extend() adds all items from iterable.",
            "note": "append([4,5]) would nest a list inside; extend([4,5]) adds individual items."
          },
          {
            "title": "Insert & Remove Elements",
            "syntax": "lst.insert(i, x), lst.remove(x), lst.pop(i)",
            "code": "lst = [\"a\", \"b\", \"c\"]\nlst.insert(1, \"x\")  # ['a', 'x', 'b', 'c']\nlst.remove(\"x\")     # ['a', 'b', 'c']",
            "description": "insert() adds at index; pop() removes by index; remove() removes by value.",
            "note": "pop() defaults to index -1 (the last element). remove() raises ValueError if not found."
          },
          {
            "title": "In-place Reverse & In-place Sort",
            "syntax": "lst.reverse(), lst.sort(reverse=False, key=None)",
            "code": "nums = [3, 1, 4]\nnums.sort()     # nums is now [1, 3, 4]\nnums.reverse()  # nums is now [4, 3, 1]",
            "description": "Sorts or reverses the original list directly (modifies in-place).",
            "note": "Both methods return None; do not assign result to a variable (e.g. x = lst.sort())."
          }
        ]
      },
      {
        "id": "list_builtins",
        "name": "Built-in Functions with Lists",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Sorted Function",
            "syntax": "sorted(iterable, reverse=False, key=None)",
            "code": "sorted([3, 1, 2])            # [1, 2, 3]\nsorted([\"bb\", \"a\"], key=len) # ['a', 'bb']",
            "description": "Returns a new sorted list without changing the original.",
            "note": "Unlike list.sort(), sorted() leaves the original collection untouched."
          },
          {
            "title": "Aggregations (len, sum, min, max)",
            "syntax": "len(lst), sum(lst), min(lst), max(lst)",
            "code": "nums = [4, 1, 7]\nlen(nums), sum(nums)  # (3, 12)\nmin(nums), max(nums)  # (1, 7)",
            "description": "Computes total count, sum, minimum, and maximum of sequence.",
            "note": "sum() accepts optional start value: sum(lst, 10)."
          },
          {
            "title": "Enumerate with Index",
            "syntax": "enumerate(iterable, start=0)",
            "code": "for i, item in enumerate([\"a\", \"b\"], start=1):\n    print(i, item)  # 1 a, 2 b",
            "description": "Loops through sequence getting both index and value at once.",
            "note": "Eliminates the need for manual counter variables or range(len(lst))."
          },
          {
            "title": "Zip Parallel Iteration",
            "syntax": "zip(*iterables)",
            "code": "names = [\"A\", \"B\"]; scores = [90, 85]\ndict(zip(names, scores))  # {'A': 90, 'B': 85}",
            "description": "Combines multiple lists element-by-element into tuples.",
            "note": "Stops when the shortest input iterable is exhausted."
          },
          {
            "title": "Any & All Boolean Checks",
            "syntax": "any(iterable), all(iterable)",
            "code": "any([False, True, False])        # True\nall([x > 0 for x in [1, 2, 3]])  # True",
            "description": "any() is True if at least one item is True; all() is True if all are True.",
            "note": "Short-circuits immediately once result is determined."
          }
        ]
      },
      {
        "id": "list_comprehensions",
        "name": "List Comprehensions",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Filtered & Transformed Comprehension",
            "syntax": "[expr for item in iterable if condition]",
            "code": "[x**2 for x in range(5) if x % 2 == 0]  # [0, 4, 16]",
            "description": "Creates a new list applying formula and filter in one line.",
            "note": "Much faster and more concise than traditional for-loop with append."
          },
          {
            "title": "Ternary If-Else Comprehension",
            "syntax": "[val_if if cond else val_else for item in iterable]",
            "code": "[x if x > 0 else 0 for x in [-2, 5, -1, 3]]  # [0, 5, 0, 3]",
            "description": "Replaces or transforms values conditionally in a list.",
            "note": "When using if-else, place it before \"for\"; when filtering only, place \"if\" after."
          },
          {
            "title": "Flatten 2D Matrix to 1D",
            "syntax": "[elem for row in matrix for elem in row]",
            "code": "matrix = [[1, 2], [3, 4]]\n[x for row in matrix for x in row]  # [1, 2, 3, 4]",
            "description": "Flattens a nested 2D matrix into a 1D list.",
            "note": "The order of for-loops matches the order in standard nested loops."
          }
        ]
      }
    ]
  },
  "Topic3": {
    "lectureId": "Topic3",
    "title": "Topic 3: Tuples, Sets & Dictionaries",
    "subtitle": "Tuples, set operations, dictionary mapping, sorting by key/value, and collections utilities",
    "categories": [
      {
        "id": "tuples",
        "name": "Tuples & Variable Unpacking",
        "icon": "Layers",
        "items": [
          {
            "title": "Tuple Definition & Immutability",
            "syntax": "t = (x, y, ...)",
            "code": "pt = (10, 20)\nx, y = pt  # x = 10, y = 20",
            "description": "Creates fixed immutable sequences and unpacks into variables.",
            "note": "Tuples can be used as dictionary keys and set elements because they are hashable."
          },
          {
            "title": "Variable Swapping via Unpacking",
            "syntax": "a, b = b, a",
            "code": "a, b = 1, 2\na, b = b, a  # a = 2, b = 1",
            "description": "Swaps values of two variables in one line without temporary variable.",
            "note": "Evaluates the right side into a tuple first, then unpacks to left side."
          }
        ]
      },
      {
        "id": "sets",
        "name": "Sets & Set Operations",
        "icon": "FileCode",
        "items": [
          {
            "title": "Deduplicate Elements with Set",
            "syntax": "set(iterable)",
            "code": "list(set([1, 2, 2, 3, 1]))  # [1, 2, 3]",
            "description": "Converts collection to set to automatically strip all duplicate items.",
            "note": "Sets are unordered. To preserve order while deduplicating, use dict.fromkeys(lst)."
          },
          {
            "title": "Add & Discard Set Elements",
            "syntax": "s.add(x), s.discard(x)",
            "code": "s = {1, 2}\ns.add(3)      # {1, 2, 3}\ns.discard(2)  # {1, 3}",
            "description": "add() inserts an element; discard() removes without error if missing.",
            "note": "discard(x) is safer than remove(x) because discard never raises KeyError."
          },
          {
            "title": "Set Operations (Union, Intersect, Diff)",
            "syntax": "s1 | s2, s1 & s2, s1 - s2, s1 ^ s2",
            "code": "{1, 2} | {2, 3}  # Union: {1, 2, 3}\n{1, 2} & {2, 3}  # Intersection: {2}\n{1, 2} - {2, 3}  # Difference: {1}",
            "description": "Performs set algebra: | (union), & (intersection), - (difference).",
            "note": "Equivalent methods: a.union(b), a.intersection(b), a.difference(b)."
          }
        ]
      },
      {
        "id": "dictionaries",
        "name": "Dictionaries & Key-Value Operations",
        "icon": "FileText",
        "items": [
          {
            "title": "Safe Retrieval with get()",
            "syntax": "d.get(key, default=None)",
            "code": "d = {\"a\": 1}\nd.get(\"a\")     # 1\nd.get(\"b\", 0)  # 0 (fallback default)",
            "description": "Gets dictionary value safely without KeyError if key is missing.",
            "note": "Prevents KeyError crashes when reading dynamic or optional dictionary fields."
          },
          {
            "title": "Iterate Keys, Values & Items",
            "syntax": "d.keys(), d.values(), d.items()",
            "code": "d = {\"x\": 10, \"y\": 20}\nfor k, v in d.items():\n    print(k, v)  # x 10, y 20",
            "description": "Loops over keys, values, or key-value pairs of a dictionary.",
            "note": "In Python 3.7+, dictionaries preserve insertion order."
          },
          {
            "title": "Sort Dictionary by Value or Key",
            "syntax": "dict(sorted(d.items(), key=lambda item: item[1]))",
            "code": "d = {\"Bob\": 85, \"Alice\": 95}\ndict(sorted(d.items(), key=lambda x: x[1]))\n# {'Bob': 85, 'Alice': 95}",
            "description": "Sorts dictionary pairs by value or key into a new dictionary.",
            "note": "item[0] is the key, item[1] is the value."
          },
          {
            "title": "Dictionary Comprehension",
            "syntax": "{k_expr: v_expr for item in iterable if condition}",
            "code": "{x: x**2 for x in range(4)}  # {0: 0, 1: 1, 2: 4, 3: 9}",
            "description": "Constructs a dictionary from an iterable in a single line.",
            "note": "Can invert a dictionary: {v: k for k, v in original.items()}."
          }
        ]
      },
      {
        "id": "collections_module",
        "name": "Collections Module (Counter & Defaultdict)",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Count Frequency with Counter",
            "syntax": "from collections import Counter",
            "code": "from collections import Counter\ncounts = Counter([\"a\", \"b\", \"a\"])  # Counter({'a': 2, 'b': 1})\ncounts[\"a\"]  # 2",
            "description": "Counts how many times each element appears in O(n) time.",
            "note": "counts[\"non_existent\"] returns 0 instead of raising KeyError."
          },
          {
            "title": "Defaultdict for Grouping",
            "syntax": "from collections import defaultdict",
            "code": "from collections import defaultdict\ngroups = defaultdict(list)\ngroups[\"fruits\"].append(\"apple\")  # {'fruits': ['apple']}",
            "description": "Dictionary that automatically initializes missing keys with empty list.",
            "note": "Pass list, int, or set as factory function: defaultdict(int) acts as counter."
          }
        ]
      }
    ]
  },
  "Topic4": {
    "lectureId": "Topic4",
    "title": "Topic 4: Control Flow, Loops & Functions",
    "subtitle": "Conditional branches, loops, functions, variable arguments, lambda, and recursion",
    "categories": [
      {
        "id": "control_flow",
        "name": "Conditionals & Loops",
        "icon": "Layers",
        "items": [
          {
            "title": "Ternary Conditional Expression",
            "syntax": "val = a if condition else b",
            "code": "status = \"Pass\" if score >= 50 else \"Fail\"",
            "description": "One-line conditional value: a if condition else b.",
            "note": "Both if and else branches are mandatory."
          },
          {
            "title": "Range Loop Variations",
            "syntax": "range(start, stop, step)",
            "code": "list(range(5))         # [0, 1, 2, 3, 4]\nlist(range(10, 0, -2)) # [10, 8, 6, 4, 2]",
            "description": "Generates sequence of integers from start to stop-1 by step.",
            "note": "Stop is always exclusive. To count down, use a negative step."
          },
          {
            "title": "Break, Continue & For-Else",
            "syntax": "break, continue, for ... else:",
            "code": "for n in [2, 4, 6]:\n    if n == 4: break",
            "description": "break exits loop; continue skips iteration; else runs if no break.",
            "note": "for...else is perfect for search loops to detect when no match was found."
          }
        ]
      },
      {
        "id": "functions",
        "name": "Functions & Arguments",
        "icon": "FileCode",
        "items": [
          {
            "title": "Default Parameter Values",
            "syntax": "def func(a, b=default_val):",
            "code": "def greet(name=\"User\"): return f\"Hi {name}\"\ngreet()  # 'Hi User'",
            "description": "Defines function parameters that take fallback values if omitted.",
            "note": "Never use mutable defaults like b=[] or b={}; use b=None instead."
          },
          {
            "title": "Variable Positional & Keyword Arguments (*args, **kwargs)",
            "syntax": "def func(*args, **kwargs):",
            "code": "def calc(*args): return sum(args)\ncalc(1, 2, 3)  # 6",
            "description": "*args captures extra positional args as tuple; **kwargs captures named args as dict.",
            "note": "*args gathers extra positional arguments; **kwargs gathers extra keyword arguments."
          },
          {
            "title": "Recursion with Base Case",
            "syntax": "def recursive_fn(n): if base: return ... else: return recursive_fn(...)",
            "code": "def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\nfact(5)  # 120",
            "description": "Function calling itself to solve sub-problems until reaching base case.",
            "note": "Always ensure the base case is reached to prevent RecursionError."
          }
        ]
      },
      {
        "id": "lambda_functional",
        "name": "Lambda & Functional Tools",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Lambda Anonymous Functions",
            "syntax": "lambda arg1, arg2: expression",
            "code": "sq = lambda x: x**2\nsq(4)  # 16",
            "description": "Creates small inline anonymous function.",
            "note": "Commonly used as the key argument in sorted(), max(), and min()."
          },
          {
            "title": "Custom Multi-Criteria Sorting Key",
            "syntax": "sorted(lst, key=lambda x: (criterion1, criterion2))",
            "code": "# Sort by score desc (-x[1]), then name asc (x[0]):\nsorted([(\"Bob\", 85), (\"Alice\", 95)], key=lambda x: (-x[1], x[0]))",
            "description": "Sorts items by multiple criteria using a tuple: (crit1, crit2).",
            "note": "Negate numerical values (e.g. -x) to sort that specific criterion in descending order."
          },
          {
            "title": "Map & Filter Functions",
            "syntax": "map(func, iterable), filter(func, iterable)",
            "code": "list(map(str.upper, [\"a\", \"b\"]))       # ['A', 'B']\nlist(filter(lambda x: x > 0, [-1, 2]))  # [2]",
            "description": "map() transforms all elements; filter() extracts elements matching condition.",
            "note": "Returns lazy iterators; wrap in list() to realize the results."
          }
        ]
      }
    ]
  },
  "Topic5": {
    "lectureId": "Topic5",
    "title": "Topic 5: Math, Primes & Exam Algorithms",
    "subtitle": "Math utilities, prime checking & sieves, divisors, matrix operations, and interview patterns",
    "categories": [
      {
        "id": "math_essentials",
        "name": "Math Module Essentials",
        "icon": "Bookmark",
        "items": [
          {
            "title": "Integer Square Root & GCD/LCM",
            "syntax": "math.isqrt(n), math.gcd(a, b), math.lcm(a, b)",
            "code": "import math\nmath.isqrt(20)    # 4 (integer sqrt)\nmath.gcd(12, 18)  # 6, math.lcm(4, 6) # 12",
            "description": "Computes integer square root, greatest common divisor, and least common multiple.",
            "note": "isqrt() returns integer directly without precision loss of floating-point sqrt."
          },
          {
            "title": "Factorial & Combinations (Binomial)",
            "syntax": "math.factorial(n), math.comb(n, k)",
            "code": "import math\nmath.factorial(5)  # 120\nmath.comb(5, 2)    # 10",
            "description": "factorial() computes n!; comb(n, k) computes combinations (n choose k).",
            "note": "math.comb(n, k) computes n! / (k! * (n-k)!) efficiently."
          }
        ]
      },
      {
        "id": "prime_algorithms",
        "name": "Prime Numbers & Divisors",
        "icon": "FileCode",
        "items": [
          {
            "title": "Optimized Prime Check O(sqrt(n))",
            "syntax": "def is_prime(n):",
            "code": "def is_prime(n):\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))\nis_prime(17)  # True",
            "description": "Fast check if integer n is a prime number in O(sqrt(n)) time.",
            "note": "Testing up to isqrt(n) is sufficient because factors repeat beyond the square root."
          },
          {
            "title": "Sieve of Eratosthenes (All Primes <= n)",
            "syntax": "def sieve(n):",
            "code": "# All primes up to 20:\n[x for x in range(2, 21) if all(x % d != 0 for d in range(2, int(x**0.5) + 1))]\n# [2, 3, 5, 7, 11, 13, 17, 19]",
            "description": "Generates all prime numbers up to n efficiently.",
            "note": "Best algorithm when needing prime checks for multiple queries."
          },
          {
            "title": "Find All Divisors of Integer",
            "syntax": "def find_divisors(n):",
            "code": "# All divisors of 12:\n[i for i in range(1, 13) if 12 % i == 0]  # [1, 2, 3, 4, 6, 12]",
            "description": "Finds all positive factors/divisors of an integer n.",
            "note": "Useful for perfect number checks, abundance checks, and GCD problems."
          },
          {
            "title": "Smallest Prime >= n (nearest_prime)",
            "syntax": "def nearest_prime(n):",
            "code": "def is_prime(n): return n > 1 and all(n % i for i in range(2, int(n**0.5) + 1))\nnext_prime = lambda n: n if is_prime(n) else next_prime(n + 1)\nnext_prime(14)  # 17",
            "description": "Finds the nearest prime number greater than or equal to n.",
            "note": "Frequently appears in Mid-term exam problem sets."
          }
        ]
      },
      {
        "id": "matrix_exam_patterns",
        "name": "Matrix & Problem Solving Patterns",
        "icon": "Sparkles",
        "items": [
          {
            "title": "Matrix Transpose with Zip",
            "syntax": "list(map(list, zip(*matrix)))",
            "code": "matrix = [[1, 2], [3, 4]]\n[list(col) for col in zip(*matrix)]  # [[1, 3], [2, 4]]",
            "description": "Transposes a 2D matrix (turns rows into columns) using zip(*matrix).",
            "note": "The *matrix unpacks each row as an argument into zip()."
          },
          {
            "title": "Two Sum Target Lookup O(n)",
            "syntax": "def two_sum(nums, target):",
            "code": "seen = {}\nfor i, x in enumerate([2, 7, 11, 15]):\n    if 9 - x in seen: pair = (seen[9 - x], i); break\n    seen[x] = i  # pair -> (0, 1)",
            "description": "Finds two indices that add up to target using a hash map in O(n) time.",
            "note": "Replaces slow $O(n^2)$ nested loops with $O(1)$ dictionary lookups."
          },
          {
            "title": "Vigenere Cipher Encryption",
            "syntax": "def vigenere(plain, key):",
            "code": "k, text = \"KEY\", \"HELLO\"\nenc = [chr((ord(c) - 65 + ord(k[i % len(k)]) - 65) % 26 + 65) for i, c in enumerate(text)]\n\"\".join(enc)  # 'RIJVS'",
            "description": "Encrypts text by shifting letters according to keyword characters.",
            "note": "Wrap-around is handled with modulo 26 arithmetic."
          }
        ]
      }
    ]
  }
};

export function getAllCheatsheetItems(term = 'last') {
  const source = term === 'mid' ? MIDTERM_CHEATSHEETS : CHEATSHEETS;
  const items = [];
  Object.values(source).forEach(lecture => {
    lecture.categories.forEach(category => {
      category.items.forEach(item => {
        items.push({
          ...item,
          lectureId: lecture.lectureId,
          lectureTitle: lecture.title,
          categoryId: category.id,
          categoryName: category.name,
        });
      });
    });
  });
  return items;
}
