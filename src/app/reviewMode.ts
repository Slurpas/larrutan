/** `?review=voices`: the clip review page for the adult (PRD §7). It saves through the dev server, so dev builds only. */
export const reviewingVoices = import.meta.env.DEV && new URLSearchParams(window.location.search).get('review') === 'voices'
