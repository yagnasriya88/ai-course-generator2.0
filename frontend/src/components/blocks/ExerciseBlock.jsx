import renderInline from '../../utils/renderInline'

function ExerciseBlock({ block }) {
  return (
    <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/60 px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-primary-700 uppercase">Try it</p>
      <p className="mt-1 text-sm text-slate-700">{renderInline(block.text)}</p>
    </div>
  )
}

export default ExerciseBlock
