import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import {
  FileUp,
  Download,
  Type as TypeIcon,
  Highlighter,
  Square,
  Images,
  Signature as SignatureIcon,
  Link2,
  Hand,
  RotateCw,
  Copy,
  Trash2,
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore - pdfjs-dist types are optional
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js`;

// Simple UI wrappers based on daisyUI
const Button = ({
  className = '',
  variant = 'primary',
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'destructive'; size?: 'icon' }) => (
  <button
    className={`btn ${
      variant === 'secondary'
        ? 'btn-secondary'
        : variant === 'destructive'
        ? 'btn-error'
        : 'btn-primary'
    } ${size === 'icon' ? 'btn-square btn-sm' : ''} ${className}`}
    {...props}
  />
);

const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`card bg-base-100 shadow ${className}`}>{children}</div>
);

const CardContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => <input ref={ref} className={`input input-bordered ${className}`} {...props} />
);
Input.displayName = 'Input';

const ToggleGroup = ({ value, onValueChange, children }: any) => (
  <div className="btn-group">
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { activeValue: value, onValueChange })
    )}
  </div>
);

const ToggleGroupItem = ({ value, activeValue, onValueChange, children }: any) => (
  <button
    className={`btn ${activeValue === value ? 'btn-active' : ''}`}
    onClick={() => onValueChange(value)}
  >
    {children}
  </button>
);

// Types
type Tool = 'pan' | 'text' | 'highlight' | 'rect' | 'image' | 'sign' | 'link';
type Annotation =
  | {
      id: string;
      type: 'text';
      pageIndex: number;
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
    }
  | {
      id: string;
      type: 'highlight';
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      opacity: number;
    }
  | {
      id: string;
      type: 'rect';
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      stroke: string;
      fill?: string;
      opacity: number;
      strokeWidth: number;
    }
  | {
      id: string;
      type: 'image';
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      dataUrl: string;
    }
  | {
      id: string;
      type: 'sign';
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      dataUrl: string;
    }
  | {
      id: string;
      type: 'link';
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      url: string;
    };

type PageThumb = { pageIndex: number; rotation: number; canvas: HTMLCanvasElement | null };

const uid = () => Math.random().toString(36).slice(2);

// Simple signature pad
const SignaturePad = ({ onDone }: { onDone: (dataUrl: string) => void }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [w, h] = [600, 200];
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);
  const onPointerDown = (e: React.PointerEvent) => {
    drawing.current = true;
    const rect = ref.current!.getBoundingClientRect();
    const ctx = ref.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const rect = ref.current!.getBoundingClientRect();
    const ctx = ref.current!.getContext('2d')!;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const onPointerUp = () => {
    drawing.current = false;
  };
  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        width={w}
        height={h}
        className="border rounded-xl bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            const c = ref.current!;
            const ctx = c.getContext('2d')!;
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, c.width, c.height);
          }}
        >
          Clear
        </Button>
        <Button
          onClick={() => {
            if (ref.current) onDone(ref.current.toDataURL('image/png'));
          }}
        >
          Save signature
        </Button>
      </div>
    </div>
  );
};

export default function PdfEditorPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfPages, setPdfPages] = useState<{ width: number; height: number }[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [pageRots, setPageRots] = useState<Record<number, number>>({});
  const [scale, setScale] = useState(1);
  const [activeTool, setActiveTool] = useState<Tool>('pan');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [draggingThumb, setDraggingThumb] = useState<number | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingSign, setPendingSign] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#111111');
  const [rectStroke, setRectStroke] = useState('#111111');
  const [rectFill, setRectFill] = useState('');
  const [rectOpacity, setRectOpacity] = useState(0.1);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [highlightOpacity, setHighlightOpacity] = useState(0.3);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [showSignModal, setShowSignModal] = useState(false);

  const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);

  const onOpen = async (file?: File) => {
    try {
      const f = file ?? fileInputRef.current?.files?.[0];
      if (!f) return;
      const bytes = await f.arrayBuffer();
      setPdfBytes(bytes);

      const doc = await PDFDocument.load(bytes);
      setPdfDoc(doc);

      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const pages: { width: number; height: number }[] = [];
      canvasesRef.current = Array(pdf.numPages).fill(null);
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({ width: viewport.width, height: viewport.height });
      }
      setPdfPages(pages);
      setPageOrder(Array.from({ length: pages.length }, (_, i) => i));
      setSelectedPage(0);
      setAnnotations([]);
      setPageRots({});
    } catch (e) {
      console.error(e);
      alert('Failed to open PDF.');
    }
  };

  const renderPage = async (visualIndex: number) => {
    if (!pdfBytes) return;
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const pageIndex = pageOrder[visualIndex] ?? visualIndex;
    const page = await pdf.getPage(pageIndex + 1);
    const rotation = (pageRots[pageIndex] || 0) % 360;
    const vp = page.getViewport({ scale, rotation });

    const canvas = canvasesRef.current[visualIndex];
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = vp.width;
    canvas.height = vp.height;

    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  };

  useEffect(() => {
    (async () => {
      for (let i = 0; i < pageOrder.length; i++) await renderPage(i);
    })();
  }, [scale, pageOrder, pageRots, pdfBytes]);

  const onPageClick = (e: React.MouseEvent, visualIndex: number) => {
    if (activeTool === 'pan') return;
    const canvas = canvasesRef.current[visualIndex];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pageIndex = pageOrder[visualIndex] ?? visualIndex;

    if (activeTool === 'text') {
      if (!currentText.trim()) return;
      const annot: Annotation = {
        id: uid(),
        type: 'text',
        pageIndex,
        x,
        y,
        text: currentText,
        fontSize,
        color: textColor,
      };
      setAnnotations((a) => [...a, annot]);
      setCurrentText('');
      return;
    }
    if (activeTool === 'image' && pendingImage) {
      const img = new Image();
      img.onload = () => {
        const scaleFit = 200 / img.width;
        const w = img.width * scaleFit;
        const h = img.height * scaleFit;
        const annot: Annotation = {
          id: uid(),
          type: 'image',
          pageIndex,
          x,
          y,
          w,
          h,
          dataUrl: pendingImage,
        };
        setAnnotations((a) => [...a, annot]);
      };
      img.src = pendingImage;
      return;
    }
    if (activeTool === 'sign' && pendingSign) {
      const img = new Image();
      img.onload = () => {
        const scaleFit = 250 / img.width;
        const w = img.width * scaleFit;
        const h = img.height * scaleFit;
        const annot: Annotation = {
          id: uid(),
          type: 'sign',
          pageIndex,
          x,
          y,
          w,
          h,
          dataUrl: pendingSign,
        };
        setAnnotations((a) => [...a, annot]);
      };
      img.src = pendingSign;
      return;
    }
    if (activeTool === 'link') {
      const annot: Annotation = {
        id: uid(),
        type: 'link',
        pageIndex,
        x: x - 50,
        y: y - 16,
        w: 100,
        h: 32,
        url: linkUrl,
      } as any;
      setAnnotations((a) => [...a, annot]);
      return;
    }
  };

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    page: number;
    type: 'highlight' | 'rect' | null;
  } | null>(null);

  const onOverlayPointerDown = (e: React.PointerEvent, visualIndex: number) => {
    if (!(activeTool === 'highlight' || activeTool === 'rect')) return;
    const canvas = canvasesRef.current[visualIndex];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      page: visualIndex,
      type: activeTool,
    };
  };
  const onOverlayPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const canvas = canvasesRef.current[dragState.current.page];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(dragState.current.startX, e.clientX - rect.left);
    const y = Math.min(dragState.current.startY, e.clientY - rect.top);
    const w = Math.abs(e.clientX - rect.left - dragState.current.startX);
    const h = Math.abs(e.clientY - rect.top - dragState.current.startY);

    if (overlayRef.current) {
      overlayRef.current.style.setProperty('--sel-x', `${x}px`);
      overlayRef.current.style.setProperty('--sel-y', `${y}px`);
      overlayRef.current.style.setProperty('--sel-w', `${w}px`);
      overlayRef.current.style.setProperty('--sel-h', `${h}px`);
      overlayRef.current.classList.add('show-box');
    }
  };
  const onOverlayPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const visualIndex = dragState.current.page;
    const canvas = canvasesRef.current[visualIndex];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(dragState.current.startX, e.clientX - rect.left);
    const y = Math.min(dragState.current.startY, e.clientY - rect.top);
    const w = Math.abs(e.clientX - rect.left - dragState.current.startX);
    const h = Math.abs(e.clientY - rect.top - dragState.current.startY);
    const pageIndex = pageOrder[visualIndex] ?? visualIndex;

    if (dragState.current.type === 'highlight') {
      const annot: Annotation = {
        id: uid(),
        type: 'highlight',
        pageIndex,
        x,
        y,
        w,
        h,
        color: highlightColor,
        opacity: highlightOpacity,
      } as any;
      setAnnotations((a) => [...a, annot]);
    } else if (dragState.current.type === 'rect') {
      const annot: Annotation = {
        id: uid(),
        type: 'rect',
        pageIndex,
        x,
        y,
        w,
        h,
        stroke: rectStroke,
        fill: rectFill || undefined,
        opacity: rectOpacity,
        strokeWidth,
      } as any;
      setAnnotations((a) => [...a, annot]);
    }
    dragState.current = null;
    overlayRef.current?.classList.remove('show-box');
  };

  const rotatePage = (idx: number) => {
    const pageIndex = pageOrder[idx];
    setPageRots((prev) => ({
      ...prev,
      [pageIndex]: ((prev[pageIndex] || 0) + 90) % 360,
    }));
  };
  const deletePage = (idx: number) => {
    const pageIndex = pageOrder[idx];
    setPageOrder((order) => order.filter((_, i) => i !== idx));
    setAnnotations((a) => a.filter((x) => x.pageIndex !== pageIndex));
    if (selectedPage >= pageOrder.length - 1)
      setSelectedPage(Math.max(0, pageOrder.length - 2));
  };
  const duplicatePage = (idx: number) => {
    const pageIndex = pageOrder[idx];
    setPageOrder((order) => {
      const arr = [...order];
      arr.splice(idx + 1, 0, pageIndex);
      return arr;
    });
  };

  const onThumbDragStart = (i: number) => setDraggingThumb(i);
  const onThumbDrop = (i: number) => {
    if (draggingThumb == null) return;
    setPageOrder((order) => {
      const arr = [...order];
      const [m] = arr.splice(draggingThumb, 1);
      arr.splice(i, 0, m);
      return arr;
    });
    setDraggingThumb(null);
  };

  const onExport = async () => {
    if (!pdfDoc) return;
    const working = await PDFDocument.load(await pdfDoc.save());
    const finalDoc = await PDFDocument.create();
    const srcPages = await finalDoc.copyPages(working, pageOrder);
    srcPages.forEach((p) => finalDoc.addPage(p));

    pageOrder.forEach((srcIdx, visualIdx) => {
      const rot = pageRots[srcIdx] || 0;
      if (rot) {
        const p = finalDoc.getPage(visualIdx);
        p.setRotation(((rot * Math.PI) / 180) as any);
      }
    });

    const helv = await finalDoc.embedFont(StandardFonts.Helvetica);

    for (const a of annotations) {
      const visualPos = pageOrder.indexOf(a.pageIndex);
      if (visualPos === -1) continue;
      const page = finalDoc.getPage(visualPos);
      const { width, height } = page.getSize();
      const toPdfY = (y: number, h: number) => height - (y + h);

      if (a.type === 'text') {
        const size = a.fontSize;
        page.drawText(a.text, {
          x: a.x,
          y: height - a.y - size,
          size,
          font: helv,
          color: rgb(
            parseInt(a.color.slice(1, 3), 16) / 255,
            parseInt(a.color.slice(3, 5), 16) / 255,
            parseInt(a.color.slice(5, 7), 16) / 255
          ),
        });
      }
      if (a.type === 'highlight') {
        page.drawRectangle({
          x: a.x,
          y: toPdfY(a.y, a.h),
          width: a.w,
          height: a.h,
          color: rgb(
            parseInt(a.color.slice(1, 3), 16) / 255,
            parseInt(a.color.slice(3, 5), 16) / 255,
            parseInt(a.color.slice(5, 7), 16) / 255
          ),
          opacity: a.opacity,
        });
      }
      if (a.type === 'rect') {
        const fill = a.fill
          ? rgb(
              parseInt(a.fill.slice(1, 3), 16) / 255,
              parseInt(a.fill.slice(3, 5), 16) / 255,
              parseInt(a.fill.slice(5, 7), 16) / 255
            )
          : undefined;
        const stroke = a.stroke
          ? rgb(
              parseInt(a.stroke.slice(1, 3), 16) / 255,
              parseInt(a.stroke.slice(3, 5), 16) / 255,
              parseInt(a.stroke.slice(5, 7), 16) / 255
            )
          : undefined;
        page.drawRectangle({
          x: a.x,
          y: toPdfY(a.y, a.h),
          width: a.w,
          height: a.h,
          color: fill,
          borderColor: stroke,
          opacity: a.opacity,
          borderWidth: a.strokeWidth,
        });
      }
      if (a.type === 'image' || a.type === 'sign') {
        const imgBytes = await fetch(a.dataUrl).then((r) => r.arrayBuffer());
        const isPng = a.dataUrl.startsWith('data:image/png');
        const embedded = isPng
          ? await finalDoc.embedPng(imgBytes)
          : await finalDoc.embedJpg(imgBytes);
        page.drawImage(embedded, {
          x: a.x,
          y: toPdfY(a.y, a.h),
          width: a.w,
          height: a.h,
        });
      }
      if (a.type === 'link') {
        page.drawRectangle({
          x: a.x,
          y: toPdfY(a.y, a.h),
          width: a.w,
          height: a.h,
          borderColor: rgb(0, 0.3, 1),
          borderWidth: 1,
          opacity: 0.6,
        });
        page.drawText(a.url, {
          x: a.x + 4,
          y: toPdfY(a.y, a.h) + a.h / 2 - 6,
          size: 10,
          font: helv,
          color: rgb(0, 0.3, 1),
        });
      }
    }

    const bytes = await finalDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickImage = async (file?: File) => {
    const f = file ?? imageInputRef.current?.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      setPendingImage(c.toDataURL('image/png'));
      setActiveTool('image');
    };
    img.src = url;
  };

  const ToolToggle = () => (
    <ToggleGroup value={activeTool} onValueChange={(v: Tool) => setActiveTool(v)}>
      <ToggleGroupItem value="pan">
        <Hand className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="text">
        <TypeIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="highlight">
        <Highlighter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="rect">
        <Square className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="image">
        <Images className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="sign">
        <SignatureIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="link">
        <Link2 className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );

  const PropertiesPanel = () => (
    <div className="flex flex-wrap items-center gap-3">
      {activeTool === 'text' && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type text…"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-56"
          />
          <label className="text-sm">Size</label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value || '16'))}
            className="w-20"
          />
          <label className="text-sm">Color</label>
          <Input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-10 p-1"
          />
        </div>
      )}
      {activeTool === 'rect' && (
        <div className="flex items-center gap-2">
          <label className="text-sm">Stroke</label>
          <Input
            type="color"
            value={rectStroke}
            onChange={(e) => setRectStroke(e.target.value)}
            className="w-10 p-1"
          />
          <label className="text-sm">Fill</label>
          <Input
            type="color"
            value={rectFill}
            onChange={(e) => setRectFill(e.target.value)}
            className="w-10 p-1"
          />
          <label className="text-sm">Opacity</label>
          <Input
            type="number"
            step="0.05"
            value={rectOpacity}
            onChange={(e) => setRectOpacity(parseFloat(e.target.value || '0.1'))}
            className="w-20"
          />
          <label className="text-sm">Border</label>
          <Input
            type="number"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value || '2'))}
            className="w-20"
          />
        </div>
      )}
      {activeTool === 'highlight' && (
        <div className="flex items-center gap-2">
          <label className="text-sm">Color</label>
          <Input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="w-10 p-1"
          />
          <label className="text-sm">Opacity</label>
          <Input
            type="number"
            step="0.05"
            value={highlightOpacity}
            onChange={(e) => setHighlightOpacity(parseFloat(e.target.value || '0.3'))}
            className="w-24"
          />
        </div>
      )}
      {activeTool === 'image' && (
        <div className="flex items-center gap-2">
          <Input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={() => onPickImage()}
          />
        </div>
      )}
      {activeTool === 'sign' && (
        <Button variant="secondary" onClick={() => setShowSignModal(true)}>
          <SignatureIcon className="h-4 w-4 mr-2" /> Create signature
        </Button>
      )}
      {activeTool === 'link' && (
        <div className="flex items-center gap-2">
          <label className="text-sm">URL</label>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-80"
          />
        </div>
      )}
    </div>
  );

  const Thumbs = () => (
    <div className="h-[calc(100vh-140px)] overflow-y-auto pr-2">
      <div className="grid gap-3">
        {pageOrder.map((srcIndex, visualIndex) => (
          <div
            key={`${srcIndex}-${visualIndex}`}
            className="group relative"
            draggable
            onDragStart={() => onThumbDragStart(visualIndex)}
            onDrop={() => onThumbDrop(visualIndex)}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              className={`rounded-xl overflow-hidden border ${
                selectedPage === visualIndex ? 'border-primary' : 'border-base-200'
              }`}
              onClick={() => setSelectedPage(visualIndex)}
            >
              <canvas
                ref={(el) => {
                  canvasesRef.current[visualIndex] = el;
                  if (el) renderPage(visualIndex);
                }}
                className="w-full bg-white"
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Button size="icon" variant="secondary" onClick={() => rotatePage(visualIndex)}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" onClick={() => duplicatePage(visualIndex)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => deletePage(visualIndex)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout title="PDF Editor" fullWidth>
      <div className="border-b bg-base-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-2" /> Open PDF
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={() => onOpen()}
          />
          <div className="border-r h-6" />
          <ToolToggle />
          <div className="border-r h-6" />
          <PropertiesPanel />
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm">Zoom</label>
              <Input
                type="number"
                value={Math.round(scale * 100)}
                onChange={(e) =>
                  setScale(
                    Math.max(0.2, Math.min(4, parseInt(e.target.value || '100') / 100))
                  )
                }
                className="w-20"
              />
              <span className="text-sm">%</span>
            </div>
            <Button onClick={onExport}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card className="sticky top-[76px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Pages</div>
                <div className="text-xs text-base-content/60">Drag to reorder</div>
              </div>
              <Thumbs />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-9">
          <div className="bg-base-200 rounded-2xl p-4">
            {pageOrder.length === 0 && (
              <div className="p-20 text-center text-base-content/60">
                Open a PDF to start editing
              </div>
            )}
            {pageOrder.length > 0 && (
              <div className="flex flex-col items-center gap-6">
                {pageOrder.map((srcIdx, visualIdx) => (
                  <div key={`${srcIdx}-viewer-${visualIdx}`} className="relative select-none">
                    <canvas
                      ref={(el) => {
                        canvasesRef.current[visualIdx] = el;
                        if (el) renderPage(visualIdx);
                      }}
                      onClick={(e) => onPageClick(e, visualIdx)}
                      className="rounded-xl bg-white shadow"
                      style={{ cursor: activeTool === 'pan' ? 'grab' : 'crosshair' }}
                    />
                    <div
                      ref={overlayRef}
                      className="absolute inset-0"
                      onPointerDown={(e) => onOverlayPointerDown(e, visualIdx)}
                      onPointerMove={onOverlayPointerMove}
                      onPointerUp={onOverlayPointerUp}
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      {annotations
                        .filter((a) => a.pageIndex === srcIdx)
                        .map((a) => {
                          if (a.type === 'text')
                            return (
                              <div
                                key={a.id}
                                className="absolute"
                                style={{ left: a.x, top: a.y, color: a.color, fontSize: a.fontSize }}
                              >
                                {a.text}
                              </div>
                            );
                          if (a.type === 'highlight')
                            return (
                              <div
                                key={a.id}
                                className="absolute rounded-sm"
                                style={{
                                  left: a.x,
                                  top: a.y,
                                  width: a.w,
                                  height: a.h,
                                  background: a.color,
                                  opacity: a.opacity,
                                }}
                              />
                            );
                          if (a.type === 'rect')
                            return (
                              <div
                                key={a.id}
                                className="absolute"
                                style={{
                                  left: a.x,
                                  top: a.y,
                                  width: a.w,
                                  height: a.h,
                                  background: a.fill || 'transparent',
                                  opacity: a.opacity,
                                  border: `${a.strokeWidth}px solid ${a.stroke}`,
                                }}
                              />
                            );
                          if (a.type === 'image' || a.type === 'sign')
                            return (
                              <img
                                key={a.id}
                                src={a.dataUrl}
                                className="absolute"
                                style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
                                alt="annotation"
                              />
                            );
                          if (a.type === 'link')
                            return (
                              <a
                                key={a.id}
                                className="absolute pointer-events-auto"
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  left: a.x,
                                  top: a.y,
                                  width: a.w,
                                  height: a.h,
                                  border: '1px dashed #3b82f6',
                                  borderRadius: 6,
                                }}
                              />
                            );
                          return null;
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSignModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold mb-3">Draw your signature</h3>
            <SignaturePad
              onDone={(d) => {
                setPendingSign(d);
                setActiveTool('sign');
                setShowSignModal(false);
              }}
            />
            <div className="modal-action">
              <Button variant="secondary" onClick={() => setShowSignModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .show-box::before {
          content: '';
          position: absolute;
          left: var(--sel-x);
          top: var(--sel-y);
          width: var(--sel-w);
          height: var(--sel-h);
          border: 1px dashed #3b82f6;
          border-radius: 6px;
          pointer-events: none;
        }
      `}</style>
    </Layout>
  );
}

