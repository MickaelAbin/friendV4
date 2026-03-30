import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../styles/ConfirmModal.module.sass'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmModalProps) => {
  const { t } = useTranslation()
  const finalConfirmLabel = confirmLabel || t('common.delete')
  const finalCancelLabel = cancelLabel || t('common.cancel')
  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Décoration coins façon parchemin */}
        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />

        <div className={styles.iconWrap}>
          <span className={styles.icon}>🗑️</span>
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isPending}
          >
            {finalCancelLabel}
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? t('common.deleting') : finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
