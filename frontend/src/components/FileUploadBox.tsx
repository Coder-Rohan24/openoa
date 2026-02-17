import { useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { HiOutlineCloudArrowUp } from 'react-icons/hi2';

interface FileUploadBoxProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  label: string;
  accept?: string;
  disabled?: boolean;
}

const FileUploadBox = ({ 
  file, 
  onFileChange, 
  label, 
  accept = '.csv',
  disabled = false 
}: FileUploadBoxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(accept.replace('.', ''))) {
        onFileChange(droppedFile);
      }
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 hover-lift ${
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/50'
      } ${
        file 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      <div className={`mb-3 ${file ? 'text-blue-600' : 'text-gray-400'}`}>
        <HiOutlineCloudArrowUp className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
      {file ? (
        <div className="text-sm text-blue-600 font-medium mt-2 px-3 py-1.5 bg-white rounded border border-blue-200">
          ✓ {file.name}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Drag & drop or click to upload CSV</p>
      )}
    </div>
  );
};

export default FileUploadBox;
