// Single source of truth for every Knowledge Canvas diagram type — the
// gallery, generation page, and card badges all read from this array so
// adding a new diagram type never requires touching component code, only
// this config (plus a matching agent-side entry in
// backend/app/agents/diagram_types.py and an illustration in
// DiagramIllustrations.jsx).

import { Brain, GitBranch, Milestone, Network, Workflow } from 'lucide-react'

export const DIAGRAM_TYPES = [
  {
    key: 'mindmap',
    name: 'Mind Map',
    description: 'Branch a topic out into its core ideas and details.',
    longDescription:
      'A mind map places one central topic in the middle and radiates outward into branches of related ideas, each of which can branch further into details. It\'s the best fit for exploring a broad subject and seeing how its parts relate.',
    examplePrompts: ['Machine Learning', 'Operating Systems', 'Transformers', 'Data Structures'],
    icon: Brain,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'flowchart',
    name: 'Flowchart',
    description: 'Map out a sequence of steps and decisions.',
    longDescription:
      'A flowchart shows a directed sequence of steps and decision points from start to finish. It\'s the best fit for processes with a clear order and branching outcomes, like a login flow or a deployment pipeline.',
    examplePrompts: ['User Authentication Flow', 'CI/CD Pipeline', 'Payment Processing', 'Customer Onboarding'],
    icon: Workflow,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'roadmap',
    name: 'Roadmap',
    description: 'Lay out milestones on a path toward a goal.',
    longDescription:
      'A roadmap orders stages or milestones from earliest to latest, showing progression toward a goal over time. It\'s the best fit for learning paths, career plans, or project timelines.',
    examplePrompts: ['Becoming a Backend Engineer', 'Learning Path for Data Science', 'Product Launch Plan', 'Open Source Contributor Journey'],
    icon: Milestone,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    key: 'concept_map',
    name: 'Concept Map',
    description: 'Connect related concepts with labeled relationships.',
    longDescription:
      'A concept map links ideas with labeled relationships (like "depends on" or "is a type of"), and unlike a mind map isn\'t strictly hierarchical — concepts can cross-link freely. It\'s the best fit for showing how several concepts interrelate.',
    examplePrompts: ['Object-Oriented Programming', 'Climate Change Causes', 'Database Normalization', 'Cell Biology'],
    icon: Network,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    key: 'process_diagram',
    name: 'Process Diagram',
    description: 'Visualize the stages of a real-world workflow.',
    longDescription:
      'A process diagram breaks down a real-world process into its stages and the flow between them. It\'s the best fit for business workflows, manufacturing steps, or any operational process.',
    examplePrompts: ['Order Fulfillment', 'Employee Onboarding', 'Software Release Process', 'Incident Response'],
    icon: GitBranch,
    gradient: 'from-rose-500 to-pink-600',
  },
]

export function getDiagramType(key) {
  return DIAGRAM_TYPES.find((t) => t.key === key)
}
