import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

const getRadianAngle = (deg) => (deg * Math.PI) / 180;
const OUTPUT_SIZE = 256; // Fixed avatar size

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, shape = "round") {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);

  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));

  const newWidth = Math.floor(image.width * cos + image.height * sin);
  const newHeight = Math.floor(image.width * sin + image.height * cos);

  const tempCanvas = document.createElement("canvas");
  const tctx = tempCanvas.getContext("2d");
  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;

  tctx.translate(newWidth / 2, newHeight / 2);
  tctx.rotate(rotRad);
  tctx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: shape === "round" });
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  // Clear canvas (transparent for round, white for square)
  if (shape === "round") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Scale and draw the cropped area
  ctx.drawImage(
    tempCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  // Draw circle mask for round avatars
  if (shape === "round") {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise((resolve) => {
    const mimeType = shape === "round" ? "image/png" : "image/jpeg";
    const filename = shape === "round" ? "avatar.png" : "avatar.jpg";
    const quality = shape === "round" ? undefined : 0.9;

    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], filename, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve({ blob, file, url });
      },
      mimeType,
      quality
    );
  });
}

const AvatarCropper = ({ imageSrc, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [shape, setShape] = useState("round");

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, shape);
    if (result) onConfirm(result);
  }, [imageSrc, croppedAreaPixels, rotation, shape, onConfirm]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-[fadeIn_120ms_ease-in]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Crop your avatar</h3>
            <p className="text-xs text-gray-500">Drag and zoom to select the visible area</p>
          </div>
          <button aria-label="Close" onClick={onCancel} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full h-80 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape={shape}
          />
        </div>
        {/* Controls */}
        <div className="flex flex-col gap-4 p-4 border-t border-gray-100">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-16">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          {/* Rotation */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-16">Rotate</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              aria-label="Rotation"
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{rotation}°</span>
            <div className="flex items-center gap-1 ml-2">
              <button className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setRotation((r) => (r - 90 + 360) % 360 - 180)} title="Rotate -90°">-90°</button>
              <button className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setRotation((r) => (r + 90 + 360) % 360 - 180)} title="Rotate +90°">+90°</button>
            </div>
          </div>
          {/* Shape toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-16">Shape</span>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                className={`px-3 py-1 text-xs transition-colors ${shape === 'round' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setShape('round')}
                title="PNG with transparency"
              >Round (PNG)</button>
              <button
                className={`px-3 py-1 text-xs transition-colors ${shape === 'rect' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setShape('rect')}
                title="JPEG format"
              >Square (JPEG)</button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Use Photo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
