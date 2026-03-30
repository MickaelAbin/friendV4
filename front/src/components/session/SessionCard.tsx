import { format } from "date-fns"
import { fr, enUS, de, es, zhCN } from "date-fns/locale"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { Session } from "../../api/types"
import { useAuth } from "../../authentication/useAuth"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { respondParticipation } from "../../api/sessions"
import { queryKeys } from "../../store/queryKeys"

const dateLocaleMap: Record<string, any> = {
  fr,
  en: enUS,
  es,
  de,
  zh: zhCN
}

interface SessionCardProps {
  session: Session
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const currentLocale = dateLocaleMap[i18n.language] || fr
  const date = format(new Date(session.startDatetime), t('sessionDetail.dateFormat'), { locale: currentLocale })
  const attendeeCount = (session.participants?.length ?? 0) + 1
  const gamesCount = session.games?.length ?? 0
  const isOrganizer = user?.id === session.organizerId
  const myParticipation = session.participants?.find((p) => p.userId === user?.id)
  const canJoin = !isOrganizer && (myParticipation == null || myParticipation.statusInvitation !== 'ACCEPTED')
  const canLeave = !isOrganizer && myParticipation?.statusInvitation === 'ACCEPTED'
  const canView = isOrganizer || myParticipation?.statusInvitation === 'ACCEPTED'
  const queryClient = useQueryClient()
  const joinMutation = useMutation({
    mutationFn: async () => {
      if (myParticipation == null) {
        const { joinSession } = await import('../../api/sessions')
        return joinSession(session.id)
      }
      return respondParticipation(session.id, 'ACCEPTED')
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: ["sessions", "discover"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session(session.id) })
      ])
    }
  })

  const leaveMutation = useMutation({
    mutationFn: () => respondParticipation(session.id, 'DECLINED'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: ["sessions", "discover"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session(session.id) })
      ])
    }
  })

  return (
    <article className="card session-card">
      <header>
        <h3>{session.title}</h3>
        <span className={`status status-${session.status.toLowerCase()}`}>{session.status}</span>
      </header>
      <p className="session-meta">{date}</p>
      <p className="session-meta">{session.location}</p>
      <div className="session-stats">
        <span>{attendeeCount} {t('common.participants')}</span>
        <span>{gamesCount} {t('common.games')}</span>
      </div>
      <div className="form-actions">
        {canView && (
          <Link className="btn secondary" to={`/sessions/${session.id}`}>
            {t('common.viewMore')}
          </Link>
        )}
        {isOrganizer && (
          <Link className="btn" to={`/sessions/${session.id}/edit`}>
            {t('common.modify')}
          </Link>
        )}
        {canJoin && (
          <button className="btn" type="button" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
            {t('common.join')}
          </button>
        )}
        {canLeave && (
          <button className="btn" type="button" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
            {t('common.leave')}
          </button>
        )}
      </div>
    </article>
  )
}
