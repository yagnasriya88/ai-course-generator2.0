export function getYoutubeEmbedUrl(watchUrl) {
  try {
    const url = new URL(watchUrl)
    const videoId = url.searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
}
