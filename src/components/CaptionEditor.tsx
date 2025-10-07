import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Save, X } from 'lucide-react';

interface CaptionEditorProps {
  initialCaption: string;
  onSave: (newCaption: string) => Promise<void>;
  onCancel: () => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  initialCaption,
  onSave,
  onCancel,
}) => {
  const [caption, setCaption] = useState(initialCaption);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (caption.trim() === initialCaption.trim()) {
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(caption);
    } catch (error) {
      console.error('Error saving caption:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter или Cmd+Enter для сохранения
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape для отмены
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[150px] resize-y"
        placeholder="Введите описание изображения..."
        autoFocus
        disabled={isSaving}
      />
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {caption.length} символов
        </span>
        <span className="text-xs">
          💡 Ctrl+Enter - сохранить, Esc - отмена
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1" />
          Отмена
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || caption.trim() === initialCaption.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

