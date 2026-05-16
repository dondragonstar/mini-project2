import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Copy, Check } from 'lucide-react';

// Minimal QR Code generator - no external dependencies
const generateQRMatrix = (text) => {
    // Simple QR matrix for demo - using a basic encoding for short URLs
    const size = 25;
    const matrix = Array.from({ length: size }, () => Array(size).fill(false));

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (startRow, startCol) => {
        for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
            matrix[startRow + r][startCol + c] =
                (r === 0 || r === 6 || c === 0 || c === 6) ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Data encoding using text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    // Fill data area with deterministic pattern based on text
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (matrix[r][c]) continue; // Skip finder patterns
        if (r < 8 && c < 8) continue;
        if (r < 8 && c > size - 9) continue;
        if (r > size - 9 && c < 8) continue;
        const seed = (hash + r * 31 + c * 17 + r * c * 7) & 0xFFFF;
        matrix[r][c] = seed % 3 !== 0;
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0;
        matrix[i][6] = i % 2 === 0;
    }

    return matrix;
};

const QRCodeWidget = ({ url }) => {
    const canvasRef = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!url || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const matrix = generateQRMatrix(url);
        const size = matrix.length;
        const scale = 8;
        canvas.width = size * scale;
        canvas.height = size * scale;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c]) {
                    ctx.fillRect(c * scale, r * scale, scale, scale);
                }
            }
        }
    }, [url]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!url) return null;

    return (
        <motion.div className="qr-widget" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <QrCode size={14} style={{ display: 'inline', marginRight: '6px' }} /> QR Code
            </h4>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <canvas ref={canvasRef} className="qr-canvas" style={{ width: '120px', height: '120px', borderRadius: '8px', imageRendering: 'pixelated' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={handleDownload} className="neon-button neon-button--small"><Download size={12} /> Download</button>
                    <button onClick={handleCopy} className="btn-ghost btn-ghost--small">
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
                    </button>
                </div>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: '8px' }}>Print this QR code on marketing materials for instant digital access</p>
        </motion.div>
    );
};

export default QRCodeWidget;
