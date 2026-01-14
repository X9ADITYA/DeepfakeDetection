import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (Conv2D, MaxPooling2D, Flatten, Dense, 
                                      Dropout, BatchNormalization, GlobalAveragePooling2D)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import Xception
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import os
import numpy as np

# --- Configuration Constants ---
IMG_WIDTH, IMG_HEIGHT = 128, 128
CHANNELS = 3
INPUT_SHAPE = (IMG_WIDTH, IMG_HEIGHT, CHANNELS)
BATCH_SIZE = 64  # Increased for large dataset (20k+ images)
EPOCHS = 40  # Increased for better convergence
BASE_DIR = 'processed_faces/'

def build_improved_model(input_shape):
    """
    Builds an improved deepfake detection model with better architecture.
    Uses Xception which is proven effective for deepfake detection.
    """
    print("Building Improved Xception-based Model...")
    
    # Clear any previous session
    tf.keras.backend.clear_session()
    
    # Load Xception base model
    base_model = Xception(
        weights='imagenet',
        include_top=False,
        input_shape=input_shape
    )
    
    # Freeze base model initially
    base_model.trainable = False
    
    # Build custom top layers
    inputs = tf.keras.Input(shape=input_shape)
    x = base_model(inputs, training=False)
    
    # Global pooling instead of flatten
    x = GlobalAveragePooling2D()(x)
    
    # Dense layers with batch normalization
    x = Dense(512, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)
    
    x = Dense(256, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    
    x = Dense(128, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    
    # Output layer
    outputs = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs)
    
    # Compile with better optimizer settings
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            tf.keras.metrics.Precision(name='precision'),
            tf.keras.metrics.Recall(name='recall'),
            tf.keras.metrics.AUC(name='auc')
        ]
    )
    
    model.summary()
    return model

def prepare_data_generators(base_dir, target_size, batch_size):
    """
    Creates improved data generators with better augmentation.
    """
    if not all(os.path.exists(os.path.join(base_dir, label)) for label in ['real', 'fake']):
        print(f"Error: Required directories not found.")
        return None, None

    # Enhanced data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,          # Increased
        width_shift_range=0.2,      # Increased
        height_shift_range=0.2,     # Increased
        shear_range=0.15,           # Increased
        zoom_range=0.2,             # Increased
        horizontal_flip=True,
        brightness_range=[0.8, 1.2], # Added brightness variation
        fill_mode='nearest',
        validation_split=0.2
    )
    
    # Validation generator (only rescale, no augmentation)
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    # Training generator with augmentation
    train_generator = train_datagen.flow_from_directory(
        base_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='training',
        shuffle=True
    )
    
    # Validation generator without augmentation
    validation_generator = val_datagen.flow_from_directory(
        base_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='validation',
        shuffle=False
    )
    
    print(f"\nClass indices: {train_generator.class_indices}")
    print(f"Training samples: {train_generator.samples}")
    print(f"Validation samples: {validation_generator.samples}")
    
    # Check for class imbalance
    class_counts = {}
    for class_name in train_generator.class_indices:
        class_dir = os.path.join(base_dir, class_name)
        class_counts[class_name] = len(os.listdir(class_dir))
    
    print(f"\nDataset distribution: {class_counts}")
    
    return train_generator, validation_generator

def train_model():
    """Main training function with improved callbacks and fine-tuning."""
    
    print("=" * 60)
    print("DEEPFAKE DETECTION MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    # 1. Prepare data
    train_generator, validation_generator = prepare_data_generators(
        BASE_DIR,
        (IMG_WIDTH, IMG_HEIGHT),
        BATCH_SIZE
    )
    
    if train_generator is None:
        print("Aborting training due to missing data.")
        return
    
    # 2. Build model
    model = build_improved_model(INPUT_SHAPE)
    
    # 3. Enhanced callbacks
    callbacks = [
        ModelCheckpoint(
            'deepfake_detector_best.h5',
            monitor='val_loss',
            save_best_only=True,
            mode='min',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=7,  # Increased patience
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # 4. Initial training (frozen base)
    print("\n" + "=" * 60)
    print("PHASE 1: Initial Training (Base Model Frozen)")
    print("=" * 60)
    
    history = model.fit(
        train_generator,
        steps_per_epoch=train_generator.samples // BATCH_SIZE,
        epochs=EPOCHS // 2,  # Train for half the epochs first
        validation_data=validation_generator,
        validation_steps=validation_generator.samples // BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )
    
    # 5. Fine-tuning phase
    print("\n" + "=" * 60)
    print("PHASE 2: Fine-Tuning (Unfreezing Base Model)")
    print("=" * 60)
    
    # Unfreeze base model
    base_model = model.layers[1]
    base_model.trainable = True
    
    # Freeze early layers, unfreeze later layers
    for layer in base_model.layers[:100]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            tf.keras.metrics.Precision(name='precision'),
            tf.keras.metrics.Recall(name='recall'),
            tf.keras.metrics.AUC(name='auc')
        ]
    )
    
    # Continue training
    history_fine = model.fit(
        train_generator,
        steps_per_epoch=train_generator.samples // BATCH_SIZE,
        epochs=EPOCHS,
        initial_epoch=len(history.history['loss']),
        validation_data=validation_generator,
        validation_steps=validation_generator.samples // BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )
    
    # 6. Save final model
    model.save('deepfake_detector_final.h5')
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Final model saved as: deepfake_detector_final.h5")
    print(f"Best model saved as: deepfake_detector_best.h5")
    
    # 7. Evaluate on validation set
    # 7. Evaluate on validation set
    print("\n" + "=" * 70)
    print("FINAL EVALUATION")
    print("=" * 70)
    
    results = model.evaluate(validation_generator, verbose=1)
    print(f"\n📊 FINAL RESULTS:")
    print(f"   Validation Loss:      {results[0]:.4f}")
    print(f"   Validation Accuracy:  {results[1]:.4f} ({results[1]*100:.2f}%)")
    print(f"   Validation Precision: {results[2]:.4f}")
    print(f"   Validation Recall:    {results[3]:.4f}")
    print(f"   Validation AUC:       {results[4]:.4f}")
    
    # Performance assessment
    if results[1] >= 0.85:
        print("\n✅ EXCELLENT! Model performance is very good!")
    elif results[1] >= 0.75:
        print("\n✓ GOOD! Model performance is acceptable.")
    elif results[1] >= 0.65:
        print("\n⚠️  FAIR. Model needs improvement or better data.")
    else:
        print("\n❌ POOR. Consider using FaceForensics++ dataset for better results.")

if __name__ == '__main__':
    # Set random seeds for reproducibility
    tf.random.set_seed(42)
    np.random.seed(42)
    
    print("\n" + "=" * 70)
    print("DEEPFAKE DETECTION - MODEL TRAINING")
    print("=" * 70)
    print("Make sure:")
    print("  1. Laptop is plugged in (training uses lots of power)")
    print("  2. Preprocessing is complete (20,591 faces)")
    print("  3. You have 2-4 hours available")
    print("=" * 70)
    
    train_model()