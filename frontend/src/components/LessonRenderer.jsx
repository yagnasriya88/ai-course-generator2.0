import HeadingBlock from './blocks/HeadingBlock'
import ParagraphBlock from './blocks/ParagraphBlock'
import CodeBlock from './blocks/CodeBlock'
import ExerciseBlock from './blocks/ExerciseBlock'
import ImageBlock from './blocks/ImageBlock'
import TakeawayBlock from './blocks/TakeawayBlock'

const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  exercise: ExerciseBlock,
  image: ImageBlock,
  takeaway: TakeawayBlock,
}

function LessonRenderer({ content }) {
  return (
    <div>
      {content.map((block, i) => {
        const Block = BLOCK_COMPONENTS[block.type]
        if (!Block) return null
        return <Block key={i} block={block} />
      })}
    </div>
  )
}

export default LessonRenderer
