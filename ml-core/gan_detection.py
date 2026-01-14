"""
Model specifically designed for detecting GAN-generated synthetic faces.
Uses frequency domain analysis and texture patterns.
"""
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (Input, Conv2D, MaxPooling2D, Dense, Dropout,
                                      BatchNormalization, GlobalAveragePooling2D,
                                      Flatten, Concatenate, Lambda)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import numpy as np
import os

# Configuration
IMG_WIDTH, IMG_HEIGHT = 128, 128
CHANNELS = 3
INPUT_SHAPE = (IMG_WIDTH, IMG_HEIGHT, CHANNELS)
BATCH_SIZE = 32
EPOCHS = 60
BASE_DIR = 'processed_faces/'

def fft_layer(x):
    """
    Apply FFT to detect frequency domain artifacts in GAN-generated images.
    GAN faces often have characteristic frequency patterns.
    """
    # Convert to grayscale
    gray = tf.reduce_mean(x, axis=-1, keepdims=True)
    
    # Apply 2D FFT
    fft = tf.signal.fft2d(tf.cast(tf.squeeze(gray, -1), tf.complex64))
    
    # Get magnitude spectrum
    magnitude = tf.abs(fft)
    
    # Log transform for better visualization
    magnitude = tf.math.log(magnitude + 1.0)
    
    # Normalize
    magnitude = tf.expand_dims(magnitude, -1)
    
    return magnitude

def build_gan_detector(input_shape):
    """
    Build a specialized model for detecting GAN-generated faces.
    Uses both spatial and frequency domain features.
    """
    print("Building GAN Synthetic Face Detection Model...")
    
    tf.keras.backend.clear_session()
    
    inputs = Input(shape=input_shape)
    
    # ===== SPATIAL STREAM (for texture patterns) =====
    spatial = Conv2D(32, (3, 3), activation='relu', padding='same')(inputs)
    spatial = BatchNormalization()(spatial)
    spatial = MaxPooling2D(2, 2)(spatial)
    
    spatial = Conv2D(64, (3, 3), activation='relu', padding='same')(spatial)
    spatial = BatchNormalization()(spatial)
    spatial = MaxPooling2D(2, 2)(spatial)
    
    spatial = Conv2D(128, (3, 3), activation='relu', padding='same')(spatial)
    spatial = BatchNormalization()(spatial)
    spatial = MaxPooling2D(2, 2)(spatial)
    
    spatial = Conv2D(256, (3, 3), activation='relu', padding='same')(spatial)
    spatial = BatchNormalization()(spatial)
    spatial = GlobalAveragePooling2D()(spatial)
    
    # ===== FREQUENCY STREAM (for FFT artifacts) =====
    # GAN-generated images have characteristic frequency patterns
    fft_features = Lambda(fft_layer)(inputs)
    
    freq = Conv2D(32, (3, 3), activation='relu', padding='same')(fft_features)
    freq = MaxPooling2D(2, 2)(freq)
    
    freq = Conv2D(64, (3, 3), activation='relu', padding='same')(freq)
    freq = MaxPooling2D(2, 2)(freq)
    
    freq = Conv2D(128, (3, 3), activation='relu', padding='same')(freq)
    freq = GlobalAveragePooling2D()(freq)
    
    # ===== COMBINE BOTH STREAMS =====
    combined = Concatenate()([spatial, freq])
    
    # Classification layers
    x = Dense(512, activation='relu')(combined)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)
    
    x = Dense(256, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    
    outputs = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs)
    
    # Compile with specific settings for GAN detection
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss='binary_crossentropy',
        metrics=['accuracy',
                 tf.keras.metrics.Precision(name='precision'),
                 tf.keras.metrics.Recall(name='recall'),
                 tf.keras.metrics.AUC(name='auc')]
    )
    
    model.summary()
    return model

def prepare_gan_generators(base_dir, target_size, batch_size):
    """
    Data generators optimized for GAN detection.
    Less aggressive augmentation since we need to preserve subtle artifacts.
    """
    if not all(os.path.exists(os.path.join(base_dir, label)) for label in ['real', 'fake']):
        print("Error: Directories not found!")
        return None, None, None
    
    # LIGHT augmentation to preserve GAN artifacts
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=5,  # Minimal rotation
        horizontal_flip=True,
        validation_split=0.2
    )
    
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )
    
    train_generator = train_datagen.flow_from_directory(
        base_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='training',
        shuffle=True
    )
    
    validation_generator = val_datagen.flow_from_directory(
        base_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='validation',
        shuffle=False
    )
    
    print(f"\nClass mapping: {train_generator.class_indices}")
    print(f"Training samples: {train_generator.samples}")
    print(f"Validation samples: {validation_generator.samples}")
    
    # Calculate class weights
    real_count = len(os.listdir(os.path.join(base_dir, 'real')))
    fake_count = len(os.listdir(os.path.join(base_dir, 'fake')))
    total = real_count + fake_count
    
    class_weights = {
        0: total / (2.0 * fake_count),
        1: total / (2.0 * real_count)
    }
    
    print(f"Class weights: {class_weights}")
    
    return train_generator, validation_generator, class_weights

def train_gan_detector():
    """Train the GAN detection model"""
    
    print("=" * 70)
    print("GAN SYNTHETIC FACE DETECTION TRAINING")
    print("=" * 70)
    print("\nThis model is optimized for detecting GAN-generated faces")
    print("(StyleGAN, ProGAN, etc.) rather than face-swap deepfakes.\n")
    
    # Prepare data
    result = prepare_gan_generators(BASE_DIR, (IMG_WIDTH, IMG_HEIGHT), BATCH_SIZE)
    if result is None:
        return
    
    train_gen, val_gen, class_weights = result
    
    # Build model
    model = build_gan_detector(INPUT_SHAPE)
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            'gan_detector_best.h5',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=12,
            restore_best_weights=True,
            mode='max',
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    print("\n" + "=" * 70)
    print("TRAINING GAN DETECTOR")
    print("=" * 70)
    
    history = model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    model.save('gan_detector_final.h5')
    
    # Evaluate
    print("\n" + "=" * 70)
    print("FINAL EVALUATION")
    print("=" * 70)
    
    results = model.evaluate(val_gen, verbose=1)
    print(f"\nValidation Loss: {results[0]:.4f}")
    print(f"Validation Accuracy: {results[1]:.4f}")
    print(f"Validation Precision: {results[2]:.4f}")
    print(f"Validation Recall: {results[3]:.4f}")
    print(f"Validation AUC: {results[4]:.4f}")
    
    print("\n" + "=" * 70)
    print("Expected Performance for GAN Detection:")
    print("  - Good: 75-85% accuracy")
    print("  - Excellent: 85-95% accuracy")
    print("\nNote: GAN detection is harder than face-swap detection!")
    print("=" * 70)

if __name__ == '__main__':
    tf.random.set_seed(42)
    np.random.seed(42)
    train_gan_detector()