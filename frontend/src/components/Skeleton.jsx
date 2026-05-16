import { motion } from 'framer-motion';

const Skeleton = ({ width = '100%', height = '20px', rounded = '8px', className = '' }) => (
    <motion.div
        className={`skeleton ${className}`}
        style={{
            width, height, borderRadius: rounded,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
);

export const CardSkeleton = () => (
    <div className="glass-card" style={{ padding: '24px' }}>
        <Skeleton height="24px" width="60%" />
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="14px" width="100%" />
            <Skeleton height="14px" width="80%" />
            <Skeleton height="14px" width="90%" />
        </div>
        <div style={{ marginTop: '20px' }}>
            <Skeleton height="200px" rounded="12px" />
        </div>
    </div>
);

export const GridSkeleton = ({ count = 6 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
);

export default Skeleton;
