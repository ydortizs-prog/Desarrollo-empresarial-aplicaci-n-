export default function Synopsis({ text }) {
  const html = text.replace(/\n/g, "<br />");
  return <p className="synopsis" dangerouslySetInnerHTML={{ __html: html }} />;
}
