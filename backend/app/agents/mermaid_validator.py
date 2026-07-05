import re

_BRACKET_CHARS = re.compile(r"[\[\]()=]")
_QUOTED = re.compile(r'"[^"]*"')


def validate_mermaid(aid_type: str, mermaid_text: str) -> list[str]:
    """Heuristic checks for the escaping rules given to the LLM in visual_agent.py.

    Not a real parser — targets the known failure mode (unescaped brackets/parens/
    equals signs in node labels) rather than validating full Mermaid grammar.
    """
    violations: list[str] = []
    if not mermaid_text or not mermaid_text.strip():
        violations.append("empty diagram text")
        return violations

    lines = mermaid_text.splitlines()[1:]  # skip the diagram-type declaration line

    if aid_type == "mindmap":
        for line in lines:
            if _BRACKET_CHARS.search(line):
                violations.append(f"mindmap line contains disallowed characters: {line.strip()!r}")
    else:
        for line in lines:
            # Strip already-quoted spans, then check what's left for stray bracket/paren/equals
            # runs that look like an unquoted code-ish label rather than diagram syntax itself.
            stripped = _QUOTED.sub("", line)
            if re.search(r"\[[^\[\]]*[()=][^\[\]]*\]", stripped):
                violations.append(f"unquoted code-like label: {line.strip()!r}")

    return violations
