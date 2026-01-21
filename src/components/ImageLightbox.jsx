const ImageLightbox = ({ imageSrc, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-label="Image preview"
    >
      <div
        className="relative max-w-3xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <img
          src={imageSrc}
          alt="Preview"
          className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
