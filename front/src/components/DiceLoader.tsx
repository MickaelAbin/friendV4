import { motion } from 'framer-motion';
import styles from './DiceLoader.module.sass';

export const DiceLoader = () => {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.die}
        animate={{
          rotateX: [0, 360, 720],
          rotateY: [0, 360, 720],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <div className={styles.face}>
          <span className={styles.dot}></span>
        </div>
      </motion.div>
      <p className={styles.text}>Lancement de la partie...</p>
    </div>
  );
};
