import os
import cv2
import numpy as np
import uuid
from mtcnn import MTCNN
from tqdm import tqdm

# --- Configuration ---
RAW_IMAGES_DIR = 'raw_videos'  # Your folder with 2,025 images
PROCESSED_FACES_DIR = 'processed_faces'
FACE_SIZE = 128
MIN_CONFIDENCE = 0.90  # Minimum face detection confidence
# --- End Configuration ---

# Create output directories
os.makedirs(os.path.join(PROCESSED_FACES_DIR, 'real'), exist_ok=True)
os.makedirs(os.path.join(PROCESSED_FACES_DIR, 'fake'), exist_ok=True)

print("Initializing MTCNN face detector...")
FACE_DETECTOR = MTCNN()

def enhance_image_quality(image):
    """Apply preprocessing to improve image quality."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    enhanced_lab = cv2.merge([l, a, b])
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    enhanced_bgr = cv2.GaussianBlur(enhanced_bgr, (3, 3), 0)
    
    return enhanced_bgr

def process_image(image_path, is_fake):
    """Process a single image and extract/enhance face."""
    label_folder = 'fake' if is_fake else 'real'
    output_dir = os.path.join(PROCESSED_FACES_DIR, label_folder)
    
    # Read image
    frame = cv2.imread(image_path)
    if frame is None:
        return False, "Failed to read image"
    
    # Convert to RGB for MTCNN
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Detect faces
    faces = FACE_DETECTOR.detect_faces(rgb_frame)
    
    if not faces:
        return False, "No face detected"
    
    # Get most confident face
    best_face = max(faces, key=lambda f: f['confidence'])
    confidence = best_face['confidence']
    
    if confidence < MIN_CONFIDENCE:
        return False, f"Low confidence ({confidence:.2f})"
    
    # Extract bounding box
    x, y, w, h = best_face['box']
    x, y = max(0, x), max(0, y)
    x2 = min(frame.shape[1], x + w)
    y2 = min(frame.shape[0], y + h)
    
    if w <= 0 or h <= 0 or x2 <= x or y2 <= y:
        return False, "Invalid face box"
    
    # Crop face
    cropped_face = frame[y:y2, x:x2]
    
    if cropped_face.size == 0:
        return False, "Empty crop"
    
    # Enhance quality
    enhanced_face = enhance_image_quality(cropped_face)
    
    # Resize to target size
    resized_face = cv2.resize(enhanced_face, (FACE_SIZE, FACE_SIZE))
    
    # Generate unique filename
    original_name = os.path.splitext(os.path.basename(image_path))[0]
    filename = f"{label_folder}_{original_name}_{uuid.uuid4().hex[:8]}.png"
    save_path = os.path.join(output_dir, filename)
    
    # Save
    cv2.imwrite(save_path, resized_face)
    
    return True, "Success"

def main():
    """Process all images in the raw_videos folder."""
    
    if not os.path.exists(RAW_IMAGES_DIR):
        print(f"ERROR: '{RAW_IMAGES_DIR}' does not exist.")
        return
    
    # Get all image files
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
    all_files = [f for f in os.listdir(RAW_IMAGES_DIR) 
                 if f.lower().endswith(image_extensions)]
    
    if not all_files:
        print(f"ERROR: No images found in '{RAW_IMAGES_DIR}'")
        return
    
    print(f"\nFound {len(all_files)} images to process.\n")
    
    # Counters
    stats = {
        'real_success': 0,
        'real_failed': 0,
        'fake_success': 0,
        'fake_failed': 0
    }
    
    failed_reasons = {}
    
    # Process each image with progress bar
    for image_name in tqdm(all_files, desc="Processing images"):
        image_path = os.path.join(RAW_IMAGES_DIR, image_name)
        
        # Determine if fake based on filename
        is_fake = 'fake' in image_name.lower() or 'manipulated' in image_name.lower()
        label = 'fake' if is_fake else 'real'
        
        # Process
        success, reason = process_image(image_path, is_fake)
        
        if success:
            stats[f'{label}_success'] += 1
        else:
            stats[f'{label}_failed'] += 1
            failed_reasons[reason] = failed_reasons.get(reason, 0) + 1
    
    # Print results
    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)
    print(f"\nReal images:")
    print(f"  ✓ Successfully processed: {stats['real_success']}")
    print(f"  ✗ Failed: {stats['real_failed']}")
    
    print(f"\nFake images:")
    print(f"  ✓ Successfully processed: {stats['fake_success']}")
    print(f"  ✗ Failed: {stats['fake_failed']}")
    
    total_success = stats['real_success'] + stats['fake_success']
    total_failed = stats['real_failed'] + stats['fake_failed']
    
    print(f"\nTotal: {total_success} processed, {total_failed} failed")
    print(f"Success rate: {(total_success/(total_success+total_failed)*100):.1f}%")
    
    if failed_reasons:
        print("\nFailure reasons:")
        for reason, count in sorted(failed_reasons.items(), key=lambda x: -x[1]):
            print(f"  - {reason}: {count}")
    
    # Check balance
    ratio = max(stats['real_success'], stats['fake_success']) / max(1, min(stats['real_success'], stats['fake_success']))
    if ratio > 2.0:
        print(f"\n⚠️  WARNING: Dataset is imbalanced (ratio: {ratio:.1f}:1)")
        print("Consider balancing your dataset for better results.")
    
    print("\n✓ Ready for training! Run: python model_training.py")

if __name__ == "__main__":
    main()