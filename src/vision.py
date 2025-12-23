import cv2
import numpy as np
from ultralytics import YOLO
import google.generativeai as genai
from PIL import Image
import io
import re

class VisionPipeline:
    def __init__(self, model_path: str, api_key: str):
        self.yolo_model = YOLO(model_path)
        genai.configure(api_key=api_key)
        # Using the latest flash model as confirmed working
        self.gemini_model = genai.GenerativeModel('gemini-flash-latest')

    def extract_plate_number(self, image_bytes: bytes) -> str:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None

        # 1. YOLO Detection (from your notebook logic)
        results = self.yolo_model.predict(img, conf=0.5, verbose=False)
        
        if not results or len(results[0].boxes) == 0:
            return None

        # Process the best detection
        box = results[0].boxes[0]
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        
        # 2. Crop the plate
        plate_crop = img[y1:y2, x1:x2]
        
        # Convert BGR to RGB for Gemini (Crucial as per your notebook)
        plate_rgb = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2RGB)
        plate_pil = Image.fromarray(plate_rgb)
        
        # 3. Gemini OCR with YOUR specialized prompt
        prompt = """You are an expert license plate reader specializing in Tunisian plates.
        Analyze this license plate image and extract ALL text and numbers.

        Tunisian plates usually have two common formats:
        1. [Governorate Code] تونس [4-digit Serial]  (Example: "159 تونس 8240")
        2. [7-digit Serial] نت  (Example: "3341323 نت")

        IMPORTANT:
        - Read Arabic text carefully (تونس or نت)
        - Read ALL digits clearly
        - Maintain the correct order
        - sometimes there is some different format

        Return ONLY the plate:
        PLATE: [exact text here]
        """
        
        try:
            response = self.gemini_model.generate_content([prompt, plate_pil])
            text = response.text
            
            # Extract the plate part using yours or a similar regex
            if 'PLATE:' in text:
                plate_text = text.split('PLATE:')[1].strip()
                return plate_text
            else:
                return text.strip()
        except Exception as e:
            print(f"❌ Vision Error: {e}")
            return None
