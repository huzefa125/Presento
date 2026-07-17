import React from 'react';

const MiroResult = ({ slide, data }) => {
  const totalResponses = data?.totalResponses || 0;
  
  return (
    <div className="space-y-6">
      <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2A2A2A]">
        <h3 className="text-xl font-semibold text-white mb-4">Miro Board Interaction</h3>
        
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-300 mb-2">Question/Instruction</h4>
          <p className="text-gray-400">
            {typeof slide.question === 'string' 
              ? slide.question 
              : (slide.question?.text || slide.question?.label || '')}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-300 mb-2">Miro Board</h4>
          <div className="aspect-video bg-[#2A2A2A] rounded-lg flex items-center justify-center border border-[#3B3B3B]">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-400">Miro Board Embedded</p>
              <p className="text-sm text-gray-500 mt-1">Participants can interact with the board</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
            <div className="text-2xl font-bold text-teal-400">{totalResponses}</div>
            <div className="text-sm text-gray-400">Total Interactions</div>
          </div>
          <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
            <div className="text-2xl font-bold text-blue-400">Miro</div>
            <div className="text-sm text-gray-400">Board Type</div>
          </div>
          <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
            <div className="text-2xl font-bold text-purple-400">Collaborative</div>
            <div className="text-sm text-gray-400">Interaction Mode</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiroResult;