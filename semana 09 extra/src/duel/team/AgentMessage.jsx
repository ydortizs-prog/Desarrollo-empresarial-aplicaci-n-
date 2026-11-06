export default function AgentMessage({ author, text }) {
  return (
    <p>
      <strong>{author}:</strong> <span>{text}</span>
    </p>
  );
}
