import { ChatPageAnchor } from '../ChatShell';

const FAQ = [
  ['How do I invite my team?', 'Open Settings, then Members, and paste their email addresses.'],
  ['Can I import from another tool?', 'Yes, from CSV or directly from most issue trackers.'],
  ['Where is my invoice?', 'Billing, then History. Invoices are also emailed to the account owner.'],
  ['Do you offer discounts?', 'Nonprofits and schools get 50% off the Team plan.'],
];

export default function Support() {
  return (
    <div className="ex-page acme-support">
      <div>
        <h1 className="ex-title">Support</h1>
        <p className="ex-meta">
          Your conversation from the corner widget continues here, in the same chat.
        </p>
        <dl className="acme-faq">
          {FAQ.map(([question, answer]) => (
            <div key={question}>
              <dt>{question}</dt>
              <dd>{answer}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ChatPageAnchor />
    </div>
  );
}
