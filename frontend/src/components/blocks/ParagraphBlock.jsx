import renderInline from '../../utils/renderInline'

function ParagraphBlock({ block }) {
  return (
    <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-600">
      {renderInline(block.text)}
    </p>
  )
}

export default ParagraphBlock
