import { Injectable } from '@angular/core';

export interface PhotoCaptureOptions {
  source: 'camera' | 'library';
}

@Injectable({
  providedIn: 'root'
})
export class PhotoCaptureService {
  private readonly STORAGE_KEY = 'captured-photos';
  private readonly PHOTO_DIRECTORY = 'captured-photos';

  constructor() {}

  /**
   * Show dialog to choose between camera or photo library
   */
  async showPhotoSourceDialog(): Promise<PhotoCaptureOptions | null> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'photo-dialog-overlay';
      dialog.innerHTML = `
        <div class="photo-dialog">
          <h3 class="photo-dialog-title">选择照片来源</h3>
          <div class="photo-dialog-buttons">
            <button class="photo-dialog-btn camera-btn" data-source="camera">
              <span class="photo-dialog-icon">📷</span>
              <span>拍照</span>
            </button>
            <button class="photo-dialog-btn library-btn" data-source="library">
              <span class="photo-dialog-icon">🖼️</span>
              <span>从相册选择</span>
            </button>
          </div>
          <button class="photo-dialog-btn cancel-btn">取消</button>
        </div>
      `;

      document.body.appendChild(dialog);

      // Add event listeners
      const cameraBtn = dialog.querySelector('[data-source="camera"]') as HTMLButtonElement;
      const libraryBtn = dialog.querySelector('[data-source="library"]') as HTMLButtonElement;
      const cancelBtn = dialog.querySelector('.cancel-btn') as HTMLButtonElement;

      const cleanup = () => {
        dialog.remove();
      };

      cameraBtn?.addEventListener('click', () => {
        cleanup();
        resolve({ source: 'camera' });
      });

      libraryBtn?.addEventListener('click', () => {
        cleanup();
        resolve({ source: 'library' });
      });

      cancelBtn?.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          cleanup();
          resolve(null);
        }
      });
    });
  }

  /**
   * Capture photo from camera or select from library
   */
  async capturePhoto(source: 'camera' | 'library'): Promise<string | null> {
    try {
      // Check if running in Cordova environment
      if ((window as any).cordova && (window as any).navigator.camera) {
        return await this.captureCordovaPhoto(source);
      } else if (source === 'camera') {
        // For web/Electron: use getUserMedia to access camera
        return await this.captureWebPhoto();
      } else {
        // For web/Electron: use file picker for library
        return await this.selectFromLibrary();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  /**
   * Capture photo using Cordova Camera plugin (Android)
   */
  private async captureCordovaPhoto(source: 'camera' | 'library'): Promise<string | null> {
    return new Promise((resolve) => {
      const Camera = (window as any).navigator.camera;
      const sourceType = source === 'camera' 
        ? Camera.PictureSourceType.CAMERA 
        : Camera.PictureSourceType.PHOTOLIBRARY;

      Camera.getPicture(
        async (imageData: string) => {
          const dataUrl = 'data:image/jpeg;base64,' + imageData;
          await this.savePhoto(dataUrl);
          resolve(dataUrl);
        },
        (error: string) => {
          console.error('Camera error:', error);
          resolve(null);
        },
        {
          quality: 80,
          destinationType: Camera.DestinationType.DATA_URL,
          sourceType: sourceType,
          encodingType: Camera.EncodingType.JPEG,
          mediaType: Camera.MediaType.PICTURE,
          correctOrientation: true,
          saveToPhotoAlbum: true
        }
      );
    });
  }

  /**
   * Capture photo using web camera (getUserMedia API)
   */
  private async captureWebPhoto(): Promise<string | null> {
    return new Promise(async (resolve) => {
      let stream: MediaStream | null = null;
      
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });

        // Create camera preview
        const dialog = document.createElement('div');
        dialog.className = 'camera-preview-overlay';
        dialog.innerHTML = `
          <div class="camera-preview-container">
            <video id="camera-preview" autoplay playsinline></video>
            <div class="camera-controls">
              <button class="camera-capture-btn" id="capture-btn">
                <span class="camera-icon">📷</span>
                <span>拍照</span>
              </button>
              <button class="camera-cancel-btn" id="cancel-camera-btn">取消</button>
            </div>
            <canvas id="photo-canvas" style="display: none;"></canvas>
          </div>
        `;

        document.body.appendChild(dialog);

        const video = document.getElementById('camera-preview') as HTMLVideoElement;
        const canvas = document.getElementById('photo-canvas') as HTMLCanvasElement;
        const captureBtn = document.getElementById('capture-btn');
        const cancelBtn = document.getElementById('cancel-camera-btn');

        video.srcObject = stream;

        const cleanup = () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          dialog.remove();
        };

        captureBtn?.addEventListener('click', async () => {
          // Capture photo from video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            await this.savePhoto(dataUrl);
            cleanup();
            
            // Show success message
            this.showSuccessMessage('照片已保存！');
            resolve(dataUrl);
          } else {
            cleanup();
            resolve(null);
          }
        });

        cancelBtn?.addEventListener('click', () => {
          cleanup();
          resolve(null);
        });

      } catch (error) {
        console.error('Camera access error:', error);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        alert('无法访问摄像头。请确保已授予摄像头权限。');
        resolve(null);
      }
    });
  }

  /**
   * Select photo from library using file picker
   */
  private async selectFromLibrary(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (event: any) => {
        const file = event.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const imageDataUrl = await this.readFileAsDataURL(file);
          await this.savePhoto(imageDataUrl);
          resolve(imageDataUrl);
        } catch (error) {
          console.error('Error processing photo:', error);
          resolve(null);
        }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  /**
   * Read file as data URL
   */
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Save photo to local storage and file system
   */
  private async savePhoto(dataUrl: string): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      const photo = {
        id: timestamp,
        dataUrl,
        timestamp: new Date().toISOString(),
        filename: `photo_${timestamp}.jpg`
      };
      
      // Save to file system (Electron or Cordova)
      await this.savePhotoToFileSystem(photo.filename, dataUrl);
      
      // Also save metadata to localStorage
      const photos = this.getAllPhotos();
      photos.push(photo);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  }

  /**
   * Save photo to file system
   */
  private async savePhotoToFileSystem(filename: string, dataUrl: string): Promise<void> {
    try {
      // Check if running in Electron
      if ((window as any).electron) {
        const electron = (window as any).electron;
        const base64Data = dataUrl.split(',')[1];
        await electron.savePhoto(filename, base64Data);
        console.log(`Photo saved to ~/MatthewTools/${filename}`);
      }
      // Check if running in Cordova
      else if ((window as any).cordova) {
        await this.saveCordovaPhoto(filename, dataUrl);
      }
      // Browser fallback - trigger download
      else {
        this.downloadPhoto(filename, dataUrl);
      }
    } catch (error) {
      console.error('Error saving photo to file system:', error);
    }
  }

  /**
   * Save photo using Cordova File plugin
   */
  private async saveCordovaPhoto(filename: string, dataUrl: string): Promise<void> {
    // Cordova file saving implementation
    // This would use cordova-plugin-file
    console.log('Cordova photo save:', filename);
  }

  /**
   * Download photo in browser
   */
  private downloadPhoto(filename: string, dataUrl: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  /**
   * Get all saved photos
   */
  getAllPhotos(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving photos:', error);
      return [];
    }
  }

  /**
   * Delete a photo by ID
   */
  deletePhoto(id: string): void {
    try {
      const photos = this.getAllPhotos();
      const filtered = photos.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  /**
   * Clear all photos
   */
  clearAllPhotos(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing photos:', error);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'photo-success-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">✓</span>
        <span class="toast-message">${message}</span>
        <span class="toast-link" id="view-photos-link">查看照片</span>
      </div>
    `;
    
    document.body.appendChild(toast);

    // Add click handler for view photos link
    const viewLink = toast.querySelector('#view-photos-link');
    viewLink?.addEventListener('click', () => {
      window.location.href = '/#/photos';
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
