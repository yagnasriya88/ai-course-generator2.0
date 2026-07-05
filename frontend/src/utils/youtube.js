export function getYoutubeVideoId(watchUrl) {
  try {
    const url = new URL(watchUrl)
    return url.searchParams.get('v')
  } catch {
    return null
  }
}

export function getYoutubeEmbedUrl(watchUrl) {
  const videoId = getYoutubeVideoId(watchUrl)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function getYoutubeThumbnailUrl(watchUrl) {
  const videoId = getYoutubeVideoId(watchUrl)
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
}
