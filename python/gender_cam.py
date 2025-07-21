import sys
from deepface import DeepFace

image_url = sys.argv[1]

try:
    result = DeepFace.analyze(img_path=image_url, actions=["gender"])
    gender = result[0]["gender"]

    if gender == "Man":
        print("Man")
    elif gender == "Woman":
        print("Woman")
    else:
        print("Unknown")
except ValueError:
    print("NoFace")
except Exception as e:
    print("Error:", str(e))
