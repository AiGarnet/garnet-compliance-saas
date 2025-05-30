import React, { useState } from 'react';
import VendorForm from './VendorForm';
import { VendorService } from '../lib/services/vendorService';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded?: (vendor: any) => void;
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose, onVendorAdded }) => {
  const [processing, setProcessing] = useState(false);

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  const handleSubmit = async (vendorData: any) => {
    setProcessing(true);
    try {
      const newVendor = await VendorService.createVendor(vendorData);
      
      if (newVendor && onVendorAdded) {
        onVendorAdded(newVendor);
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error; // Let the form handle the error
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={!processing ? onClose : undefined}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-headline">
                  Add New Vendor
                </h3>
                <div className="mt-2">
                  <VendorForm onSubmit={handleSubmit} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={!processing ? onClose : undefined}
              disabled={processing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVendorModal; 