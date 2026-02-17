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
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 transform hover:scale-[1.02] ${
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer'
      } ${
        file 
          ? 'border-teal bg-gradient-to-br from-teal/5 to-teal/10 shadow-lg' 
          : 'border-gray-300 hover:border-teal hover:shadow-lg'
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
      <div className="text-teal mb-3">
        <HiOutlineCloudArrowUp className="w-14 h-14 mx-auto" />
      </div>
      <h3 className="font-bold text-gray-800 mb-2 text-lg">{label}</h3>
      {file ? (
        <div className="text-sm text-teal font-semibold mt-3 px-3 py-2 bg-white rounded-lg shadow-sm">
          ✓ {file.name}
        </div>
      ) : (
        <p className="text-sm text-gray-500 font-medium">Drag & drop or click to upload CSV</p>
      )}
    </div>
  );
};

export default FileUploadBox;
