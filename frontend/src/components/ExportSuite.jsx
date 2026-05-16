import { useState, useRef } from 'react';
import { Download, FileText, Image as ImageIcon, Share2, Check } from 'lucide-react';

const ExportSuite = ({ script, imageUrl, brandName, visualPrompt }) => {
    const [exporting, setExporting] = useState('');
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef(null);

    const copyToClipboard = () => {
        const full = `${script}\n\n---\nVisual Prompt: ${visualPrompt || ''}`;
        navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadImage = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${brandName || 'content'}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportAsText = () => {
        const content = `Content Studio AI - Generated Content\n${'='.repeat(40)}\n\nBrand: ${brandName}\n\n--- SCRIPT ---\n${script}\n\n--- VISUAL PROMPT ---\n${visualPrompt || 'N/A'}\n\n--- Generated on ${new Date().toLocaleString('en-IN')} ---`;
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${brandName || 'content'}-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const exportAsPNG = async () => {
        setExporting('png');
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f3460');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);

            // Brand name
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 28px Inter, Arial, sans-serif';
            ctx.fillText(brandName || 'Content Studio AI', 60, 80);

            // Decorative line
            const lineGrad = ctx.createLinearGradient(60, 100, 400, 100);
            lineGrad.addColorStop(0, '#a855f7');
            lineGrad.addColorStop(1, '#ec4899');
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(60, 100);
            ctx.lineTo(400, 100);
            ctx.stroke();

            // Script text
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '22px Inter, Arial, sans-serif';
            const words = script.split(' ');
            let line = '';
            let y = 160;
            const maxWidth = 960;
            for (const word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line, 60, y);
                    line = word + ' ';
                    y += 36;
                    if (y > 900) { ctx.fillText('...', 60, y); break; }
                } else {
                    line = testLine;
                }
            }
            if (y <= 900) ctx.fillText(line, 60, y);

            // Footer
            ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
            ctx.font = '16px Inter, Arial, sans-serif';
            ctx.fillText('✨ Content Studio AI', 60, 1040);

            // Download
            const link = document.createElement('a');
            link.download = `${brandName || 'content'}-poster-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('PNG export failed:', e);
        } finally {
            setExporting('');
        }
    };

    return (
        <div className="export-suite">
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>Export & Share</h4>
            <div className="export-buttons">
                <button onClick={copyToClipboard} className="export-btn" title="Copy to clipboard">
                    {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy All'}</span>
                </button>
                <button onClick={exportAsText} className="export-btn" title="Download as text file">
                    <FileText size={16} />
                    <span>Text File</span>
                </button>
                <button onClick={exportAsPNG} className="export-btn" disabled={exporting === 'png'} title="Export as poster PNG">
                    <ImageIcon size={16} />
                    <span>{exporting === 'png' ? 'Creating...' : 'Poster PNG'}</span>
                </button>
                {imageUrl && (
                    <button onClick={downloadImage} className="export-btn" title="Download generated image">
                        <Download size={16} />
                        <span>Image</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExportSuite;
