import renderInline from '../../utils/renderInline'

function HeadingBlock({ block }) {
  return (
    <h3 className="mt-8 font-display text-xl font-semibold text-slate-900 first:mt-0">
      {renderInline(block.text)}
    </h3>
  )
}

export default HeadingBlock
