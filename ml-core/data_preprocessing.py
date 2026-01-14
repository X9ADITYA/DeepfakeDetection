import os
import cv2
import numpy as np
import uuid
from mtcnn import MTCNN
import tqdm
# tqdm is installed but not used for videos since the console output already shows progress.

# --- Configuration (MUST MATCH model_training.py) --- 
RAW_VIDEOS_DIR = 'raw_videos'
PROCESSED_FACES_DIR = 'processed_faces'
FACE_SIZE = 128 
FRAME_SKIP_RATE = 50 
MIN_CONFIDENCE = 0.95 
MAX_FRAMES_PER_VIDEO = 100 # New limit for stability and dataset size control
# --- End Configuration ---

# Ensure output directories exist
os.makedirs(os.path.join(PROCESSED_FACES_DIR, 'real'), exist_ok=True)
os.makedirs(os.path.join(PROCESSED_FACES_DIR, 'fake'), exist_ok=True)

print("Initializing MTCNN face detector...")
FACE_DETECTOR = MTCNN()
print("MTCNN initialized successfully!")

def enhance_image_quality(image):
    """Apply preprocessing to improve image quality."""
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge channels and convert back to BGR
    enhanced_lab = cv2.merge([l, a, b])
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    # Slight Gaussian blur to reduce noise
    enhanced_bgr = cv2.GaussianBlur(enhanced_bgr, (3, 3), 0)
    
    return enhanced_bgr

def get_face_bounding_box(frame):
    """
    Detects the most confident face in a frame using MTCNN.
    Returns the bounding box and confidence score.
    """
    # The MTCNN library sometimes fails internally on strange image data.
    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        faces = FACE_DETECTOR.detect_faces(rgb_frame)
    except Exception as e:
        # Catch internal MTCNN/TensorFlow errors and skip the frame
        print(f" (Internal MTCNN Error on frame: {str(e)[:50]})")
        return None, 0
    
    if not faces:
        return None, 0
    
    best_face = max(faces, key=lambda f: f['confidence'])
    confidence = best_face['confidence']
    
    # Extract bounding box
    x, y, w, h = best_face['box']
    
    # Ensure coordinates are valid
    x, y = max(0, x), max(0, y)
    x2 = min(frame.shape[1], x + w)
    y2 = min(frame.shape[0], y + h)
    
    if w <= 0 or h <= 0 or x2 <= x or y2 <= y:
        return None, 0
    
    return (x, y, x2, y2), confidence

def process_video(video_path, is_fake):
    """
    Extracts faces from a video and saves them to the appropriate output folder.
    Added timeout protection (MAX_FRAMES_PER_VIDEO) to prevent hanging.
    """
    label_folder = 'fake' if is_fake else 'real'
    output_dir = os.path.join(PROCESSED_FACES_DIR, label_folder)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video file: {os.path.basename(video_path)}")
        return

    frame_count = 0
    faces_saved = 0
    low_confidence_skipped = 0
    
    print(f"Processing video: {os.path.basename(video_path)} (Label: {label_folder})")

    try:
        # Stop loop if we hit the limit, ensuring script moves to the next video
        while cap.isOpened() and faces_saved < MAX_FRAMES_PER_VIDEO:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % FRAME_SKIP_RATE == 0:
                # Use a try/except around the potentially problematic frame read
                try:
                    face_box, confidence = get_face_bounding_box(frame)

                    # Only save high-confidence face detections
                    if face_box is not None and confidence >= MIN_CONFIDENCE:
                        x, y, x2, y2 = face_box
                        
                        cropped_face = frame[y:y2, x:x2]
                        enhanced_face = enhance_image_quality(cropped_face)
                        resized_face = cv2.resize(enhanced_face, (FACE_SIZE, FACE_SIZE))
                        
                        filename = f"{label_folder}_{uuid.uuid4()}.png"
                        save_path = os.path.join(output_dir, filename)
                        cv2.imwrite(save_path, resized_face)
                        faces_saved += 1
                    elif face_box is not None:
                        low_confidence_skipped += 1
                except Exception as e:
                    # Catch and report frame-specific errors (e.g., memory issue)
                    print(f" (Warning: Skipping frame {frame_count} due to internal error: {str(e)[:50]})")
                    pass # Continue to the next frame

            frame_count += 1

    except Exception as e:
        # Catch unexpected errors and ensure cap is released
        print(f"  CRITICAL ERROR: Failed to process video loop: {str(e)[:100]}")
    finally:
        cap.release()
        print(f"-> Finished. Saved {faces_saved} faces, skipped {low_confidence_skipped} low-confidence detections.")

def process_image(image_path, is_fake):
    """
    Process a single image file and extract face.
    """
    label_folder = 'fake' if is_fake else 'real'
    output_dir = os.path.join(PROCESSED_FACES_DIR, label_folder)
    
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Error reading image: {image_path}")
        return
    
    print(f"Processing image: {os.path.basename(image_path)} (Label: {label_folder})")
    
    face_box, confidence = get_face_bounding_box(frame)
    
    if face_box is not None and confidence > MIN_CONFIDENCE:
        x, y, x2, y2 = face_box
        
        # Crop the face
        cropped_face = frame[y:y2, x:x2]
        
        # Enhance image quality
        enhanced_face = enhance_image_quality(cropped_face)
        
        # Resize to target size
        resized_face = cv2.resize(enhanced_face, (FACE_SIZE, FACE_SIZE))
        
        # Save with unique filename
        filename = f"{label_folder}_{uuid.uuid4()}.png"
        save_path = os.path.join(output_dir, filename)
        cv2.imwrite(save_path, resized_face)
        print(f"-> Saved 1 face from image.")
    else:
        print(f"-> No high-confidence face detected in image.")

def main():
    """Main function to iterate through all raw videos and images."""
    
    print("\n" + "="*60)
    print("DATA PREPROCESSING PIPELINE")
    print("="*60)
    
    if not os.path.exists(RAW_VIDEOS_DIR):
        print(f"ERROR: '{RAW_VIDEOS_DIR}' does not exist.")
        print("Please create the folder and add your videos/images.")
        return
    
    files = os.listdir(RAW_VIDEOS_DIR)
    if not files:
        print(f"ERROR: '{RAW_VIDEOS_DIR}' is empty.")
        print("Please add video or image files to process.")
        return

    # Separate videos and images
    video_extensions = ('.mp4', '.avi', '.mov', '.webm')
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
    
    video_files = [f for f in files if f.lower().endswith(video_extensions)]
    image_files = [f for f in files if f.lower().endswith(image_extensions)]

    print(f"\nFound {len(video_files)} videos and {len(image_files)} images to process.\n")

    # Process videos
    if video_files:
        print("="*60)
        print("PROCESSING VIDEOS")
        print("="*60)
        for video_name in video_files:
            
            # Since the MAX_FRAMES_PER_VIDEO limit protects against hangs, 
            # we rely on that. We remove the explicit skip list here 
            # to keep the process automated. If it truly fails, the outer 
            # try/except in process_video will catch it.
            
            video_path = os.path.join(RAW_VIDEOS_DIR, video_name)
            is_fake = 'fake' in video_name.lower() or 'manipulated' in video_name.lower()
            process_video(video_path, is_fake)
    
    # Process images 
    if image_files:
        print("\n" + "="*60)
        print("PROCESSING IMAGES")
        print("="*60)
        
        for image_name in tqdm(image_files, desc="Processing images"):
            image_path = os.path.join(RAW_VIDEOS_DIR, image_name)
            is_fake = 'fake' in image_name.lower() or 'manipulated' in image_name.lower()
            process_image(image_path, is_fake)

    print("\n" + "="*60)
    print("PREPROCESSING COMPLETE")
    print("="*60)
    
    real_count = len(os.listdir(os.path.join(PROCESSED_FACES_DIR, 'real')))
    fake_count = len(os.listdir(os.path.join(PROCESSED_FACES_DIR, 'fake')))
    
    print(f"Total faces saved: {real_count} Real, {fake_count} Fake")
    
    # Warning if dataset is imbalanced
    if real_count > 0 and fake_count > 0:
        ratio = max(real_count, fake_count) / min(real_count, fake_count)
        if ratio > 2.0:
            print(f"\n⚠️  WARNING: Dataset is imbalanced (ratio: {ratio:.2f}:1)")
            print("Consider balancing your dataset for better training results.")
    
    print("\n✓ Ready for training! Run: python model_training.py")

if __name__ == "__main__":
    main()