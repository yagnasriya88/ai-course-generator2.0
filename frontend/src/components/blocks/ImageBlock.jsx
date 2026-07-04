function ImageBlock({ block }) {
  if (!block.url) return null
  return (
    <figure className="mt-4">
      <img
        src={block.url}
        alt={block.alt || ''}
        className="w-full rounded-xl border border-slate-200"
      />
      {block.alt && (
        <figcaption className="mt-1.5 text-center text-xs text-slate-400">
          {block.alt}
        </figcaption>
      )}
    </figure>
  )
}

export default ImageBlock
