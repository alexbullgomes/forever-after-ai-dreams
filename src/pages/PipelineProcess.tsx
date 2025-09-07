import React from 'react';

export default function PipelineProcess() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Pipeline Process</h1>
      <p className="text-gray-600 mt-2">
        Manage and track customer progress through the pipeline
      </p>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">New Lead & Negotiation</h3>
          <div className="text-xs text-gray-500">0 items</div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Closed Deal & Pre-Production</h3>
          <div className="text-xs text-gray-500">0 items</div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Production</h3>
          <div className="text-xs text-gray-500">0 items</div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Post-Production (Editing)</h3>
          <div className="text-xs text-gray-500">0 items</div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Delivery & Finalization</h3>
          <div className="text-xs text-gray-500">0 items</div>
        </div>
      </div>
    </div>
  );
}