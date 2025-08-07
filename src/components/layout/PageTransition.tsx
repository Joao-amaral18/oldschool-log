import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
    children: React.ReactNode
}

const pageVariants = {
    initial: {
        opacity: 0,
        x: 20,
        scale: 0.98
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        x: -20,
        scale: 0.98
    }
}

export function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation()

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
