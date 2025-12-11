import { v4 as uuidv4 } from 'uuid'

export class SessionManager {
  private static readonly USER_ID_KEY = 'esilv-chatbot-user-id'
  private static readonly SESSION_ID_KEY = 'esilv-chatbot-session-id'

  /**
   * Génère ou récupère l'ID utilisateur unique pour cette session
   */
  static getUserId(): string {
    if (typeof window === 'undefined') {
      return 'server-user'
    }

    let userId = localStorage.getItem(this.USER_ID_KEY)
    
    if (!userId) {
      userId = `user-${uuidv4()}`
      localStorage.setItem(this.USER_ID_KEY, userId)
      console.log('✨ Nouvel utilisateur créé:', userId)
    }

    return userId
  }

  /**
   * Génère un nouvel ID de session pour chaque conversation
   */
  static getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session'
    }

    let sessionId = sessionStorage.getItem(this.SESSION_ID_KEY)
    
    if (!sessionId) {
      sessionId = `session-${uuidv4()}`
      sessionStorage.setItem(this.SESSION_ID_KEY, sessionId)
      console.log('🔄 Nouvelle session créée:', sessionId)
    }

    return sessionId
  }

  /**
   * Réinitialise la session (nouvelle conversation)
   */
  static resetSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.SESSION_ID_KEY)
      console.log('🔄 Session réinitialisée')
    }
  }

  /**
   * Réinitialise complètement l'utilisateur (nouvelle identité)
   */
  static resetUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_ID_KEY)
      sessionStorage.removeItem(this.SESSION_ID_KEY)
      console.log('👤 Utilisateur réinitialisé')
    }
  }

  /**
   * Obtient les informations de la session actuelle
   */
  static getSessionInfo() {
    return {
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString()
    }
  }
}

