import sys
import json
import numpy as np
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

def main():
    # Set output encoding to UTF-8
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input: {str(e)}"}))
        sys.exit(1)

    # Features:
    # 0: typing_count
    # 1: pseudocode_count
    # 2: test_count
    # 3: refactor_count
    # 4: debug_count
    # 5: planning_count
    # 6: pseudocode_first (0 or 1)
    # 7: test_first (0 or 1)
    # 8: debug_ratio (debug_time / (coding_time + debug_time + 1e-5))
    # 9: error_count

    # Synthetic training data representing different patterns
    X = np.array([
        # 1. trial_and_error patterns (low planning, low testing, high debugging/errors)
        [15, 0, 1, 0, 12, 0, 0, 0, 0.8, 8],
        [20, 0, 2, 0, 15, 0, 0, 0, 0.7, 10],
        [10, 0, 0, 0, 8,  0, 0, 0, 0.9, 6],
        [18, 0, 1, 1, 10, 1, 0, 0, 0.6, 7],
        [22, 1, 2, 0, 14, 0, 0, 0, 0.75, 9],
        
        # 2. mixed patterns (some planning, moderate debugging/testing)
        [12, 2, 3, 2, 4, 1, 1, 0, 0.25, 3],
        [15, 1, 4, 1, 5, 2, 0, 1, 0.3, 4],
        [10, 3, 2, 1, 3, 2, 1, 0, 0.2, 2],
        [14, 2, 3, 0, 6, 1, 1, 0, 0.35, 4],
        [16, 2, 5, 2, 5, 1, 0, 1, 0.28, 3],
        
        # 3. systematic patterns (high planning/testing/refactoring, low debugging/errors)
        [10, 5, 6, 4, 1, 4, 1, 1, 0.08, 1],
        [12, 6, 8, 5, 0, 5, 1, 1, 0.0, 0],
        [8,  4, 5, 3, 2, 3, 1, 1, 0.15, 1],
        [14, 8, 7, 6, 1, 6, 1, 1, 0.05, 0],
        [9,  5, 6, 4, 2, 4, 1, 1, 0.12, 1]
    ])

    # Target: Approach (0: trial_and_error, 1: mixed, 2: systematic)
    y_approach = np.array([
        0, 0, 0, 0, 0,
        1, 1, 1, 1, 1,
        2, 2, 2, 2, 2
    ])

    # Target: Focus Score (0 - 100)
    y_focus = np.array([
        45.0, 40.0, 30.0, 50.0, 42.0,
        75.0, 80.0, 70.0, 68.0, 78.0,
        95.0, 98.0, 92.0, 96.0, 90.0
    ])

    # Target: Efficiency Score (0 - 100)
    y_efficiency = np.array([
        30.0, 35.0, 20.0, 40.0, 38.0,
        65.0, 70.0, 68.0, 60.0, 72.0,
        90.0, 95.0, 88.0, 94.0, 85.0
    ])

    # Target: Typing Speed (WPM, e.g., 30 - 80)
    y_typing_speed = np.array([
        35.0, 40.0, 30.0, 45.0, 38.0,
        55.0, 60.0, 50.0, 58.0, 62.0,
        70.0, 80.0, 75.0, 78.0, 72.0
    ])

    # Train the models
    clf_approach = DecisionTreeClassifier(random_state=42)
    clf_approach.fit(X, y_approach)

    reg_focus = DecisionTreeRegressor(random_state=42)
    reg_focus.fit(X, y_focus)

    reg_efficiency = DecisionTreeRegressor(random_state=42)
    reg_efficiency.fit(X, y_efficiency)

    reg_typing_speed = DecisionTreeRegressor(random_state=42)
    reg_typing_speed.fit(X, y_typing_speed)

    # Extract input features
    typing_count = input_data.get("typing_count", 0)
    pseudocode_count = input_data.get("pseudocode_count", 0)
    test_count = input_data.get("test_count", 0)
    refactor_count = input_data.get("refactor_count", 0)
    debug_count = input_data.get("debug_count", 0)
    planning_count = input_data.get("planning_count", 0)
    pseudocode_first = input_data.get("pseudocode_first", 0)
    test_first = input_data.get("test_first", 0)
    
    debugging_time = input_data.get("debugging_time", 0)
    coding_time = input_data.get("coding_time", 0)
    error_count = input_data.get("error_count", 0)

    total_coding_debug_time = coding_time + debugging_time
    debug_ratio = debugging_time / total_coding_debug_time if total_coding_debug_time > 0 else 0.0

    features = np.array([[
        typing_count,
        pseudocode_count,
        test_count,
        refactor_count,
        debug_count,
        planning_count,
        pseudocode_first,
        test_first,
        debug_ratio,
        error_count
    ]])

    # Make predictions
    pred_approach_idx = int(clf_approach.predict(features)[0])
    pred_focus = float(reg_focus.predict(features)[0])
    pred_efficiency = float(reg_efficiency.predict(features)[0])
    pred_typing_speed = float(reg_typing_speed.predict(features)[0])

    approaches = ["trial_and_error", "mixed", "systematic"]
    approach = approaches[pred_approach_idx]

    result = {
        "problemSolvingApproach": approach,
        "focusScore": round(pred_focus, 1),
        "efficiency": round(pred_efficiency, 1),
        "typingSpeed": round(pred_typing_speed, 1),
        "modelInfo": "Scikit-learn DecisionTree v1.0"
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
