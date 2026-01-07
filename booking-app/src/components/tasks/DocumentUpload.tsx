'use client';

import { useState, useRef } from 'react';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { Upload, X, FileText, Image as ImageIcon, File, CheckCircle } from 'lucide-react';

interface DocumentUploadProps {
  taskId: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ taskId, onUploadComplete }: DocumentUploadProps) {
  const { completeTask } = useTaskMutations();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Implement attachment query when attachments are migrated to Supabase
  const attachments: any[] = [];

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

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);

    for (const file of files) {
      try {
        // Convert file to base64 for storage
        const base64 = await fileToBase64(file);

        // TODO: Implement attachment upload when attachments are migrated to Supabase
        // addAttachment({
        //   taskId,
        //   fileName: file.name,
        //   fileType: file.type,
        //   fileSize: file.size,
        //   fileData: base64,
        //   uploadedBy: 'current-user', // TODO: Get from auth store
        //   uploadedByName: 'Current User',
        //   documentType: inferDocumentType(file.name),
        // });

        console.log('✅ [Document Upload] Uploaded:', file.name);
      } catch (error) {
        console.error('❌ [Document Upload] Failed:', file.name, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    onUploadComplete?.();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const inferDocumentType = (
    fileName: string
  ): 'booking_confirmation' | 'invoice' | 'voucher' | 'receipt' | 'correspondence' | 'other' => {
    const lower = fileName.toLowerCase();
    if (lower.includes('confirmation') || lower.includes('booking')) {
      return 'booking_confirmation';
    }
    if (lower.includes('invoice')) {
      return 'invoice';
    }
    if (lower.includes('voucher')) {
      return 'voucher';
    }
    if (lower.includes('receipt')) {
      return 'receipt';
    }
    return 'other';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCompleteTask = () => {
    if (attachments.length > 0) {
      completeTask.mutate({
        id: taskId,
        completionNotes: `Uploaded ${attachments.length} document(s)`
      });
      onUploadComplete?.();
    } else {
      alert('Please upload at least one document before completing');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
          dragActive
            ? 'border-clio-blue bg-clio-blue/5'
            : 'border-clio-gray-200 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 bg-clio-gray-50 dark:bg-clio-gray-900/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />

        <div className="w-16 h-16 bg-white dark:bg-clio-gray-900 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
          <Upload className={`w-8 h-8 ${dragActive ? 'text-clio-blue' : 'text-clio-gray-400'}`} />
        </div>

        <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">
          Upload Confirmation
        </h3>

        <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest mb-8">
          Drag and drop assets here, or browse local files
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-8 py-3 bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-clio-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </div>
          ) : 'Index Files'}
        </button>

        <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mt-6">
          Supported: PDF, JPG, PNG, DOC • Max 10MB per file
        </p>
      </div>

      {/* Uploaded Files List */}
      {attachments.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Vaulted Documents</h4>

          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-6 p-6 bg-white dark:bg-clio-gray-900 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl shadow-sm group"
            >
              {/* File Icon */}
              <div className="w-12 h-12 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-xl flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-700">
                {getFileIcon(attachment.fileType)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight truncate">
                  {attachment.fileName}
                </p>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mt-1">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span className="w-1 h-1 bg-clio-gray-200 dark:bg-clio-gray-700 rounded-full" />
                  <span className="text-clio-blue">
                    {attachment.documentType?.replace('_', ' ')}
                  </span>
                  <span className="w-1 h-1 bg-clio-gray-200 dark:bg-clio-gray-700 rounded-full" />
                  <span>
                    Indexed {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Preview/Download */}
              {attachment.fileData && (
                <a
                  href={attachment.fileData}
                  download={attachment.fileName}
                  className="h-10 px-4 bg-clio-gray-50 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-300 border border-clio-gray-100 dark:border-clio-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-clio-gray-100 dark:hover:bg-clio-gray-700 transition-colors flex items-center"
                >
                  Download
                </a>
              )}
            </div>
          ))}

          {/* Complete Task Button */}
          <button
            onClick={handleCompleteTask}
            className="w-full mt-6 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-lg shadow-green-600/20 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Finalize Task • {attachments.length} Assets
          </button>
        </div>
      )}
    </div>
  );
}
