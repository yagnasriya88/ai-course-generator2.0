import renderInline from '../../utils/renderInline'

function TakeawayBlock({ block }) {
  return (
    <div className="mt-6 rounded-xl border border-accent-500/30 bg-accent-400/10 px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-accent-600 uppercase">Key takeaway</p>
      <p className="mt-1 text-sm text-slate-700">{renderInline(block.text)}</p>
    </div>
  )
}

export default TakeawayBlock
