import { useState, useEffect } from 'react';
import { BookOpen, Lock } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const InstructionEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas text-ink">
      <SlideTypeHeader type="instruction" />

      <div className="p-6 border-b border-hairline">
        <div className="flex items-center justify-center mb-4">
          <Lock className="h-5 w-5 text-accent-orange mr-2" />
          <h3 className="text-lg font-semibold text-ink">{t('slide_editors.instruction.non_editable_title')}</h3>
        </div>
        <p className="text-sm text-ink-secondary text-center">
          {t('slide_editors.instruction.non_editable_description')}
        </p>
      </div>

      <div className="p-6">
        <div className="bg-canvas-soft border border-hairline rounded-lg p-4">
          <h4 className="text-md font-semibold text-ink mb-3 flex items-center">
            <BookOpen className="h-4 w-4 text-accent-teal mr-2" />
            {t('slide_editors.instruction.instructions_title')}
          </h4>
          <div className="text-sm text-ink-secondary space-y-3">
            <p>{t('slide_editors.instruction.instructions_description')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('slide_editors.instruction.instruction_item_1')}</li>
              <li>{t('slide_editors.instruction.instruction_item_2')}</li>
              <li>{t('slide_editors.instruction.instruction_item_3')}</li>
              <li>{t('slide_editors.instruction.instruction_item_4')}</li>
            </ul>
            <p className="pt-2">{t('slide_editors.instruction.content_note')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionEditor;