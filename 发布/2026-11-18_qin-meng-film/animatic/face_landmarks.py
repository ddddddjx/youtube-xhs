import sys, json
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
model, out = sys.argv[1], sys.argv[2]
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=model), num_faces=2, min_face_detection_confidence=0.3))
res = {}
for f in sys.argv[3:]:
    r = det.detect(mp.Image.create_from_file(f)); n = f.split('/')[-1][:2]
    res[n] = [[[round(p.x, 5), round(p.y, 5), round(p.z, 5)] for p in face] for face in r.face_landmarks]
    print(n, 'faces:', len(r.face_landmarks), flush=True)
json.dump(res, open(out, 'w'))
