import React, { useState, useRef } from 'react';
import { Image, X, Upload, Camera } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  maxSize?: number; // MB 단위
  acceptedTypes?: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  maxSize = 5, // 기본 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // 파일 크기 검증
    if (file.size > maxSize * 1024 * 1024) {
      setError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
      return false;
    }

    // 파일 타입 검증
    if (!acceptedTypes.includes(file.type)) {
      setError('지원하지 않는 이미지 형식입니다.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
      onImageUpload(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
    }
    setSelectedImage(null);
    setPreviewURL(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!previewURL ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG, GIF, WebP (최대 {maxSize}MB)
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={openFileDialog}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                파일 선택
              </button>
              <button
                type="button"
                onClick={openCamera}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Camera size={16} />
                <span>카메라</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={previewURL}
              alt="미리보기"
              className="max-w-full max-h-64 rounded-lg mx-auto"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* 숨겨진 카메라 입력 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
};
