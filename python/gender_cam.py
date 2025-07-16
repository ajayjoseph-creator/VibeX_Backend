import cv2
from deepface import DeepFace

# Start webcam
cam = cv2.VideoCapture(0)

print("Press 'c' to capture frame and detect gender")
while True:
    ret, frame = cam.read()
    cv2.imshow("Webcam - Press 'c' to capture", frame)

    key = cv2.waitKey(1)

    if key == ord('c'):  # Press 'c' to capture frame
        cv2.imwrite("captured.jpg", frame)
        break

    elif key == 27:  # Press ESC to exit
        cam.release()
        cv2.destroyAllWindows()
        exit()

cam.release()
cv2.destroyAllWindows()

# Analyze gender using DeepFace
try:
    result = DeepFace.analyze(img_path="captured.jpg", actions=["gender"])
    print("Gender:", result[0]["gender"])
except ValueError as e:
    print("Face not detected. Please try again!")
