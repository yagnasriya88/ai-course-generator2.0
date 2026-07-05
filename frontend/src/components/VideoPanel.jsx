import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { getYoutubeThumbnailUrl } from '../utils/youtube'

function VideoRow({ courseId, lessonId, video, index }) {
  const thumbnail = getYoutubeThumbnailUrl(video.url)

  return (
    <Link
      to={`/course/${courseId}/lesson/${lessonId}/video/${index}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 p-3 transition hover:border-primary-300 hover:bg-primary-50/40"
    >
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {thumbnail && (
          <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 transition group-hover:bg-slate-900/35">
          <Play className="h-5 w-5 fill-white text-white" />
        </div>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-primary-700">
        {video.title}
      </p>
    </Link>
  )
}

function VideoPanel({ courseId, lessonId, videos }) {
  if (!videos || videos.length === 0) return null

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <Play className="h-4 w-4 text-primary-600" />
        Watch &amp; learn
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {videos.map((video, index) => (
          <VideoRow
            key={video.url}
            courseId={courseId}
            lessonId={lessonId}
            video={video}
            index={index}
          />
        ))}
      </div>
    </section>
  )
}

export default VideoPanel
