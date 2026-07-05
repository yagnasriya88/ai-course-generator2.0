import { motion } from 'framer-motion'

function WeeklyActivityBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="flex h-28 items-end gap-2">
      {data.map((day, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-slate-100">
            <motion.div
              className="w-full rounded-md bg-primary-600"
              initial={{ height: 0 }}
              animate={{ height: `${(day.count / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              aria-label={`${day.label}: ${day.count} lesson${day.count === 1 ? '' : 's'} completed`}
              title={`${day.label}: ${day.count} lesson${day.count === 1 ? '' : 's'} completed`}
            />
          </div>
          <span className="text-xs font-medium text-slate-400">{day.label}</span>
        </div>
      ))}
    </div>
  )
}

export default WeeklyActivityBars
