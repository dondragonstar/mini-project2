import { motion } from 'framer-motion';

const BlurText = ({ text, delay = 0, className = '' }) => {
    const words = text.split(' ');

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: i * delay },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            filter: 'blur(10px)',
            y: 20,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.div
            className={className}
            variants={container}
            initial="hidden"
            animate="visible"
            style={{ display: 'inline-block' }}
        >
            {words.map((word, index) => (
                <motion.span
                    variants={child}
                    style={{ display: 'inline-block', marginRight: '5px' }}
                    key={index}
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
};

export default BlurText;
