export const LANG_KEY = 'climby_lang';
export const translations = {
            it: {
                landing: { tagline: "Esplora le pareti in 3D, scopri le vie e lascia il tuo feedback. La {{h}}community{{/h}} degli arrampicatori.", start: "Inizia", login: "Accedi", howItWorks: "Come funziona Climby", feature1Title: "Pareti in 3D", feature1Desc: "Esplora i settori della palestra in un viewer 3D interattivo: ruota, zoomma e muoviti sulla parete come dal vivo.", feature2Title: "Vie e gradi", feature2Desc: "Ogni via ha grado (5a–7a) e colore. Tocca gli hotspot sulla parete per vedere i dettagli e scegliere cosa provare.", feature3Title: "Voti e commenti", feature3Desc: "Valuta le vie con le stelle, leggi le recensioni della community e lascia il tuo feedback per aiutare gli altri." },
                auth: { yourName: "Il tuo Nome", firstName: "Nome", lastName: "Cognome", username: "Username pubblico", birthDate: "Data di nascita", city: "Città", usernameHint: "3-20 caratteri: lettere, numeri, _, -, . (gli spazi diventano _)", usernameAvailable: "Username disponibile", usernameChecking: "Verifica username...", usernameTaken: "Username già in uso", usernameInvalid: "Username non valido", gymName: "Nome della Palestra", email: "Email", password: "Password", hasAccount: "Hai già un account? Accedi", login: "Accedi", register: "Registrati", roleUser: "Scalatore", roleAdmin: "Gestore Palestra (Admin)" },
                common: { close: "Chiudi", noData: "Nessun dato disponibile." }, ownerRequest: { cta: "Sono il proprietario di una palestra", enterGymName: "Inserisci il nome della palestra.", sentSuccess: "Richiesta inviata con successo.", title: "Richiesta accesso proprietario", hint: "Inserisci i dati per richiedere l'accesso come proprietario palestra.", gymName: "Nome palestra", submit: "Invia richiesta" }, superadmin: { title: "Superadmin Dashboard", subtitle: "KPI globali aggregati (senza confrontare gradi assoluti tra palestre diverse).", performanceTitle: "KPI performance (grading-safe)", performanceHint: "Le metriche di performance sono calcolate internamente a ciascuna palestra e poi aggregate.", behaviorTitle: "KPI comportamentali", cityTitle: "Distribuzione difficoltà per città (percentuali interne)", city: "Città", internalDistribution: "Distribuzione interna", noData: "Nessun dato disponibile.", totalUsers: "Utenti totali", active7d: "Attivi ultimi 7 giorni", active30d: "Attivi ultimi 30 giorni", activeGyms: "Palestre attive", sectorsLoaded: "Settori caricati", routesRegistered: "Vie registrate", avgRoutesPerUser: "Media vie per utente", monthlyGrowth: "Crescita mensile utenti", monthlyRetention: "Retention mensile", activeVsRegistered: "% attivi / registrati", avgProgressUser: "Progressione media utente", improvement3m: "Miglioramento medio (3 mesi)", avgTimeNextLevel: "Tempo medio livello successivo", boulderVsLead: "% Boulder vs Lead", avgAttemptsPerRoute: "Tentativi medi per via", weeklyFrequency: "Frequenza settimanale media", topDays: "Giorni più frequentati", topHours: "Fasce orarie attive", returnRate: "Tasso di ritorno" }, dash: { switchView: "CAMBIA VISTA", logout: "ESCI", exploreGyms: "Trova la tua prossima sessione", searchGyms: "Cerca una palestra...", favouriteGyms: "Le tue palestre preferite", discoverGyms: "Scopri tutte le palestre", addToFavourites: "Aggiungi ai preferiti", removeFromFavourites: "Rimuovi dai preferiti", sectors: "Settori", back: "← Indietro", manageRoutes: "GESTISCI VIE", replace3d: "SOSTITUISCI 3D", exploreSectors: "Esplora i settori", gymPresentation: "Presentazione", noGymDescription: "Palestra su Climby. Esplora i settori in 3D e scopri le vie.", profileTitle: "Il tuo profilo", tabExplore: "Esplora palestre", tabProfile: "Profilo utente", tabChallenges: "Sfide", tabSocial: "Social", tabProfileShort: "Profilo", usersTab: "Utenti", findUsers: "Trova utenti", searchUsers: "Cerca username...", follow: "Segui", unfollow: "Seguito", followingProgress: "Feed Social", noFollowingProgress: "Segui utenti e chiedi di condividere i progressi per vedere il feed.", searchStart: "Digita uno username per cercare utenti", noUserResults: "Nessun utente trovato", socialPublicProfile: "Profilo pubblico", followers: "Follower", followingCount: "Seguiti", publicContent: "Contenuti pubblici", publicRoutes: "Percorsi pubblici", publicFeedbacks: "Feedback pubblici", noPublicContent: "Nessun contenuto pubblico disponibile.",  maxGrade: "Grado massimo", totalSends: "Vie scalate", activeDays: "Giorni attivi", reviewedGyms: "Palestre", latestProgress: "Ultimi progressi", noProgress: "Nessun progresso registrato: inizia a votare e commentare le vie.", recentCommunity: "Progressi palestra", profileSubtitle: "Le tue statistiche di arrampicata", maxLevelReached: "Livello massimo raggiunto", nextLevel: "Prossimo livello", progressionToNext: "Progressione verso il prossimo livello", progressionTitle: "Crescita nel tempo", progressionHint: "Il livello massimo è storico: non regredisce con sessioni leggere.", projectsActive: "Progetti attivi", maxMilestone: "Traguardo storico", levelMastery: "Consolidamento livello", noMilestones: "Nessun milestone ancora: continua a registrare salite.", latestActivities: "Ultime attività", globalMaxLevel: "Livello massimo globale", normalizedLevel: "Livello normalizzato", localMaxByGym: "Massimo per palestra", globalProgressHint: "Progressione globale basata su livello normalizzato interno", openGymProgress: "Mostra progressi", hideGymProgress: "Nascondi progressi", communityEmpty: "Nessun progresso in questa palestra.", available3d: "Disponibile in 3D", preparing3d: "3D in arrivo", explore3dCta: "Esplora in 3D", gym3dTitle: "Settori immersivi in 3D", gym3dDesc: "Apri il modello 3D della palestra e scegli subito il settore da esplorare." },
                admin: { createSector: "Crea Nuovo Settore", sectorNamePlaceholder: "Nome (es. Sala Boulder)", publish: "PUBBLICA", gymProfileTitle: "Scheda anagrafica palestra", gymDescription: "Descrizione palestra", saveGymProfile: "SALVA INFORMAZIONI", boulderingHeight: "Bouldering altezza (m)", boulderingArea: "Bouldering superficie (m²)", leadHeight: "Lead altezza (m)", leadArea: "Lead superficie (m²)", outdoorHeight: "Outdoor altezza (m)", outdoorArea: "Outdoor superficie (m²)", speedHeight: "Speed altezza (m)", speedArea: "Speed superficie (m²)", liveData: "Dati Live Percorsi", userCoverageTitle: "Copertura Utenti", periodFilter: "Periodo", last7Days: "Ultimi 7 giorni", last30Days: "Ultimi 30 giorni", last90Days: "Ultimi 90 giorni", filters: "🔎 Filtri", customPeriod: "Personalizzato", allSectors: "Tutti i settori", allGrades: "Tutti i gradi", onlyActiveRoutes: "Solo vie attive", onlyReviewedRoutes: "Solo vie recensite", sortSectorAvg: "Ordina settore: media", sortSectorReviews: "Ordina settore: recensioni", totalUsersGym: "Utenti totali palestra", activeUsersLast30Days: "Attivi ultimi 30 giorni", selectedCoverage: "Copertura periodo", trendActivity: "Trend attività", topUsersSector: "Top 3 utenti settore", yourSectors: "I Tuoi Settori", sector: "Settore", route: "Via", votes: "Voti", average: "Media", gradeSystemTitle: "Sistema gradi palestra", gradeSystemHint: "Inserisci un grado per riga, dal più basso al più alto. Verrà salvato anche l'ordine numerico.", gradeSystemPlaceholder: "Es.\nVerde\nBlu\nViola\nRosso", saveGradeSystem: "SALVA SISTEMA GRADI", gradeSetupRequiredTitle: "Configura i gradi della palestra", gradeSetupRequiredHint: "Prima di usare il pannello admin devi configurare il sistema gradi in ordine crescente.", gradeSystemSaved: "Sistema gradi salvato con successo.", navDashboard: "1️⃣ Dashboard", navSectorsRoutes: "2️⃣ Settori & Vie", navUsers: "4️⃣ Utenti", navSettings: "5️⃣ Impostazioni", navDashboardSimple: "Dashboard", navSectorsRoutesSimple: "Settori & Vie", navUsersSimple: "Utenti", navSettingsSimple: "Impostazioni", activityLast30: "📈 Attività ultimi 30 giorni", sectorPerformance: "🧱 Performance settori", sortBy: "Ordina per", sortMost: "Più attivo", sortLeast: "Meno attivo", routesRegistered30d: "Vie registrate 30g", sector: "Settore", activeUsers: "Utenti attivi", routesRegistered: "Vie registrate", coveragePercent: "% Copertura", totalUsers: "Totale utenti", activeLast30: "Attivi ultimi 30 giorni", top10Users: "Top 10 utenti", feedbackAnalyticsUsers: "💬 Analytics Feedback Utenti", loadingFeedback: "Caricamento analytics feedback...", reviewsLast30: "Recensioni ultimi 30 giorni", feedbackLoadError: "Errore nel caricamento analytics feedback.", sectorsTitle: "Settori", sectorsSubtitle: "Gestisci i settori e i modelli 3D della tua palestra", createSectorCta: "➕ Crea nuovo settore", select3dModel: "Seleziona modello 3D", noModelSelected: "Nessun modello selezionato", modelLoaded: "Modello caricato", no3dModel: "Nessun modello 3D", replaceModel3d: "Sostituisci modello 3D", deleteSector: "Elimina settore", deleteSectorTitle: "🗑 Elimina settore", deleteSectorConfirmText: "Sei sicuro di voler eliminare questo settore? Tutte le vie associate verranno rimosse definitivamente.", cancel: "Annulla", deleteForever: "Elimina definitivamente", sectorAnalysis: "Analisi per settore", replaceModelConfirm: "Confermi la sostituzione del modello 3D di questo settore? Le vie esistenti manterranno i loro routeId e lo storico utenti non verrà cancellato.", replaceModelDone: "Modello sostituito con successo." },
                viewer: { close: "CHIUDI", configureRoute: "Configura Via", save: "SALVA", delete: "ELIMINA", comment: "Commento", commentPlaceholder: "Beta, ricordi, tutto qui...", publicCommentPlaceholder: "Com'è la beta? È morfologica? Divertente?", submitReview: "INVIA VALUTAZIONE", publishFeedback: "PUBBLICA FEEDBACK", grade: "Grado", rating: "Valutazione", gradePerception: "Percezione del grado", gradeFeelEasy: "Facile", gradeFeelBenchmark: "Benchmark", gradeFeelHard: "Duro", avgRating: "Media", noVotesYet: "Ancora nessun voto", noComment: "(Senza commento)", selectStar: "Per favore, seleziona almeno una stella!", reviewSuccess: "Feedback inviato con successo!", reviewAlreadySent: "Hai già lasciato una recensione per questa via.", confirmDelete: "Eliminare?", sendDate: "Data", tries: "Tentativi", proposeGrade: "Proponi un grado", proposeGradePlaceholder: "Stesso grado", proposedGrade: "Grado proposto", proposedGradePlaceholder: "Es. 6c+", proposedGradeOptional: "Grado proposto (opzionale)", proposedGradeShortPlaceholder: "Es. 6c+", routeGradePlaceholder: "Es. 6c+", today: "Oggi", yesterday: "Ieri", lastSaturday: "Sabato scorso", lastSunday: "Domenica scorsa", ascentType: "Esito", climbed: "Scalata", project: "Progetto", publicFeedback: "Feedback pubblico", progressTracker: "Progress tracker", myClimbTab: "La mia scalata", rateRouteTab: "Valuta la via", yourProgressState: "Stato personale", addToProject: "Aggiungi a progetto", markAsClimbed: "Segna come scalata", projectStateHint: "La sto lavorando", climbedStateHint: "L'ho completata", saveProject: "Aggiorna progetto", saveClimbed: "Aggiorna scalata", saveClimb: "SALVA SCALATA", firstAttemptDate: "Prima prova", completionDate: "Completamento", finalGrade: "Grado finale", personalNotes: "Note personali", personalNotesPlaceholder: "Appunti privati su beta, sensazioni, obiettivi...", shareOnFeed: "Condividi aggiornamento nel feed", trackerSaved: "Progress tracker aggiornato", trackerNone: "Via non ancora aggiunta al tuo tracker.", sortProgress: "Filtro progressi", filterAll: "Tutti", filterProject: "Progetti", filterClimbed: "Scalate", startGuideTitle: "📍 Crea lo start della via", startGuideText: "Tocca nel modello 3D il punto di inizio della via per impostare lo START.", startGuideAcknowledge: "Ho capito", startGuideDontShow: "Non mostrare più", moveGuideTitle: "🎯 Suggerimento navigazione", moveGuideHeader: "Muovi la parete", moveGuideText: "Trascina con un dito per ruotare.\nUsa due dita per spostare la vista.\nPizzica per zoommare.", moveGuideClose: "Ho capito" },
                gym: { tabInfo: "Informazioni", tabSectors: "Settori", tabDetails: "Dettagli palestra", aboutGym: "Card Contatti", address: "Indirizzo", phone: "Telefono", emailLabel: "Email", website: "Sito web", climbingArea: "Climbing area", bouldering: "Bouldering", lead: "Lead", outdoor: "Outdoor", speed: "Speed", height: "Altezza", area: "Superficie", noValue: "-", sectorsAvailable: "Settori della palestra", userCoverage: "Copertura Utenti", totalGymUsers: "Utenti palestra", active30dUsers: "Attivi ultimi 30 giorni", coveragePercent: "Copertura", coverageLegend: "{{active}} utenti attivi su {{total}} frequentatori", sectorsHint: "Seleziona un settore per vedere le vie attuali o aprilo direttamente in 3D.", leaderboardTitle: "Classifica palestra", leaderboardHint: "Classifica mensile basata sul numero di vie scalate in questa palestra.", routesClimbed: "vie", uploadLogo: "Carica logo palestra", removeLogo: "Rimuovi logo", uploadFloorMap: "Carica piantina palestra", removeFloorMap: "Rimuovi piantina", floorMap: "Piantina palestra", noFloorMap: "Pianta non disponibile" },
                loading: { init: "Inizializzazione...", verifying: "Verifica...", updatingMesh: "Aggiornamento Mesh...", loading3d: "Caricamento 3D...", retry: "Riprova" },
                errors: { completeData: "Inserisci dati completi", firstNameRequired: "Il nome è obbligatorio.", lastNameRequired: "Il cognome è obbligatorio.", firstNameInvalid: "Nome non valido: solo lettere, almeno 2 caratteri.", lastNameInvalid: "Cognome non valido: solo lettere, almeno 2 caratteri.", birthDateRequired: "La data di nascita è obbligatoria.", cityRequired: "La città è obbligatoria.", profileLoad: "Errore durante il caricamento del profilo.", adminGymMissing: "Profilo admin senza palestra associata.", selectFile: "Seleziona file", usernameRequired: "Inserisci username", usernameInvalid: "Username non valido: usa 3-20 caratteri (lettere, numeri, _, -, .)", usernameTaken: "Username già in uso", modelLoadFailed: "Errore nel caricamento del modello", modelLoadTimeout: "Caricamento troppo lento. Riprova.", modelMeshMissing: "Modello 3D non disponibile per questo settore", authRequired: "Devi accedere per completare questa azione.", permissionDenied: "Permessi insufficienti su Firestore: controlla le regole di sicurezza.", saveFailed: "Salvataggio non riuscito. Riprova.", sectorExists: "Il settore esiste già: usa \"Sostituisci modello 3D\" per mantenerne lo storico." }
            },
            en: {
                landing: { tagline: "Explore walls in 3D, discover routes and leave your feedback. The climbers' {{h}}community{{/h}}.", start: "Get started", login: "Log in", howItWorks: "How Climby works", feature1Title: "3D walls", feature1Desc: "Explore gym sectors in an interactive 3D viewer: rotate, zoom and move on the wall as in real life.", feature2Title: "Routes & grades", feature2Desc: "Each route has a grade (5a–7a) and color. Tap hotspots on the wall to see details and choose what to try.", feature3Title: "Ratings & comments", feature3Desc: "Rate routes with stars, read community reviews and leave your feedback to help others." },
                auth: { yourName: "Your name", username: "Public username", birthDate: "Birth date", city: "City", usernameHint: "3-20 chars: letters, numbers, _, -, . (spaces become _)", usernameAvailable: "Username available", usernameChecking: "Checking username...", usernameTaken: "Username already in use", usernameInvalid: "Invalid username", gymName: "Gym name", email: "Email", password: "Password", hasAccount: "Already have an account? Log in", login: "Log in", register: "Sign up", roleUser: "Climber", roleAdmin: "Gym manager (Admin)" },
                common: { close: "Close", noData: "No data available." }, ownerRequest: { cta: "I own a gym", enterGymName: "Enter gym name.", sentSuccess: "Request sent successfully.", title: "Gym owner access request", hint: "Enter details to request gym owner access.", gymName: "Gym name", submit: "Submit request" }, superadmin: { title: "Superadmin Dashboard", subtitle: "Global aggregated KPIs (without comparing absolute grades across different gyms).", performanceTitle: "Performance KPIs (grading-safe)", performanceHint: "Performance metrics are computed within each gym and then aggregated.", behaviorTitle: "Behavioral KPIs", cityTitle: "Difficulty distribution by city (internal percentages)", city: "City", internalDistribution: "Internal distribution", noData: "No data available.", totalUsers: "Total users", active7d: "Active last 7 days", active30d: "Active last 30 days", activeGyms: "Active gyms", sectorsLoaded: "Loaded sectors", routesRegistered: "Registered routes", avgRoutesPerUser: "Avg routes per user", monthlyGrowth: "Monthly user growth", monthlyRetention: "Monthly retention", activeVsRegistered: "% active / registered", avgProgressUser: "Avg user progression", improvement3m: "Avg improvement (3 months)", avgTimeNextLevel: "Avg time to next level", boulderVsLead: "% Boulder vs Lead", avgAttemptsPerRoute: "Avg attempts per route", weeklyFrequency: "Avg weekly frequency", topDays: "Most active days", topHours: "Most active time slots", returnRate: "Return rate" }, dash: { switchView: "SWITCH VIEW", logout: "LOGOUT", exploreGyms: "Find your next session", searchGyms: "Search for a gym...", favouriteGyms: "Your favourite gyms", discoverGyms: "Discover all gyms", addToFavourites: "Add to favourites", removeFromFavourites: "Remove from favourites", sectors: "Sectors", back: "← Back", manageRoutes: "MANAGE ROUTES", replace3d: "REPLACE 3D", exploreSectors: "Explore sectors", gymPresentation: "About", noGymDescription: "Gym on Climby. Explore sectors in 3D and discover routes.", profileTitle: "Your profile", tabExplore: "Explore gyms", tabProfile: "User profile", tabChallenges: "Challenges", tabSocial: "Social", tabProfileShort: "Profile", usersTab: "Users", findUsers: "Find users", searchUsers: "Search username...", follow: "Follow", unfollow: "Following", followingProgress: "Social feed", noFollowingProgress: "Follow users and ask them to share progress to see your feed.", searchStart: "Type a username to search users", noUserResults: "No users found", socialPublicProfile: "Public profile", followers: "Followers", followingCount: "Following", publicContent: "Public posts", publicRoutes: "Public routes", publicFeedbacks: "Public feedback", noPublicContent: "No public content available.",  maxGrade: "Top grade", totalSends: "Routes climbed", activeDays: "Active days", reviewedGyms: "Gyms", latestProgress: "Latest progress", noProgress: "No progress yet: start rating and commenting routes.", recentCommunity: "Gym progress", profileSubtitle: "Your climbing statistics", maxLevelReached: "Highest level reached", nextLevel: "Next level", progressionToNext: "Progress to next level", progressionTitle: "Growth over time", progressionHint: "Highest level is historical: it never regresses on lighter sessions.", projectsActive: "Active projects", maxMilestone: "Historical milestone", levelMastery: "Level consistency", noMilestones: "No milestones yet: keep logging climbs.", latestActivities: "Latest activities", globalMaxLevel: "Global max level", normalizedLevel: "Normalized level", localMaxByGym: "Max per gym", globalProgressHint: "Global progression based on internal normalized level", openGymProgress: "Show progress", hideGymProgress: "Hide progress", communityEmpty: "No progress in this gym yet.", available3d: "Available in 3D", preparing3d: "3D coming soon", explore3dCta: "Explore in 3D", gym3dTitle: "Immersive 3D sectors", gym3dDesc: "Open the gym 3D model and jump directly into the sector you want to explore." },
                admin: { createSector: "Create new sector", sectorNamePlaceholder: "Name (e.g. Boulder room)", publish: "PUBLISH", gymProfileTitle: "Gym profile", gymDescription: "Gym description", saveGymProfile: "SAVE INFO", boulderingHeight: "Bouldering height (m)", boulderingArea: "Bouldering area (m²)", leadHeight: "Lead height (m)", leadArea: "Lead area (m²)", outdoorHeight: "Outdoor height (m)", outdoorArea: "Outdoor area (m²)", speedHeight: "Speed height (m)", speedArea: "Speed area (m²)", liveData: "Live route data", userCoverageTitle: "User coverage", periodFilter: "Period", last7Days: "Last 7 days", last30Days: "Last 30 days", last90Days: "Last 90 days", filters: "🔎 Filters", customPeriod: "Custom", allSectors: "All sectors", allGrades: "All grades", onlyActiveRoutes: "Only active routes", onlyReviewedRoutes: "Only reviewed routes", sortSectorAvg: "Sort sector: average", sortSectorReviews: "Sort sector: reviews", totalUsersGym: "Total gym users", activeUsersLast30Days: "Active last 30 days", selectedCoverage: "Period coverage", trendActivity: "Activity trend", topUsersSector: "Top 3 sector users", yourSectors: "Your sectors", sector: "Sector", route: "Route", votes: "Votes", average: "Avg", gradeSystemTitle: "Gym grade system", gradeSystemHint: "Add one grade per line, from easiest to hardest. A numeric order is stored too.", gradeSystemPlaceholder: "E.g.\nGreen\nBlue\nPurple\nRed", saveGradeSystem: "SAVE GRADE SYSTEM", gradeSetupRequiredTitle: "Set up your gym grades", gradeSetupRequiredHint: "Before using the admin panel, configure your gym grade system from easiest to hardest.", gradeSystemSaved: "Grade system saved successfully.", navDashboard: "1️⃣ Dashboard", navSectorsRoutes: "2️⃣ Sectors & Routes", navUsers: "4️⃣ Users", navSettings: "5️⃣ Settings", navDashboardSimple: "Dashboard", navSectorsRoutesSimple: "Sectors & Routes", navUsersSimple: "Users", navSettingsSimple: "Settings", activityLast30: "📈 Last 30 days activity", sectorPerformance: "🧱 Sector performance", sortBy: "Sort by", sortMost: "Most active", sortLeast: "Least active", routesRegistered30d: "Routes logged (30d)", activeUsers: "Active users", routesRegistered: "Registered routes", coveragePercent: "% coverage", totalUsers: "Total users", activeLast30: "Active last 30 days", top10Users: "Top 10 users", feedbackAnalyticsUsers: "💬 User feedback analytics", loadingFeedback: "Loading feedback analytics...", reviewsLast30: "Reviews last 30 days", feedbackLoadError: "Error loading feedback analytics.", sectorsTitle: "Sectors", sectorsSubtitle: "Manage your gym sectors and 3D models", createSectorCta: "➕ Create new sector", select3dModel: "Select 3D model", noModelSelected: "No model selected", modelLoaded: "Model uploaded", no3dModel: "No 3D model", replaceModel3d: "Replace 3D model", deleteSector: "Delete sector", deleteSectorTitle: "🗑 Delete sector", deleteSectorConfirmText: "Are you sure you want to delete this sector? All linked routes will be permanently removed.", cancel: "Cancel", deleteForever: "Delete permanently", sectorAnalysis: "Sector Analysis", replaceModelConfirm: "Confirm replacing this sector 3D model? Existing routes keep their routeId and user history is not deleted.", replaceModelDone: "Model replaced successfully." },
                viewer: { close: "CLOSE", configureRoute: "Configure route", save: "SAVE", delete: "DELETE", comment: "Comment", commentPlaceholder: "Beta, memories, anything goes here...", publicCommentPlaceholder: "How is the beta? Morpho? Fun?", submitReview: "SUBMIT RATING", publishFeedback: "PUBLISH FEEDBACK", grade: "Grade", rating: "Rating", gradePerception: "Grade perception", gradeFeelEasy: "Easy", gradeFeelBenchmark: "Benchmark", gradeFeelHard: "Hard", avgRating: "Average", noVotesYet: "No ratings yet", noComment: "(No comment)", selectStar: "Please select at least one star!", reviewSuccess: "Review submitted successfully!", reviewAlreadySent: "You already reviewed this route.", confirmDelete: "Delete?", sendDate: "Date", tries: "Tries", proposeGrade: "Propose grade", proposeGradePlaceholder: "Same grade", proposedGrade: "Proposed grade", proposedGradePlaceholder: "E.g. 6c+", proposedGradeOptional: "Proposed grade (optional)", proposedGradeShortPlaceholder: "E.g. 6c+", routeGradePlaceholder: "E.g. 6c+", today: "Today", yesterday: "Yesterday", lastSaturday: "Last Saturday", lastSunday: "Last Sunday", ascentType: "Result", climbed: "Climbed", project: "Project", publicFeedback: "Public feedback", progressTracker: "Progress tracker", myClimbTab: "My climb", rateRouteTab: "Rate the route", yourProgressState: "Personal state", addToProject: "Add to project", markAsClimbed: "Mark as climbed", projectStateHint: "I'm projecting it", climbedStateHint: "I completed it", saveProject: "Update project", saveClimbed: "Update climbed", saveClimb: "SAVE CLIMB", firstAttemptDate: "First attempt", completionDate: "Completion date", finalGrade: "Final grade", personalNotes: "Personal notes", personalNotesPlaceholder: "Private notes about beta, feelings, goals...", shareOnFeed: "Share update on feed", trackerSaved: "Progress tracker updated", trackerNone: "Route not yet added to your tracker.", sortProgress: "Progress filter", filterAll: "All", filterProject: "Projects", filterClimbed: "Climbed", startGuideTitle: "📍 Set the route start", startGuideText: "Tap the route start point directly on the 3D model to set START.", startGuideAcknowledge: "Got it", startGuideDontShow: "Do not show again", moveGuideTitle: "🎯 Navigation tip", moveGuideHeader: "Move the wall", moveGuideText: "Drag with one finger to rotate.\nUse two fingers to move the view.\nPinch to zoom.", moveGuideClose: "Got it" },
                gym: { tabInfo: "Information", tabSectors: "Sectors", tabDetails: "Gym details", aboutGym: "Contact details", address: "Address", phone: "Phone", emailLabel: "Email", website: "Website", climbingArea: "Climbing area", bouldering: "Bouldering", lead: "Lead", outdoor: "Outdoor", speed: "Speed", height: "Height", area: "Area", noValue: "-", sectorsAvailable: "Gym sectors", userCoverage: "User coverage", totalGymUsers: "Gym users", active30dUsers: "Active last 30 days", coveragePercent: "Coverage", coverageLegend: "{{active}} active users out of {{total}} gym users", sectorsHint: "Select a sector to see current routes or open it in 3D.", leaderboardTitle: "Gym leaderboard", leaderboardHint: "Monthly leaderboard based on routes climbed in this gym.", routesClimbed: "routes", uploadLogo: "Upload gym logo", removeLogo: "Remove logo", uploadFloorMap: "Upload floor map", removeFloorMap: "Remove floor map", floorMap: "Gym floor plan", noFloorMap: "Floor map not available" },
                loading: { init: "Loading...", verifying: "Verifying...", updatingMesh: "Updating mesh...", loading3d: "Loading 3D...", retry: "Retry" },
                errors: { completeData: "Please enter all required fields", firstNameRequired: "First name is required.", lastNameRequired: "Last name is required.", firstNameInvalid: "Invalid first name: letters only, at least 2 characters.", lastNameInvalid: "Invalid last name: letters only, at least 2 characters.", selectFile: "Select a file", usernameRequired: "Please enter a username", usernameInvalid: "Invalid username: use 3-20 chars (letters, numbers, _, -, .)", usernameTaken: "Username already in use", modelLoadFailed: "Error loading 3D model", modelLoadTimeout: "Loading took too long. Please retry.", modelMeshMissing: "3D model not available for this sector", authRequired: "You must be signed in to complete this action.", permissionDenied: "Insufficient Firestore permissions: check your security rules.", saveFailed: "Save failed. Please retry.", sectorExists: "Sector already exists: use \"Replace 3D model\" to keep route history." }
            }
        };
export const challengeLabelFallbacks = {
            sectorsTried: { it: 'Settori provati', en: 'Sectors tried' },
            sectorsTriedDesc: { it: 'Settori diversi provati nel mese.', en: 'Different sectors tried during the month.' },
            categoryExploration: { it: '🌍 Esplorazione', en: '🌍 Exploration' },
            routesCompleted: { it: 'Vie completate', en: 'Routes completed' },
            activeDays: { it: 'Giorni attivi', en: 'Active days' },
            totalPoints: { it: 'Punti totali', en: 'Total points' },
            rank: { it: 'Posizione', en: 'Rank' },
            progress: { it: 'Progresso', en: 'Progress' },
            levelBronze: { it: 'Bronzo', en: 'Bronze' },
            levelSilver: { it: 'Argento', en: 'Silver' },
            levelGold: { it: 'Oro', en: 'Gold' },
            levelPlatinum: { it: 'Platino', en: 'Platinum' },
            levelUnlocked: { it: 'Livello sbloccato', en: 'Level unlocked' }
        };

export const uiLabelFallbacks = {
            totalClosedRoutes: { it: 'Vie chiuse totali', en: 'Total routes climbed' },
            gymDays: { it: 'Giorni in palestra', en: 'Gym days' },
            consecutiveDays: { it: 'Giorni consecutivi', en: 'Consecutive days' },
            gymsTried: { it: 'Palestre provate', en: 'Gyms tried' },
            challengeCategoryActivity: { it: '🧗 Attività', en: '🧗 Activity' },
            challengeRoutesClosed: { it: 'Vie chiuse', en: 'Routes closed' },
            challengeRoutesClosedDesc: { it: 'Vie completate nel mese corrente.', en: 'Routes completed in the current month.' },
            challengeGymDays: { it: 'Giorni in palestra', en: 'Gym days' },
            challengeGymDaysDesc: { it: 'Giorni distinti con attività nel mese.', en: 'Distinct days with activity in the month.' },
            challengeMonthlyStreak: { it: 'Streak mensile', en: 'Monthly streak' },
            challengeMonthlyStreakDesc: { it: 'Massima sequenza di giorni consecutivi nel mese.', en: 'Longest consecutive streak in the month.' },
            challengeCategoryExploration: { it: '🌍 Esplorazione', en: '🌍 Exploration' },
            challengeGymsVisited: { it: 'Palestre visitate', en: 'Gyms visited' },
            challengeGymsVisitedDesc: { it: 'Palestre diverse visitate nel mese.', en: 'Different gyms visited during the month.' },
            noMonthlyBadge: { it: 'Nessun badge mensile', en: 'No monthly badge yet' },
            topMonthlyBadge: { it: 'Badge mensile principale', en: 'Top monthly badge' },
            profileBestResults: { it: 'I tuoi migliori risultati', en: 'Your best results' },
            profileActivitySnapshot: { it: 'Snapshot attività', en: 'Activity snapshot' },
            profileHeatmap30d: { it: 'Heatmap ultimi 30 giorni', en: 'Last 30 days heatmap' },
            editProfile: { it: 'Modifica profilo', en: 'Edit profile' },
            settings: { it: 'Impostazioni', en: 'Settings' },
            avgGymRating: { it: 'Media voti palestra', en: 'Average gym rating' },
            reviewedRoutes: { it: 'Vie recensite', en: 'Reviewed routes' },
            reviewsCount: { it: 'recensioni', en: 'reviews' },
            activeSectors: { it: 'Settori attivi', en: 'Active sectors' },
            trackedRoutes: { it: 'Vie tracciate', en: 'Tracked routes' },
            overview: { it: '🟢 Panoramica', en: '🟢 Overview' },
            userPerformance: { it: 'Performance utenti', en: 'User performance' },
            routesClimbed: { it: 'Vie scalate', en: 'Routes climbed' },
            mainSector: { it: 'Settore principale', en: 'Main sector' },
            previous: { it: 'Precedente', en: 'Previous' },
            next: { it: 'Successivo', en: 'Next' },
            page: { it: 'Pagina', en: 'Page' },
            feedbackReviews: { it: 'Feedback & Recensioni', en: 'Feedback & Reviews' },
            top5TopRated: { it: 'Top 5 più votate', en: 'Top 5 highest rated' },
            mostReviewed: { it: 'Più recensite', en: 'Most reviewed' },
            leastReviewed: { it: 'Meno recensite', en: 'Least reviewed' },
            seeAll: { it: 'Vedi tutte', en: 'See all' },
            avgRatingBySector: { it: 'Media voti per settore', en: 'Average rating by sector' },
            avgWord: { it: 'media', en: 'avg' },
            topRoutesByAvg: { it: 'Top vie per media voto', en: 'Top routes by average rating' },
            mostReviewedRoutes: { it: 'Vie più recensite', en: 'Most reviewed routes' },
            leastReviewedRoutes: { it: 'Vie meno recensite', en: 'Least reviewed routes' },
            none: { it: 'Nessuno', en: 'No level' },
            completed: { it: 'Completata', en: 'Completed' },
            totalReviewsLabel: { it: 'Recensioni', en: 'Reviews' },
            totalRoutesLabel: { it: 'Vie totali', en: 'Total routes' },
            avgVoteLabel: { it: 'Media voto', en: 'Average rating' },
            activeUsersLabel: { it: 'Utenti attivi', en: 'Active users' },
            top3Routes: { it: 'Top 3 vie', en: 'Top 3 routes' },
            voteDistribution: { it: 'Distribuzione voti', en: 'Vote distribution' },
            leastRated: { it: 'Meno valutate', en: 'Least rated' },
            socialNewMaxTitle: { it: '🔥 Nuovo massimo personale!', en: '🔥 New personal best!' },
            socialStreakAt: { it: 'è a', en: 'is at' },
            socialConsecutiveDays: { it: 'giorni consecutivi', en: 'consecutive days' },
            socialClimbedAt: { it: 'ha scalato', en: 'climbed' },
            socialAt: { it: 'a', en: 'at' },
            attempts: { it: 'Tentativi', en: 'Attempts' },
            deleteComment: { it: 'Elimina commento', en: 'Delete comment' },
            reply: { it: 'Rispondi', en: 'Reply' },
            noComments: { it: 'Nessun commento.', en: 'No comments.' },
            new: { it: 'Nuovo', en: 'New' },
            dailyActivityTitle: { it: 'Attività del giorno', en: 'Daily activity' },
            dailyActivity: { it: 'attività giornaliera', en: 'daily activity' },
            newPersonalBest: { it: 'Nuovo massimo personale!', en: 'New personal best!' },
            loadMore: { it: 'Carica altre', en: 'Load more' },
            seeAllClimbs: { it: 'Vedi tutte le scalate', en: 'See all climbs' },
            color: { it: 'Colore', en: 'Color' },
            newMax: { it: '🔥 Nuovo massimo', en: '🔥 New max' },
            myClimbedAt: { it: 'Hai scalato', en: 'You climbed' },
            applauseCountLabel: { it: 'applausi', en: 'applause' },
            commentsCountLabel: { it: 'commenti', en: 'comments' },
            hideComments: { it: 'Nascondi commenti', en: 'Hide comments' },
            showComments: { it: 'Mostra commenti', en: 'Show comments' },
            deletePost: { it: 'Elimina post', en: 'Delete post' },
            showAllComments: { it: 'Mostra tutti i commenti', en: 'Show all comments' },
            loginToSeePosts: { it: 'Accedi per vedere le tue pubblicazioni.', en: 'Log in to see your posts.' },
            loadingPosts: { it: 'Caricamento pubblicazioni...', en: 'Loading posts...' },
            loadPostsError: { it: 'Impossibile caricare le tue pubblicazioni.', en: 'Unable to load your posts.' },
            climbToAppearFeed: { it: 'Scala una via per comparire nel feed', en: 'Climb a route to appear in the feed' },
            limitedFeedPermissions: { it: 'Permessi feed limitati: mostra attività condivise degli amici.', en: 'Limited feed permissions: showing shared activities from friends.' },
            mainGym: { it: 'Palestra principale', en: 'Main gym' },
            maxGradeByGym: { it: 'Max grade per palestra', en: 'Max grade by gym' },
            currentStreak: { it: 'Streak attuale', en: 'Current streak' },
            streak: { it: 'Streak', en: 'Streak' },
            daysShort: { it: 'giorni', en: 'days' },
            confirmDeletePost: { it: 'Eliminare questa pubblicazione?', en: 'Delete this post?' },
            delete: { it: 'Elimina', en: 'Delete' },
            loadCommentsError: { it: 'Impossibile caricare i commenti.', en: 'Unable to load comments.' },
            viewAllComments: { it: 'Vedi tutti i commenti', en: 'View all comments' },
            noCommentsPlain: { it: 'Nessun commento', en: 'No comments' },
            myPublications: { it: 'Le mie pubblicazioni', en: 'My posts' },
            yourChallenges: { it: 'Le tue Sfide', en: 'Your Challenges' },
            monthlyChallengesNote: { it: 'Sfide mensili: progressi azzerati a inizio mese. I badge restano nello storico.', en: 'Monthly challenges: progress resets at the beginning of each month. Badges stay in your history.' },
            maxLevelReachedLabel: { it: 'Livello massimo raggiunto', en: 'Highest level reached' },
            gradeProgressionTitle: { it: 'Progressione grado', en: 'Grade progression' },
            yourLevel: { it: 'Il tuo livello', en: 'Your level' },
            noGradeProgress: { it: 'Nessuna via completata: registra una scalata per vedere la progressione.', en: 'No completed routes yet: log a climb to see your progression.' },
            profileNotificationsTitle: { it: 'Notifiche', en: 'Notifications' },
            profileNotificationsSubtitle: { it: 'Le tue notifiche più recenti', en: 'Your latest notifications' },
            sectorOverview: { it: '📊 Panoramica Settore', en: '📊 Sector Overview' }, profilePhoto: { it: 'Foto profilo', en: 'Profile photo' }, changePhoto: { it: 'Cambia foto', en: 'Change photo' }, removePhoto: { it: 'Rimuovi foto', en: 'Remove photo' }, photoUpdated: { it: 'Foto profilo aggiornata.', en: 'Profile photo updated.' }, photoRemoved: { it: 'Foto profilo rimossa.', en: 'Profile photo removed.' }
        };

const adminEventFallbacks = {
    navEvents: { it: '3️⃣ Eventi', en: '3️⃣ Events' },
    navUsers: { it: '4️⃣ Utenti', en: '4️⃣ Users' },
    navSettings: { it: '5️⃣ Impostazioni', en: '5️⃣ Settings' },
    navEventsSimple: { it: 'Eventi', en: 'Events' },
    eventsTitle: { it: 'Eventi', en: 'Events' },
    eventsSubtitle: { it: 'Crea e gestisci gli eventi standard della tua palestra', en: 'Create and manage your gym standard events' },
    eventsListTitle: { it: 'Eventi esistenti', en: 'Existing events' },
    eventsListHint: { it: 'Seleziona un evento per modificarlo oppure creane uno nuovo.', en: 'Select an event to edit it or create a new one.' },
    eventsCreate: { it: '➕ Nuovo evento', en: '➕ New event' },
    eventsCreateTitle: { it: 'Crea evento standard', en: 'Create standard event' },
    eventsEditTitle: { it: 'Modifica evento', en: 'Edit event' },
    eventsEditorHint: { it: 'In questa fase puoi gestire solo eventi standard.', en: 'In this phase you can manage standard events only.' },
    eventsFieldTitle: { it: 'Titolo evento', en: 'Event title' },
    eventsFieldSummary: { it: 'Riassunto breve', en: 'Short summary' },
    eventsFieldDescription: { it: 'Descrizione evento', en: 'Event description' },
    eventsSave: { it: 'Salva evento', en: 'Save event' },
    eventsEnd: { it: 'Segna come concluso', en: 'Mark as ended' },
    eventsCancel: { it: 'Annulla evento', en: 'Cancel event' },
    eventsEmpty: { it: 'Nessun evento presente. Crea il primo evento della palestra.', en: "No events yet. Create the gym's first event." },
    eventsUntitled: { it: 'Evento senza titolo', en: 'Untitled event' },
    eventsSaved: { it: 'Evento salvato.', en: 'Event saved.' },
    eventsPublished: { it: 'Evento pubblicato.', en: 'Event published.' },
    eventsEnded: { it: 'Evento concluso.', en: 'Event ended.' },
    eventsCancelled: { it: 'Evento annullato.', en: 'Event cancelled.' },
    eventsStatusDraft: { it: 'Bozza', en: 'Draft' },
    eventsStatusPublished: { it: 'Pubblicato', en: 'Published' },
    eventsStatusEnded: { it: 'Concluso', en: 'Ended' },
    eventsStatusCancelled: { it: 'Annullato', en: 'Cancelled' },
    eventsRegistrationDisabledHint: { it: 'Apri le registrazioni per permettere agli utenti di iscriversi a questo evento', en: 'Enable registrations to let users sign up for this event' },
    eventsRegistrationsTitle: { it: 'Registrazioni', en: 'Registrations' },
    eventsRegistrationsHint: { it: 'Elenco partecipanti registrati per questo evento.', en: 'Participant registration list for this event.' },
    eventsParticipantsCount: { it: 'partecipanti', en: 'participants' },
    eventsRegistrationsLoading: { it: 'Caricamento registrazioni...', en: 'Loading registrations...' },
    eventsRegistrationsSearchPlaceholder: { it: 'Cerca partecipante', en: 'Search participant' },
    eventsRegistrationsSearchEmpty: { it: 'Nessun partecipante corrisponde alla ricerca.', en: 'No participants match your search.' },
    eventsRegistrationsEmpty: { it: 'Nessuna registrazione per questo evento.', en: 'No registrations for this event.' },
    eventsRegistrationsStatus: { it: 'Stato', en: 'Status' },
    eventsRegistrationsRegisteredAt: { it: 'Registrato il', en: 'Registered at' },
    eventsRegistrationCheckIn: { it: 'Check-in', en: 'Check in' },
    eventsRegistrationUndoCheckIn: { it: 'Annulla check-in', en: 'Undo check-in' },
    eventsCancelRegistration: { it: 'Annulla registrazione', en: 'Cancel registration' },
    eventsFilterStatus: { it: 'Filtro stato', en: 'Status filter' },
    eventsFilterAll: { it: 'Tutti', en: 'All' },
    eventsVisibleSectionTitle: { it: 'Attivi e futuri', en: 'Active and upcoming' },
    eventsVisibleSectionHint: { it: 'Mostra subito gli eventi da gestire ora o a breve.', en: 'Shows the events you need to manage now or soon.' },
    eventsVisibleEmpty: { it: 'Nessun evento attivo o futuro con questo filtro.', en: 'No active or upcoming events for this filter.' },
    eventsArchiveTitle: { it: 'Archivio eventi', en: 'Event archive' },
    eventsArchiveHint: { it: 'Eventi passati o conclusi, nascosti di default per alleggerire la lista.', en: 'Past or ended events, hidden by default to keep the list lighter.' },
    eventsArchiveEmpty: { it: 'Nessun evento archiviato.', en: 'No archived events.' },
    eventsTimingLive: { it: 'In corso', en: 'Live' },
    eventsTimingUpcoming: { it: 'Futuro', en: 'Upcoming' },
    eventsTimingPast: { it: 'Passato', en: 'Past' },
    eventsSectionBasicTitle: { it: 'Informazioni base', en: 'Basic information' },
    eventsSectionBasicHint: { it: 'Titolo, descrizione e orari principali dell\'evento.', en: 'Title, description, and main event schedule.' },
    eventsSectionRegistrationTitle: { it: 'Registrazione', en: 'Registration' },
    eventsSectionRegistrationHint: { it: 'Controlla se gli utenti possono iscriversi a questo evento.', en: 'Control whether users can sign up for this event.' },
    eventsSectionCompetitionTitle: { it: 'Gara live', en: 'Live competition' },
    eventsSectionCompetitionHint: { it: 'Attiva la gara live e imposta quanti blocchi ci sono.', en: 'Enable live competition and set how many blocks there are.' },
    eventsFieldStartsAt: { it: 'Inizio evento', en: 'Event start' },
    eventsFieldEndsAt: { it: 'Fine evento', en: 'Event end' },
    eventsEventStatusLabel: { it: 'Stato evento', en: 'Event status' },
    eventsCompetitionEnabled: { it: 'Abilita gara live per questo evento', en: 'Enable live competition for this event' },
    eventsCompetitionStatusLabel: { it: 'Stato gara', en: 'Competition status' },
    eventsCompetitionStatusDraft: { it: 'Da preparare', en: 'To prepare' },
    eventsCompetitionStatusLive: { it: 'Aperta', en: 'Open' },
    eventsCompetitionStatusClosed: { it: 'Conclusa', en: 'Finished' },
    eventsCompetitionFormatLabel: { it: 'Formato gara', en: 'Competition format' },
    eventsCompetitionFormatPlaceholder: { it: 'Es. Boulder contest / Qualifica / Finale', en: 'E.g. Boulder contest / Qualification / Final' },
    eventsCompetitionTypeLabel: { it: 'Tipo gara', en: 'Competition type' },
    eventsCompetitionTypeAll: { it: 'Tutte le vie dei settori scelti', en: 'All routes in selected sectors' },
    eventsCompetitionTypeManual: { it: 'Solo selezione manuale vie', en: 'Manual route selection only' },
    eventsCompetitionSectorLabel: { it: 'Settori inclusi nella gara', en: 'Sectors included in competition' },
    eventsCompetitionSectorHint: { it: 'Seleziona uno o più settori inclusi nella gara live.', en: 'Select one or more sectors included in the live competition.' },
    eventsCompetitionNoSectors: { it: 'Nessun settore disponibile per questa palestra.', en: 'No sectors available for this gym.' },
    eventsCompetitionUseEventSchedule: { it: 'Usa gli stessi orari dell\'evento', en: 'Use the same schedule as the event' },
    eventsCompetitionScheduleHint: { it: 'Compila questi campi solo se la gara live ha orari diversi dall\'evento principale.', en: 'Fill these fields only if the live competition has a different schedule from the main event.' },
    eventsCompetitionStartsAtLabel: { it: 'Inizio gara live', en: 'Competition start' },
    eventsCompetitionEndsAtLabel: { it: 'Fine gara live', en: 'Competition end' }
};

const gymEventFallbacks = {
    tabEvents: { it: 'Eventi', en: 'Events' },
    eventsTitle: { it: 'Eventi palestra', en: 'Gym events' },
    eventsHint: { it: 'Scopri subito gli eventi attivi e futuri, con archivio separato per i passati.', en: 'See active and upcoming events first, with a separate archive for past ones.' },
    eventsEmpty: { it: 'Nessun evento visibile per questa palestra.', en: 'No visible events for this gym yet.' },
    eventsSelectHint: { it: 'Seleziona un evento per vedere i dettagli.', en: 'Select an event to see its details.' },
    eventsUntitled: { it: 'Evento senza titolo', en: 'Untitled event' },
    eventsWhen: { it: 'Quando', en: 'When' },
    eventsStatusLabel: { it: 'Stato', en: 'Status' },
    eventsStatusPublished: { it: 'Pubblicato', en: 'Published' },
    eventsStatusEnded: { it: 'Concluso', en: 'Ended' },
    eventsStatusLive: { it: 'Live', en: 'Live' },
    eventsParticipantsLabel: { it: 'Partecipanti', en: 'Participants' },
    eventsRegistrationLabel: { it: 'Registrazione', en: 'Registration' },
    eventsRegistrationNotRegistered: { it: 'Non registrato', en: 'Not registered' },
    eventsRegistrationRegistered: { it: 'Registrato', en: 'Registered' },
    eventsRegistrationChecked_in: { it: 'Check-in effettuato', en: 'Checked in' },
    eventsRegistrationCancelled: { it: 'Registrazione annullata', en: 'Cancelled' },
    eventsRegister: { it: 'Registrati', en: 'Register' },
    eventsRegistrationRegisteredCta: { it: 'Sei registrato', en: 'You are registered' },
    eventsRegistrationCheckInCompleted: { it: 'Check-in completato', en: 'Check-in completed' },
    eventsRegistrationEventClosedCta: { it: 'Evento concluso', en: 'Event ended' },
    eventsRegistrationClosedCta: { it: 'Registrazioni chiuse', en: 'Registrations closed' },
    eventsCancelRegistration: { it: 'Annulla registrazione', en: 'Cancel registration' },
    eventsRegistrationUnavailable: { it: 'Le iscrizioni a questo evento non sono aperte al momento.', en: 'Sign-ups for this event are not open right now.' },
    eventsRegistrationClosed: { it: 'Le iscrizioni per questo evento non sono disponibili in questa fase.', en: 'Sign-ups for this event are not available at this stage.' },
    eventsRegistrationUpdating: { it: 'Aggiornamento...', en: 'Updating...' },
    eventsCompetitionLiveCheckInRequired: { it: "La competition live si sblocca solo dopo il check-in confermato dall'admin.", en: 'Competition live unlocks only after admin check-in is confirmed.' },
    eventsCompetitionLiveCheckInAlert: { it: "Non puoi aprire la competition live finché l'admin non conferma il tuo check-in.", en: 'You cannot open competition live until admin check-in is confirmed.' },
    eventsVisibleSectionTitle: { it: 'Attivi e futuri', en: 'Active and upcoming' },
    eventsVisibleSectionHint: { it: 'Mostra subito gli eventi disponibili adesso o in arrivo.', en: 'Shows the events available now or coming soon.' },
    eventsVisibleEmpty: { it: 'Nessun evento attivo o futuro disponibile.', en: 'No active or upcoming events available.' },
    eventsArchiveTitle: { it: 'Archivio eventi', en: 'Event archive' },
    eventsArchiveHint: { it: 'Eventi passati o annullati, nascosti di default per alleggerire la lista.', en: 'Past or cancelled events, hidden by default to keep the list lighter.' },
    eventsArchiveEmpty: { it: 'Nessun evento archiviato.', en: 'No archived events.' },
    eventsTimingLive: { it: 'In corso', en: 'Live' },
    eventsTimingUpcoming: { it: 'Prossimo', en: 'Upcoming' },
    eventsArchiveStatus: { it: 'Archivio', en: 'Archived' },
    eventsTypeStandard: { it: 'Standard', en: 'Standard' },
    eventsTypeCompetitionLive: { it: 'Gara live', en: 'Live competition' },
    eventsOpenCta: { it: 'Apri evento', en: 'Open event' },
    eventsCompetitionLiveTitle: { it: 'Gara live', en: 'Live competition' },
    eventsCompetitionLiveSubtitle: { it: 'Accedi alla gara, controlla i completamenti e riapri i settori nel 3D.', en: 'Access the competition, check your completions, and reopen sectors in 3D.' },
    eventsCompetitionLiveStartsLabel: { it: 'Inizio gara', en: 'Competition start' },
    eventsCompetitionLiveEndsLabel: { it: 'Fine gara', en: 'Competition end' },
    eventsCompetitionAccessLabel: { it: 'Accesso gara', en: 'Competition access' },
    eventsCompetitionCompletedLabel: { it: 'Route completate', en: 'Completed routes' },
    eventsCompetitionSectorsLabel: { it: 'Settori in gara', en: 'Competition sectors' },
    eventsCompetitionSectorLabel: { it: 'Settore', en: 'Sector' },
    eventsCompetitionSectorCountSingle: { it: 'settore', en: 'sector' },
    eventsCompetitionSectorCountPlural: { it: 'settori', en: 'sectors' },
    eventsCompetitionSectorCompletedSingle: { it: 'route completata', en: 'completed route' },
    eventsCompetitionSectorCompletedPlural: { it: 'route completate', en: 'completed routes' },
    eventsCompetitionSectorNoProgress: { it: 'Nessun progresso in questo settore', en: 'No progress in this sector yet' },
    eventsCompetitionLoading: { it: 'Caricamento…', en: 'Loading…' },
    eventsCompetitionAccessLocked: { it: 'Disponibile dopo check-in', en: 'Available after check-in' },
    eventsCompetitionAccessAvailable: { it: 'Pronta da iniziare', en: 'Ready to start' },
    eventsCompetitionAccessReady: { it: 'Partecipazione attiva', en: 'Active participation' },
    eventsCompetitionAccessOpen: { it: 'Gara aperta', en: 'Competition open' },
    eventsCompetitionAccessClosed: { it: 'Gara chiusa', en: 'Competition closed' },
    eventsCompetitionActionLocked: { it: 'Attendi check-in admin', en: 'Wait for admin check-in' },
    eventsCompetitionActionClosed: { it: 'Gara chiusa', en: 'Competition closed' },
    eventsCompetitionActionStart: { it: 'Inizia gara', en: 'Start competition' },
    eventsCompetitionActionContinue: { it: 'Continua gara', en: 'Continue competition' },
    eventsCompetitionActionOpen: { it: 'Gara aperta', en: 'Competition open' },
    eventsCompetitionLiveReadyHint: { it: 'Puoi continuare la gara e aprire uno dei settori inclusi nel 3D.', en: 'You can continue the competition and open one of the included sectors in 3D.' },
    eventsCompetitionClosedMessage: { it: 'La gara è chiusa: puoi vedere i progressi salvati, ma non modificarli più.', en: 'This competition is closed: you can view saved progress, but you can no longer change it.' },
    eventsCompetitionSectorListTitle: { it: 'Settori gara', en: 'Competition sectors' },
    eventsCompetitionSectorListHint: { it: 'Apri un settore per continuare dal modello 3D.', en: 'Open a sector to continue from the 3D model.' },
    eventsCompetitionOpenSectorCta: { it: 'Apri settore nel 3D', en: 'Open sector in 3D' },
    eventsCompetitionCloseCta: { it: 'Chiudi gara', en: 'Close competition' },
    eventsCompetitionNoSectors: { it: 'Nessun settore disponibile nella gara.', en: 'No sectors available in this competition.' }
};

export const emailVerificationFallbacks = {
            title: { it: 'Verifica la tua email', en: 'Verify your email' },
            description: { it: "Devi verificare la tua email prima di usare Climby. Controlla la posta (anche la cartella Spam) e clicca il link di verifica.", en: 'You must verify your email before using Climby. Check your inbox (including Spam/Junk) and click the verification link.' },
            sentAfterSignup: { it: "Controlla la tua email per verificare l'account (controlla anche nella cartella Spam).", en: 'Check your email to verify your account (also check Spam/Junk folder).' },
            resend: { it: 'Reinvia email di verifica', en: 'Resend verification email' },
            resent: { it: 'Email di verifica inviata nuovamente. Controlla anche nello Spam.', en: 'Verification email sent again. Please check Spam/Junk too.' },
            refresh: { it: 'Ho verificato, aggiorna stato', en: 'I verified it, refresh status' },
            stillUnverified: { it: 'Email non ancora verificata.', en: 'Email is not verified yet.' }
        };

export const notificationsFallbacks = {
            title: { it: 'Notifiche', en: 'Notifications' },
            empty: { it: 'Nessuna notifica disponibile', en: 'No notifications available' }, loading: { it: 'Caricamento notifiche...', en: 'Loading notifications...' }, loadError: { it: 'Errore caricamento notifiche. Riprova tra poco.', en: 'Error loading notifications. Please retry later.' },
            unread: { it: 'Non letta', en: 'Unread' },
            read: { it: 'Letta', en: 'Read' },
            POST_LIKE: { it: 'Ha messo like alla tua pubblicazione.', en: 'Liked your post.' },
            POST_COMMENT: { it: 'Ha commentato la tua pubblicazione.', en: 'Commented on your post.' },
            NEW_SECTOR: { it: 'Nuovo settore disponibile nella palestra.', en: 'New sector available in the gym.' },
            SECTOR_RESET: { it: 'Nuova tracciatura in un settore della palestra.', en: 'New route setting in a gym sector.' },
            TOP10_ENTER: { it: 'Sei entrato nella Top 10 della palestra.', en: 'You entered the gym Top 10.' },
            RANK_OVERTAKEN: { it: 'Qualcuno ti ha superato in classifica.', en: 'Someone overtook you in leaderboard.' },
            WELCOME: { it: 'Benvenuto su Climby! Inizia ad esplorare le palestre.', en: 'Welcome to Climby! Start exploring gyms.' }, gymFollowEnabled: { it: 'Riceverai notifiche da questa palestra', en: 'You will receive notifications from this gym' }, gymFollowDisabled: { it: 'Notifiche disattivate per questa palestra', en: 'Notifications disabled for this gym' }, gymFollowOnShort: { it: 'Notifiche ON', en: 'Alerts ON' }, gymFollowOffShort: { it: 'Notifiche OFF', en: 'Alerts OFF' }
        };

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].challenges = translations[lang].challenges || {};
    for (const [k, values] of Object.entries(challengeLabelFallbacks)) {
        if (!translations[lang].challenges[k]) translations[lang].challenges[k] = values[lang];
    }
}

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].ui = translations[lang].ui || {};
    for (const [k, values] of Object.entries(uiLabelFallbacks)) {
        if (!translations[lang].ui[k]) translations[lang].ui[k] = values[lang];
    }
}

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].admin = translations[lang].admin || {};
    for (const [k, values] of Object.entries(adminEventFallbacks)) {
        if (!translations[lang].admin[k]) translations[lang].admin[k] = values[lang];
    }
}

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].gym = translations[lang].gym || {};
    for (const [k, values] of Object.entries(gymEventFallbacks)) {
        if (!translations[lang].gym[k]) translations[lang].gym[k] = values[lang];
    }
}

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].emailVerification = translations[lang].emailVerification || {};
    for (const [k, values] of Object.entries(emailVerificationFallbacks)) {
        if (!translations[lang].emailVerification[k]) translations[lang].emailVerification[k] = values[lang];
    }
}

for (const lang of ['it', 'en']) {
    translations[lang] = translations[lang] || {};
    translations[lang].notifications = translations[lang].notifications || {};
    for (const [k, values] of Object.entries(notificationsFallbacks)) {
        if (!translations[lang].notifications[k]) translations[lang].notifications[k] = values[lang];
    }
}
