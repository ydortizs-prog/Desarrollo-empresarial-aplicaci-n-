export default function AgentMessage({ author, text }) {
  return (
    <p className="agent-message">
      <strong>{author}:</strong> <span>{text}</span>
    </p>
  );
}
