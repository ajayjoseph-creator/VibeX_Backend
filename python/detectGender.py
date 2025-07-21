import sys
from deepface import DeepFace

image_url = sys.argv[1]

try:
    result = DeepFace.analyze(
        img_path=image_url,
        actions=['gender'],
        enforce_detection=False,  # Optional tweak
        detector_backend="opencv" # Try "retinaface" or "mtcnn" if needed
    )

    gender = result[0]['gender']

    if gender == 'Man':
        print('Man')
    elif gender == 'Woman':
        print('Woman')
    else:
        print('Unknown')

except Exception as e:
    print('NoFace')
