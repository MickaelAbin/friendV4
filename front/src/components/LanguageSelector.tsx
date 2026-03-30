import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import s from '../styles/LanguageSelector.module.sass'

const languages = [
  { code: 'fr', label: 'Français', flag: 'https://hatscripts.github.io/circle-flags/flags/fr.svg' },
  { code: 'en', label: 'English', flag: 'https://hatscripts.github.io/circle-flags/flags/gb.svg' },
  { code: 'es', label: 'Español', flag: 'https://hatscripts.github.io/circle-flags/flags/es.svg' },
  { code: 'de', label: 'Deutsch', flag: 'https://hatscripts.github.io/circle-flags/flags/de.svg' },
  { code: 'zh', label: '中文', flag: 'https://hatscripts.github.io/circle-flags/flags/cn.svg' }
]

export const LanguageSelector = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0]

  const toggleDropdown = () => setIsOpen(!isOpen)

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={s.languageSelector} ref={dropdownRef}>
      <button className={s.triggerBtn} onClick={toggleDropdown} aria-haspopup="listbox" aria-expanded={isOpen}>
        <img src={currentLang.flag} alt={currentLang.label} className={s.flagImg} />
        <span className={`${s.arrow} ${isOpen ? s.open : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={s.dropdownMenu} role="listbox">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`${s.langOption} ${i18n.resolvedLanguage === lang.code ? s.active : ''}`}
              onClick={() => selectLanguage(lang.code)}
              role="option"
              aria-selected={i18n.resolvedLanguage === lang.code}
            >
              <img src={lang.flag} alt={lang.label} className={s.flagImg} />
              <span className={s.label}>{lang.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
