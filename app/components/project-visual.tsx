export function ProjectVisual({ type }: { type: "iot" | "canvas" | "agent" }) {
  if (type === "iot") {
    return (
      <div className="project-visual visual-iot" aria-hidden="true">
        <div className="device">•••</div>
        <div className="signal">)))</div>
        <div className="monitor"><i /><i /><i /><i /></div>
        <div className="checklist"><span>✓ CONNECT</span><span>✓ PROTO CHECK</span><span>✓ VALIDATED</span></div>
      </div>
    );
  }
  if (type === "canvas") {
    return (
      <div className="project-visual visual-canvas" aria-hidden="true">
        <div className="input-stack"><span>MANUAL</span><span>AI INPUT</span><span>{"JSON {…}"}</span></div>
        <div className="node-map"><i /><i /><i /><i /><i /></div>
        <div className="schema"><span>SCHEMA</span><b>□ —</b><b>○ —</b><b>◇ —</b></div>
      </div>
    );
  }
  return (
    <div className="project-visual visual-agent" aria-hidden="true">
      <div className="agent-input">INPUT</div>
      <div className="agents"><span>AGENT A ✓</span><span>AGENT B</span><span>AGENT C ↻</span></div>
      <div className="trace"><b>TRACE</b><i /><span>00:01.102 AGENT A</span><span>00:01.875 TOOL CALL</span><span>00:02.644 OUTPUT</span></div>
    </div>
  );
}
