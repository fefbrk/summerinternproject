import React from 'react';

export interface DeleteItem {
  type: string;
  id: string;
  name: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  item: DeleteItem | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-600">Silme Onayı</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            <strong>{item.name}</strong> öğesini silmek istediğinizden emin misiniz?
          </p>
          <p className="text-sm text-gray-500 mt-2">Bu işlem geri alınamaz.</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
