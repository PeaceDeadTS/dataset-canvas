import { Dialog, DialogContent } from './ui/dialog';

interface MarkdownImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MarkdownImageModal({ src, alt, isOpen, onClose }: MarkdownImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

