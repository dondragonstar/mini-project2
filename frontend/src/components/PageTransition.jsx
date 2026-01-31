import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        y: -20,
        scale: 1.02
    }
};

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
};

const PageTransition = ({ children, className = "" }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
