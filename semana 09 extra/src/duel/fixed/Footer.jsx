export default function Footer({ contact }) {
  return (
    <footer className="footer">
      <p>{contact.address}</p>
      <p>
        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
      </p>
      <p>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </footer>
  );
}
