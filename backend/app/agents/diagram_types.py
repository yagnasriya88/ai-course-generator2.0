"""Shared diagram-type metadata used by the guardrail and graph agents so both
speak the same human-readable names — adding a new diagram type only requires
adding an entry here, never touching the agents themselves."""

DIAGRAM_TYPE_NAMES: dict[str, str] = {
    "mindmap": "Mind Map",
    "flowchart": "Flowchart",
    "roadmap": "Roadmap",
    "concept_map": "Concept Map",
    "process_diagram": "Process Diagram",
}


def diagram_type_name(diagram_type: str) -> str:
    return DIAGRAM_TYPE_NAMES.get(diagram_type, diagram_type.replace("_", " ").title())


DIAGRAM_TYPE_GUIDANCE: dict[str, str] = {
    "mindmap": (
        "Structure: one central node for the core topic, with branches radiating "
        "outward to major sub-themes, each of which may branch further into details. "
        "Use `group` to tag which major branch a node belongs to."
    ),
    "flowchart": (
        "Structure: a directed sequence of steps/decisions from start to finish. "
        "Edge labels should describe the transition or decision outcome (e.g. 'yes', "
        "'on success'). Use `group` to tag which stage/phase a step belongs to."
    ),
    "roadmap": (
        "Structure: a progression of stages or milestones over time, ordered from "
        "earliest to latest. Use `group` to tag which phase (e.g. 'Foundations', "
        "'Advanced') a milestone belongs to."
    ),
    "concept_map": (
        "Structure: concepts connected by labeled relationships describing how they "
        "relate (e.g. 'depends on', 'is a type of'). Not strictly hierarchical — "
        "concepts can cross-link. Use `group` to cluster related concepts."
    ),
    "process_diagram": (
        "Structure: the ordered stages of a real-world process or workflow, with "
        "edges showing the flow between stages. Use `group` to tag which department "
        "or system owns each stage."
    ),
}
